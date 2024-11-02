import { TILE_BLINK_OVERLAY, TILE_SET_CONTAINER } from "./constants/classnames";
import { DATA_EXTENSION_INJECTION, DATA_EXTENSION_SWAPPED_TILE, DATA_EXTENSION_TRANSFORM, DATA_EXTENSION_TRANSFORM_SCALE } from "./constants/dataattributes";
import { extractTileFromImageElement, modifyTileInImageElement, Tiles } from "./tilehelper";
import { PlayerPositionArray } from "./types/types";

/**
 * @param {import("./types/types").PlayerDeclaredSet} playerDeclaredSet
 * @param {import("./types/types").PlayerPositionsInfo} playerPositionsInfo
 * @returns {import("./types/types").DeclaredSetTransformation}
 */
export function processPlayerDeclaredSets(playerDeclaredSet, playerPositionsInfo) {
    /** @type {import("./types/types").DeclaredSetTransformation}*/
    const delcaredSetTransformations = {
        Top: [],
        Left: [],
        Right: [],
        Bottom: [],
    };

    for (let position of PlayerPositionArray) {
        let isShiftToLeft = isDeclaredSetsToTheRightOfConcealedHandTiles(position);

        let player = playerPositionsInfo.players[position];
        let declaredSets = playerDeclaredSet[player].slice();

        if (isShiftToLeft) {
            declaredSets.reverse();
        }

        let previousMeldedTilesCounter = 0;
        const setTransformations = [];
        for (const declaredSet of declaredSets) {
            const setType = declaredSet.setType;
            const tiles = declaredSet.tiles.slice();
            const positionTakenFrom = playerPositionsInfo.positions[declaredSet.playerTakenFrom];

            /** @type {import("./types/types").SetTileTransformation[]} */
            let setTileTransformations = [];

            if (setType === "Chow") {
                const originalIndexOfMeldedTile = tiles.findIndex(tile => Tiles.isEqual(tile, declaredSet.takenTile));

                const targetTiles = tiles.slice();
                const takenTiles = targetTiles.splice(originalIndexOfMeldedTile, 1);
                if (isShiftToLeft) {
                    targetTiles.unshift(takenTiles[0]);
                } else {
                    targetTiles.push(takenTiles[0]);
                }

                tiles.forEach((tile, index) => {
                    let setTileTransformation = {
                        expectedTile: tile,
                        targetTile: targetTiles[index],
                        previousMeldedTilesCount: previousMeldedTilesCounter,
                        isMeldedTile: index === (isShiftToLeft ? 0 : 2),
                        isBackTileAllowed: false,
                    };
                    setTileTransformations.push(setTileTransformation);
                });
                previousMeldedTilesCounter += 1;
            } else {
                const indexOfMeldedTile = getIndexOfMeldedTile(position, positionTakenFrom, setType, isShiftToLeft);

                tiles.forEach((tile, index) => {
                    let offset;
                    if (isShiftToLeft) {
                        offset = index < indexOfMeldedTile ? 1 : 0;
                    } else {
                        offset = index > indexOfMeldedTile ? 1 : 0;
                    }
                    if (indexOfMeldedTile === -1) {
                        offset = 0;
                    }
                    let setTileTransformation = {
                        expectedTile: tile,
                        targetTile: tile,
                        previousMeldedTilesCount: previousMeldedTilesCounter + offset,
                        isMeldedTile: index === indexOfMeldedTile,
                        isBackTileAllowed: setType === "Concealed Kong" ? true : false,
                    };
                    setTileTransformations.push(setTileTransformation);
                });
                if (indexOfMeldedTile !== -1) {
                    previousMeldedTilesCounter += 1;
                }
            }

            setTransformations.push(setTileTransformations);
        }

        if (isShiftToLeft) {
            setTransformations.reverse();
        }

        delcaredSetTransformations[position] = setTransformations;
    }

    return delcaredSetTransformations;
}

/**
 * Returns the index of the melded tile within the declaredSet.tiles array.
 * @param {import("./types/types").PlayerPosition} position
 * @param {import("./types/types").PlayerPosition} positionTakenFrom
 * @param {import("./types/types").SetType} setType
 * @param {boolean} isShiftToLeft
 * @returns {number} 
 */
function getIndexOfMeldedTile(position, positionTakenFrom, setType, isShiftToLeft) {
    if (setType === "Chow") {
        return -1;
    }
    if (position === positionTakenFrom) {
        return -1;
    }

    const positionValue = positionToValue(position);
    const positionTakenFromValue = positionToValue(positionTakenFrom);

    const index = (((isShiftToLeft ? 1 : -1) * (positionValue - positionTakenFromValue)) % 4 + 4) % 4 - 1;;

    if (setType === "Pung") {
        return index;
    } else if (setType === "Added Kong" || setType === "Melded Kong") {
        return index === 2 ? 3 : index;
    } else if (setType === "Concealed Kong") {
        return -1;
    }

    return -1;
}

/**
 * @param {import("./types/types").PlayerPosition} position
 * @returns {boolean} // indicates whether the tiles should be shifted to the left
 */
function isDeclaredSetsToTheRightOfConcealedHandTiles(position) {
    return position !== "Top";
}

/** 
 * @param {number} previousMeldedTilesCount
 * @param {boolean} isShiftToLeft
 * @returns {string}
 */
function getMeldedTilesOffsetTranslationTransform(previousMeldedTilesCount, isShiftToLeft) {
    if (!isFinite(previousMeldedTilesCount)) {
        previousMeldedTilesCount = 1;
    }

    if (previousMeldedTilesCount === 0) {
        return "";
    }

    const maybeMinus = isShiftToLeft ? "-" : "";
    return `translate(${maybeMinus}${38 * previousMeldedTilesCount}%) `;
}

function getAbsolutePositionOffsetTranslationTransform() {
    return "translate(-100%) ";
}

/** 
 * @param {boolean} isShiftToLeft
 * @returns {string}
 */
function getTileMirrorAndRotationTransform(isShiftToLeft) {
    const maybeMinus = isShiftToLeft ? "" : "-"; // correction to the right
    return `rotate(-90deg) scale(1, -1) translate(-18%, ${maybeMinus}14%) `;
}

function getTileMirrorCorrectionTransform() {
    return "scale(1, -1) translate(0, -8%) ";
}



/**
 * @param {HTMLElement} imgElement 
 * @param {number} previousMeldedTilesCount 
 * @param {boolean} isShiftToLeft
 */
function modifyOriginalNonRotatedTileImgElement(imgElement, previousMeldedTilesCount, isShiftToLeft) {
    const transform = getMeldedTilesOffsetTranslationTransform(previousMeldedTilesCount, isShiftToLeft);
    imgElement.style.transform = transform;
    imgElement.setAttribute(DATA_EXTENSION_TRANSFORM, transform);
    imgElement.setAttribute(DATA_EXTENSION_TRANSFORM_SCALE, "");
}

/**
 * @param {HTMLElement} imgElement 
 * @param {number} previousMeldedTilesCount 
 * @param {boolean} isShiftToLeft
 */
function modifyOriginalRotatedTileImgElement(imgElement, previousMeldedTilesCount, isShiftToLeft) {
    imgElement.style.clipPath = "inset(10% 13% 1% 0px)";

    const transform = getMeldedTilesOffsetTranslationTransform(previousMeldedTilesCount, isShiftToLeft)
        + getTileMirrorAndRotationTransform(isShiftToLeft)
        + getTileMirrorCorrectionTransform();

    imgElement.style.transform = transform;
    imgElement.setAttribute(DATA_EXTENSION_TRANSFORM, transform);
    imgElement.setAttribute(DATA_EXTENSION_TRANSFORM_SCALE, "");
}

/**
 * @param {HTMLElement} imgElement 
 * @param {number} previousMeldedTilesCount 
 * @param {boolean} isShiftToLeft
 */
function modifyBackgroundRotatedTileImgElement(imgElement, previousMeldedTilesCount, isShiftToLeft) {
    imgElement.style.position = "absolute";
    imgElement.style.clipPath = "";
    imgElement.style.zIndex = "-1";

    const transform = getAbsolutePositionOffsetTranslationTransform()
        + getMeldedTilesOffsetTranslationTransform(previousMeldedTilesCount, isShiftToLeft)
        + getTileMirrorAndRotationTransform(isShiftToLeft);

    imgElement.style.transform = transform;

    modifyTileInImageElement(imgElement, { type: "circle", value: "1" });
    imgElement.setAttribute(DATA_EXTENSION_INJECTION, "true");
    imgElement.setAttribute(DATA_EXTENSION_TRANSFORM, transform);
    imgElement.setAttribute(DATA_EXTENSION_TRANSFORM_SCALE, "");
}

/**
 * @param {HTMLElement} tileBlinkDivElement 
 * @param {import("./types/types").SetTileTransformation} setTileTransformation 
 * @param {boolean} isShiftToLeft
 */
function modifyTileBlinkDivElement(tileBlinkDivElement, setTileTransformation, isShiftToLeft) {
    let transform = getMeldedTilesOffsetTranslationTransform(setTileTransformation.previousMeldedTilesCount, isShiftToLeft);
    if (setTileTransformation.isMeldedTile) {
        transform += getTileMirrorAndRotationTransform(isShiftToLeft);
    }

    tileBlinkDivElement.style.transform = transform;
    tileBlinkDivElement.setAttribute(DATA_EXTENSION_TRANSFORM, transform);
    tileBlinkDivElement.setAttribute(DATA_EXTENSION_TRANSFORM_SCALE, "");
}

/**
 * @param {import("./types/types").PlayerPosition} position
 * @returns {number}
 */
function positionToValue(position) {
    return {
        Bottom: 0,
        Right: 1,
        Top: 2,
        Left: 3
    }[position];
}


/**
 * @param {Element} playerHandTilesSetsContainerElement
 * @param {import("./types/types").SetTransformation[]} setTransformations
 * @returns {{nonBackgroundImgTags: import("./types/types").SetTileTransformationData[], setsTileSwaps: import("./types/types").SetTileTransformationData[][], rightAttributePixelValueIncrement: number} | undefined}
 */
function validateContainer(playerHandTilesSetsContainerElement, setTransformations) {
    /** @type {import("./types/types").SetTileTransformationData[]} */
    const nonBackgroundImgTags = [];
    /** @type {import("./types/types").SetTileTransformationData[][]} */
    const setsTileSwaps = [];

    let rightAttributePixelValueIncrement = undefined;
    let validationFailed = false;

    const tileSetContainers = playerHandTilesSetsContainerElement.querySelectorAll(`div.${TILE_SET_CONTAINER}`);
    if (tileSetContainers.length !== setTransformations.length) {
        console.error("player hand tile sets count does not match", tileSetContainers.length, setTransformations.length);
        return undefined;
    }
    tileSetContainers.forEach((tileSetContainer, setIndex) => {
        if (validationFailed) {
            return;
        }

        const childNodes = tileSetContainer.childNodes;
        const setTileTransformations = setTransformations[setIndex];
        if (childNodes.length !== setTileTransformations.length) {
            console.error("tile set tile count does not match", childNodes.length, setTileTransformations.length);
            validationFailed = true;
            return;
        }

        /** @type {import("./types/types").SetTileTransformationData[]} */
        const setTileSwap = [];
        let currentRightAttributeCounter = 0;
        let setSpecificRightAttributeIncrementStep = undefined;
        childNodes.forEach((divElement, tileIndex) => {
            if (validationFailed) {
                return;
            }

            if (!(divElement instanceof HTMLElement)) {
                console.error("found ChildNode that is not an Element");
                validationFailed = true;
                return;
            }
            if (divElement.tagName !== "DIV") {
                console.error("found non div ChildNode", divElement.tagName, divElement);
                validationFailed = true;
                return;
            }
            const rightAttribute = divElement.style.right;
            const rightAttributePixelValue = parseInt(rightAttribute.slice(0, -2));
            if (rightAttribute === "" || !rightAttribute.endsWith("px") || !isFinite(rightAttributePixelValue)) {
                console.error("unexpected right style attribute", rightAttribute, divElement);
                validationFailed = true;
                return;
            }
            if (tileIndex > 0 && setSpecificRightAttributeIncrementStep === undefined) {
                setSpecificRightAttributeIncrementStep = rightAttributePixelValue - currentRightAttributeCounter;
                if (rightAttributePixelValueIncrement === undefined) {
                    rightAttributePixelValueIncrement = setSpecificRightAttributeIncrementStep;
                } else if (rightAttributePixelValueIncrement !== setSpecificRightAttributeIncrementStep) {
                    console.error("right style attribute increment is different across sets.", rightAttributePixelValueIncrement, setSpecificRightAttributeIncrementStep, tileSetContainer);
                    validationFailed = true;
                    return;
                }
            }
            const increment = setSpecificRightAttributeIncrementStep === undefined ? 0 : setSpecificRightAttributeIncrementStep;
            if (rightAttributePixelValue !== currentRightAttributeCounter + increment) {
                console.error("unexpected right style attribute", rightAttribute, divElement);
                validationFailed = true;
                return;
            }
            currentRightAttributeCounter += increment;

            const setTileTransformation = setTileTransformations[tileIndex];
            const imgNodes = divElement.childNodes;
            const imgElements = [];
            imgNodes.forEach((imgNode) => {
                if (imgNode instanceof HTMLElement) {
                    if (imgNode.tagName === "IMG") {
                        imgElements.push(imgNode);
                    } else {
                        if (!(imgNode.tagName === "DIV" && imgNode.classList.contains(TILE_BLINK_OVERLAY))) {
                            console.error("found non img ChildNode that is not the class", TILE_BLINK_OVERLAY, imgNode);
                            validationFailed = true;
                            return;
                        }
                    }
                } else {
                    console.error("found ChildNode that is not an Element");
                    validationFailed = true;
                    return undefined;
                }
            });


            if (imgElements.length > (setTileTransformation.isMeldedTile ? 2 : 1)) {
                console.error(`Unexpected count (${imgElements.length}) of img elements given isMeldedTile=${setTileTransformation.isMeldedTile}`, imgElements);
                validationFailed = true;
                return undefined;
            }
            imgElements.forEach((imgElement, imgIndex) => {
                const swappedTileAttribute = imgElement.getAttribute(DATA_EXTENSION_SWAPPED_TILE);
                const tile = extractTileFromImageElement(imgElement);
                let hasExpectedTile;
                if (imgIndex === 0) {
                    const isBackTileAllowed = setTileTransformation.isBackTileAllowed;
                    const targetTile = setTileTransformation.targetTile;
                    const expectedTile = setTileTransformation.expectedTile;

                    const isOriginalTile = (isBackTileAllowed || Tiles.isEqual(tile, expectedTile)) && swappedTileAttribute === null;
                    const needsTileSwap = isOriginalTile && !isBackTileAllowed && !Tiles.isEqual(expectedTile, targetTile);
                    const isSwappedTile = Tiles.isEqual(tile, targetTile) && swappedTileAttribute === "true" && !isBackTileAllowed;

                    hasExpectedTile = isOriginalTile || isSwappedTile;
                    if (imgElement.nextSibling !== null && !(imgElement.nextSibling instanceof HTMLElement)) {
                        console.error("found img element with non null nextSibling but not a HTMLElement.");
                        validationFailed = true;
                        return undefined;
                    }
                    nonBackgroundImgTags.push({ element: imgElement, setTileTransformation });
                    if (needsTileSwap) {
                        setTileSwap.push({ element: imgElement, setTileTransformation });
                    }
                } else if (imgIndex === 1) {
                    hasExpectedTile = Tiles.isEqual(tile, { type: "circle", value: "1" });
                    const dataExtensionInjectionAttribute = imgElement.getAttribute(DATA_EXTENSION_INJECTION);
                    if (!setTileTransformation.isMeldedTile || dataExtensionInjectionAttribute !== "true") {
                        console.error("found at least two img elements for tile where only one is expected.", setTileTransformation, dataExtensionInjectionAttribute);
                        validationFailed = true;
                        return undefined;
                    }
                }
                if (!hasExpectedTile) {
                    console.error("img element does not have expected tile.", imgElement, setTileTransformation);
                    validationFailed = true;
                    return undefined;
                }
            });
        });
        if (![0, 2, 3].includes(setTileSwap.length)) {
            console.error("Unexpected amount of tiles to be swapped detected.", setTileSwap, tileSetContainer);
            validationFailed = true;
            return;
        }
        setsTileSwaps.push(setTileSwap);
    });

    if (validationFailed) {
        return undefined;
    }

    return {
        nonBackgroundImgTags,
        setsTileSwaps,
        rightAttributePixelValueIncrement
    };
}

/**
 * @param {import("./types/types").SetTileTransformationData[][]} setsTileSwaps
 * @param {boolean} isShiftToLeft
 * @param {number} rightAttributePixelValueIncrement
 * @returns {boolean}
 */
function performSetsTileSwaps(setsTileSwaps, isShiftToLeft, rightAttributePixelValueIncrement) {
    let didPerformSwaps = false;
    setsTileSwaps.forEach((setTileSwaps) => {
        const tileSwapsCount = setTileSwaps.length;
        if (tileSwapsCount === 0) {
            return;
        }

        if (tileSwapsCount === 2 || tileSwapsCount === 3) {
            setTileSwaps.forEach((setTileSwap) => {
                setTileSwap.element.setAttribute(DATA_EXTENSION_SWAPPED_TILE, "true");
            });


            const tileToMeldIndex = isShiftToLeft ? tileSwapsCount - 1 : 0; // magic calculation

            const tileToMeld = setTileSwaps[tileToMeldIndex].element;
            const parentDivElement = tileToMeld.parentElement;
            const containerElement = parentDivElement.parentElement;
            if (isShiftToLeft) {
                // move melded tile div container to the front (left)
                containerElement.insertBefore(parentDivElement, containerElement.firstChild);
            } else {
                // move melded tile div container to the back (right)
                containerElement.appendChild(parentDivElement);
            }


            containerElement.childNodes.forEach((childElement, index) => {
                if (!(childElement instanceof HTMLElement)) {
                    // should never happen after the validation
                    console.error("undexpected childNode found that is not a HTMLElement");
                    return;
                }
                childElement.style.right = (index * rightAttributePixelValueIncrement) + "px";
            });

            didPerformSwaps = true;
            return;
        }
    });
    return didPerformSwaps;
}

/** @type {MutationCallback} */
export const playerHandSetsStyleChangeCallback = function (mutation) {
    mutation.forEach(mut => {
        if (mut.target instanceof HTMLElement && mut.target.classList.contains(TILE_BLINK_OVERLAY)) {
            const scaleValue = mut.target.getAttribute(DATA_EXTENSION_TRANSFORM_SCALE);
            const transformBaseValue = mut.target.getAttribute(DATA_EXTENSION_TRANSFORM);

            const newStyleValue = mut.target.getAttribute(mut.attributeName);
            const newScaleValue = extractTransformScaleValue(newStyleValue, true) ?? "";
            const targetTransformValue = transformBaseValue + newScaleValue;

            let oldScaleValue = extractTransformScaleValue(mut.oldValue, true);

            if (oldScaleValue !== undefined && oldScaleValue === scaleValue) {
                return;
            }

            mut.target.style.transform = targetTransformValue;
            mut.target.setAttribute(DATA_EXTENSION_TRANSFORM_SCALE, newScaleValue);
            return;
        }

        if (!(mut.target instanceof HTMLImageElement) || mut.attributeName !== "style") {
            return;
        }
        if (mut.target.getAttribute(DATA_EXTENSION_INJECTION) === "true") {
            // we propagate style updates to DATA_EXTENSION_INJECTION ourselves
            return;
        }

        const scaleValue = mut.target.getAttribute(DATA_EXTENSION_TRANSFORM_SCALE);
        const transformBaseValue = mut.target.getAttribute(DATA_EXTENSION_TRANSFORM);

        const newStyleValue = mut.target.getAttribute(mut.attributeName);
        const newScaleValue = extractTransformScaleValue(newStyleValue, false) ?? "";

        const targetTransformValue = transformBaseValue + newScaleValue;

        let oldScaleValue = extractTransformScaleValue(mut.oldValue, false);

        if (oldScaleValue !== undefined && oldScaleValue === scaleValue) {
            return;
        }

        const nextSibling = mut.target.nextSibling;
        if (nextSibling instanceof HTMLElement && nextSibling.tagName === "IMG" && nextSibling.getAttribute(DATA_EXTENSION_INJECTION) === "true") {
            nextSibling.style.transform = nextSibling.getAttribute(DATA_EXTENSION_TRANSFORM) + newScaleValue;
            nextSibling.setAttribute(DATA_EXTENSION_TRANSFORM_SCALE, newScaleValue);
        }

        mut.target.style.transform = targetTransformValue;
        mut.target.setAttribute(DATA_EXTENSION_TRANSFORM_SCALE, newScaleValue);
    });
};


/** 
 * @param {string | undefined} style
 * @param {boolean} isForTileBlinkDiv
 * @returns {string | undefined}
 */
function extractTransformScaleValue(style, isForTileBlinkDiv) {
    if (style === null) {
        return "";
    }
    const styleAttributes = style.split(";");

    let scaleValue = undefined;
    styleAttributes.forEach((styleAttribute) => {
        if (styleAttribute.trim().startsWith("transform: ")) {
            const transformValue = styleAttribute.split(": ")[1].trim();

            if (isForTileBlinkDiv) {
                if (transformValue === "scale(1)") {
                    scaleValue = "";
                } else if (transformValue === "scale(1.8)") {
                    scaleValue = "scale(1.8) ";
                }
            } else {
                if (transformValue === "rotate(0deg) scale(1)") {
                    scaleValue = "";
                } else if (transformValue === "rotate(0deg) scale(1.8)") {
                    scaleValue = "scale(1.8) ";
                } else if (transformValue === "rotate(0deg) scale(1.2)") {
                    scaleValue = "scale(1.2) ";
                }
            }
        }
    });

    return scaleValue;
}

/**
 * @param {import("./types/types").PlayerPosition} position
 * @param {Element} playerHandTilesSetsContainerElement
 * @param {import("./types/types").SetTransformation[]} setTransformations
 */
export const validateAndModifyPlayerHandSets = function (position, playerHandTilesSetsContainerElement, setTransformations) {
    const isShiftToLeft = isDeclaredSetsToTheRightOfConcealedHandTiles(position);

    let revalidateAfterSwap = false;
    let validation;
    do {
        validation = validateContainer(playerHandTilesSetsContainerElement, setTransformations);
        if (validation === undefined) {
            console.error("validation of ", position, "player hand tiles sets container failed. ", setTransformations);
            return;
        }
        revalidateAfterSwap = performSetsTileSwaps(validation.setsTileSwaps, isShiftToLeft, validation.rightAttributePixelValueIncrement);
    } while (revalidateAfterSwap);

    validation.nonBackgroundImgTags.forEach(({ element: imageElement, setTileTransformation }) => {
        const tileBlinkDivElement = imageElement.previousElementSibling;
        if (tileBlinkDivElement instanceof HTMLElement && tileBlinkDivElement.tagName === "DIV" && tileBlinkDivElement.classList.contains(TILE_BLINK_OVERLAY)) {
            modifyTileBlinkDivElement(tileBlinkDivElement, setTileTransformation, isShiftToLeft);
        }


        const previousMeldedTilesCount = setTileTransformation.previousMeldedTilesCount;
        if (setTileTransformation.isMeldedTile) {
            modifyOriginalRotatedTileImgElement(imageElement, previousMeldedTilesCount, isShiftToLeft);
            let nextSibling = imageElement.nextSibling;
            let initialNextSibling = imageElement.nextSibling;

            while (true) {
                if (nextSibling === null || nextSibling === undefined) {
                    nextSibling = null;
                    break;
                }
                if (nextSibling instanceof HTMLElement && nextSibling.tagName === "IMG") {
                    break;
                }
                nextSibling = nextSibling?.nextSibling;
            }

            if (initialNextSibling !== nextSibling) {
                console.error("unexepcted next siblings", imageElement, imageElement.parentElement);
            }

            /** @type {Node} */
            let backgroundTileElement = nextSibling;

            if (nextSibling === null
                || (nextSibling instanceof HTMLElement
                    && nextSibling.tagName === "IMG"
                    && nextSibling.getAttribute(DATA_EXTENSION_INJECTION) !== "true")
                && nextSibling.getAttribute(DATA_EXTENSION_INJECTION) !== "true"
            ) {
                backgroundTileElement = imageElement.cloneNode();
                imageElement.parentElement.insertBefore(backgroundTileElement, imageElement.nextSibling);
            }

            if (backgroundTileElement instanceof HTMLElement) {
                modifyBackgroundRotatedTileImgElement(backgroundTileElement, previousMeldedTilesCount, isShiftToLeft);
            }

        } else {
            modifyOriginalNonRotatedTileImgElement(imageElement, previousMeldedTilesCount, isShiftToLeft);
        }
    });
};
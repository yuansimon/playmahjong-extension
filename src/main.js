import { APP_SITE_CONTAINER, BOARD_BACKGROUND, BOARD_LEFT_HAND_CONTAINER, BOARD_LEFT_INFO_AND_FLOWERS_CONTAINER, BOARD_PLAYER_HAND_CONTAINER, BOARD_PLAYER_INFO_AND_FLOWERS_CONTAINER, BOARD_RIGHT_HAND_CONTAINER, BOARD_RIGHT_INFO_AND_FLOWERS_CONTAINER, BOARD_TOP_HAND_CONTAINER, BOARD_TOP_INFO_CONTAINER, BP3_INTENT_DANGER, BP3_INTENT_SUCCESS, GAME_END_BUTTON_READY_BUTTON, GAMELOG, PLAYER_HAND_TILES_SETS_CONTAINER, ROUND_INFO, TILE_BLINK_OVERLAY } from "./constants/classnames";
import { DATA_EXTENSION_INJECTION } from "./constants/dataattributes";
import {
    playerHandSetsStyleChangeCallback,
    processPlayerDeclaredSets,
    validateAndModifyPlayerHandSets
} from "./declaredsetstransformationhelper";
import { parseGameLogs, processGameLogs } from "./gameloghelper";
import { parsePlayerPositionsInfo, parseRoundInfo } from "./roundinfohelper";
import { createObserver, querySelectorByClass } from "./util";

console.info("Loading playmahjoing.io Extension");

/** @type {import("./types/types").RoundInfo} */
let roundInfo;

/** @type {import("./types/types").PlayerPositionsInfo}*/
let playerPositionsInfo;

/** @type {import("./types/types").DeclaredSetTransformation}*/
let declaredSetTransformations = {
    Top: [],
    Left: [],
    Right: [],
    Bottom: [],
};

/** @type {MutationObserver[]} */
let observers = [];

let observerSetupRequired = true;
let resetGameState = true;

const appObserverCallback = function () {
    const boardElement = querySelectorByClass(document, BOARD_BACKGROUND);
    const readyButtonElement = document.querySelector(`.${GAME_END_BUTTON_READY_BUTTON}.${BP3_INTENT_SUCCESS}`);
    const readyButtonTextContent = readyButtonElement?.firstElementChild?.textContent;

    if (readyButtonTextContent === "Readied" || readyButtonTextContent === "Ready") {
        resetGameState = true;
    }

    if (boardElement === null) {
        observerSetupRequired = true;
        return;
    }

    if (observerSetupRequired) {
        setupObservers();
    }
};

const gameLogObserverCallback = function () {
    processGameLogsAndDeclaredSets(roundInfo, playerPositionsInfo);
};

/**
 * @param {import("./types/types").PlayerPosition} position
 * @param {Element} playerHandTilesSetsContainerElement
 * @returns {MutationCallback}
 */
const playerHandSetsObserverCallback = function (position, playerHandTilesSetsContainerElement) {
    return function (mutation) {
        const onlyInjectedNodesAdded = mutation.every(
            mut => Array.from(mut.addedNodes).every(
                node => node instanceof HTMLElement && node.tagName === "IMG" && node.getAttribute(DATA_EXTENSION_INJECTION) === "true"
            ) && Array.from(mut.removedNodes).every(
                node => node instanceof HTMLElement && node.tagName === "DIV" && node.classList.contains(TILE_BLINK_OVERLAY)
            )
        );

        if (onlyInjectedNodesAdded) {
            return;
        }
        const setTransformations = declaredSetTransformations[position];
        validateAndModifyPlayerHandSets(position, playerHandTilesSetsContainerElement, setTransformations);
    };
};

/**
 * @param {import("./types/types").RoundInfo} roundInfo
 * @param {import("./types/types").PlayerPositionsInfo} playerPositionsInfo
 * @returns {boolean}
 */
function processGameLogsAndDeclaredSets(roundInfo, playerPositionsInfo) {
    let parsedGameLogEntries = parseGameLogs(roundInfo);
    if (parsedGameLogEntries === undefined) {
        return false;
    };
    let parsedPlayerDiscardSets = processGameLogs(parsedGameLogEntries, roundInfo);
    if (parsedPlayerDiscardSets === undefined) {
        return false;
    }

    declaredSetTransformations = processPlayerDeclaredSets(parsedPlayerDiscardSets, playerPositionsInfo);
    return true;
}

function parseGameState() {
    let parsedRoundInfo = parseRoundInfo();
    if (parsedRoundInfo === undefined) {
        return;
    }
    roundInfo = parsedRoundInfo;

    let parsedplayerPositionsInfo = parsePlayerPositionsInfo(roundInfo);
    if (parsedplayerPositionsInfo === undefined) {
        return;
    };
    playerPositionsInfo = parsedplayerPositionsInfo;

    processGameLogsAndDeclaredSets(roundInfo, playerPositionsInfo);
}

function setupObservers() {
    const checkInterval = setInterval(() => {
        const gameLogElement = querySelectorByClass(document, GAMELOG);
        const roundInfoElement = querySelectorByClass(document, ROUND_INFO);
        const infoTopElement = querySelectorByClass(document, BOARD_TOP_INFO_CONTAINER);
        const infoLeftElement = querySelectorByClass(document, BOARD_LEFT_INFO_AND_FLOWERS_CONTAINER);
        const infoRightElement = querySelectorByClass(document, BOARD_RIGHT_INFO_AND_FLOWERS_CONTAINER);
        const infoBottomElement = querySelectorByClass(document, BOARD_PLAYER_INFO_AND_FLOWERS_CONTAINER);
        const topHandElement = querySelectorByClass(document, BOARD_TOP_HAND_CONTAINER);
        const leftHandElement = querySelectorByClass(document, BOARD_LEFT_HAND_CONTAINER);
        const rightHandElement = querySelectorByClass(document, BOARD_RIGHT_HAND_CONTAINER);
        const bottomHandElement = querySelectorByClass(document, BOARD_PLAYER_HAND_CONTAINER);
        const topSetsElement = querySelectorByClass(topHandElement, PLAYER_HAND_TILES_SETS_CONTAINER);
        const leftSetsElement = querySelectorByClass(leftHandElement, PLAYER_HAND_TILES_SETS_CONTAINER);
        const rightSetsElement = querySelectorByClass(rightHandElement, PLAYER_HAND_TILES_SETS_CONTAINER);
        const bottomSetsElement = querySelectorByClass(bottomHandElement, PLAYER_HAND_TILES_SETS_CONTAINER);
        if (gameLogElement && roundInfoElement
            && infoTopElement && infoLeftElement && infoRightElement && infoBottomElement
            && topSetsElement && leftSetsElement && rightSetsElement && bottomSetsElement) {
            clearInterval(checkInterval);

            observers.forEach(observer => {
                observer?.disconnect();
            });
            observers = [];

            const playerHandSetsCallbackConfig = {
                childList: true,
                subtree: true
            };
            const playerHandSetsAttributesCallbackConfig = {
                subtree: true,
                attributes: true,
                attributeOldValue: true,
                attributeFilter: ["style"],
            };

            observers.push(createObserver(gameLogElement, gameLogObserverCallback, { childList: true }));
            observers.push(createObserver(topSetsElement, playerHandSetsObserverCallback("Top", topSetsElement), playerHandSetsCallbackConfig));
            observers.push(createObserver(leftSetsElement, playerHandSetsObserverCallback("Left", leftSetsElement), playerHandSetsCallbackConfig));
            observers.push(createObserver(rightSetsElement, playerHandSetsObserverCallback("Right", rightSetsElement), playerHandSetsCallbackConfig));
            observers.push(createObserver(bottomSetsElement, playerHandSetsObserverCallback("Bottom", bottomSetsElement), playerHandSetsCallbackConfig));
            observers.push(createObserver(topSetsElement, playerHandSetsStyleChangeCallback, playerHandSetsAttributesCallbackConfig));
            observers.push(createObserver(leftSetsElement, playerHandSetsStyleChangeCallback, playerHandSetsAttributesCallbackConfig));
            observers.push(createObserver(rightSetsElement, playerHandSetsStyleChangeCallback, playerHandSetsAttributesCallbackConfig));
            observers.push(createObserver(bottomSetsElement, playerHandSetsStyleChangeCallback, playerHandSetsAttributesCallbackConfig));

            if (resetGameState) {
                parseGameState();
            }

            validateAndModifyPlayerHandSets("Top", topSetsElement, declaredSetTransformations["Top"]);
            validateAndModifyPlayerHandSets("Left", leftSetsElement, declaredSetTransformations["Left"]);
            validateAndModifyPlayerHandSets("Right", rightSetsElement, declaredSetTransformations["Right"]);
            validateAndModifyPlayerHandSets("Bottom", bottomSetsElement, declaredSetTransformations["Bottom"]);

            observerSetupRequired = false;
            resetGameState = false;
        }
    }, 1000);
}

document.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof Element) {
        const anchorElement = target.closest("a");
        const buttonElement = target.closest("button");
        if (anchorElement && anchorElement.getAttribute("href") === "/") {
            setupObservers();
        } else if (buttonElement) {
            if (buttonElement.classList.contains(GAME_END_BUTTON_READY_BUTTON) && buttonElement.firstElementChild.textContent === "Ready") {
                observerSetupRequired = true;
                resetGameState = true;
            } else if (buttonElement.classList.contains(GAME_END_BUTTON_READY_BUTTON) && buttonElement.firstElementChild.textContent.startsWith("Leave Game")) {
                observerSetupRequired = true;
                resetGameState = true;
            } else if (buttonElement.classList.contains(BP3_INTENT_DANGER) && buttonElement.firstElementChild.textContent === "Leave") {
                observerSetupRequired = true;
                resetGameState = true;
            }
        }
    }
});

const checkInterval = setInterval(() => {
    const appSiteContainerElement = querySelectorByClass(document, APP_SITE_CONTAINER);
    if (appSiteContainerElement) {
        clearInterval(checkInterval);
        createObserver(appSiteContainerElement, appObserverCallback, { childList: true, subtree: true });
        setupObservers();
    }
}, 1000);

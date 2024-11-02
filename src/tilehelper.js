import { assertDragonValue, assertFlowerSeasonValue, assertSuitValue, assertTileType, assertWindValue } from "./types/tiles";

/**
 * @param {string} imageName
 * @returns {import("./types/tiles").Tile | undefined}
 */
function validateImageName(imageName) {
    if (imageName === "back.png") {
        return Tiles.getBackTile();
    }

    if (!imageName.endsWith(".png")) {
        console.error("invalid image name found", imageName);
        return undefined;
    }

    const imageNameWithoutExt = imageName.substring(0, imageName.length - 4);
    const split = imageNameWithoutExt.split("-");
    if (split.length !== 2) {
        console.error("invalid image name found", imageName);
        return undefined;
    }

    const tileType = assertTileType(split[0]);

    let tileValue;
    switch (tileType) {
        case "bamboo":
        case "circle":
        case "wan":
            tileValue = assertSuitValue(split[1]);
            break;
        case "dragon":
            tileValue = assertDragonValue(split[1]);
            break;
        case "wind":
            tileValue = assertWindValue(split[1]);
            break;
        case "flower":
        case "season":
            tileValue = assertFlowerSeasonValue(split[1]);
    }

    if (tileType === undefined || tileValue === undefined) {
        console.error("invalid tile type or tile value found for image name", imageName);
        return undefined;
    }

    return Object.freeze({
        type: tileType,
        value: tileValue
    });
}

/**
 * @param {import("./types/tiles").Tile} tile
 * @returns {string}
 */
function tileToImageName(tile) {
    if (tile.type === "back") {
        return "back.png";
    }
    return tile.type + "-" + tile.value + ".png";
}

/**
 * @param {Element} imageElement
 * @returns {import("./types/tiles").Tile}
 */
export function extractTileFromImageElement(imageElement) {
    const imageName = imageElement.getAttribute("src")?.split("/").pop();
    if (!imageName) {
        console.error("ImageElement has unexpected structure: ", imageElement);
        return undefined;
    }
    return validateImageName(imageName);
}

/** 
 * @param {Element} imageElement
 * @param {import("./types/tiles").Tile} targetTile
 */
export function modifyTileInImageElement(imageElement, targetTile) {
    let src = imageElement.getAttribute("src");
    const targetTileImageName = tileToImageName(targetTile);

    if (src === undefined) {
        imageElement.setAttribute("src", "/assets/tiles/" + targetTileImageName);
        return;
    }
    const pathSplit = src.split("/");
    pathSplit.pop();

    imageElement.setAttribute("src", pathSplit.join("/") + "/" + targetTileImageName);
    imageElement.removeAttribute("alt");
}

export class Tiles {
    /**
     * @param {import("./types/tiles").Tile} tile1
     * @param {import("./types/tiles").Tile} tile2
     * @returns {boolean}
     */
    static isEqual(tile1, tile2) {
        return tile1 !== undefined && tile2 !== undefined && tile1.type === tile2.type && tile1.value === tile2.value;
    }

    /**
     * @param {import("./types/tiles").Tile[]} tileArray
     * @param {import("./types/tiles").Tile} tile
     * @returns {number}
     */
    static countOccurance(tileArray, tile) {
        return tileArray.filter(t => this.isEqual(t, tile)).length;
    }

    /**
     * @returns {import("./types/tiles").Tile}
     */
    static getBackTile() {
        return Object.freeze({ type: "back", value: "back" });
    }

    /**
     * @param {import("./types/tiles").Tile} tile
     * @returns {boolean}
     */
    static isBackTile(tile) {
        return this.isEqual(tile, this.getBackTile());
    }
}
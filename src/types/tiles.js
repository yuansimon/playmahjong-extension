/**
 * @typedef {"dragon" | "wind" | "bamboo" | "circle" | "wan" | "flower" | "season" | "back"} TileType
 * @typedef {"green" | "red" | "white"} DragonValue
 * @typedef {"east" | "south" | "west" | "north"} WindValue
 * @typedef {"1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"} SuitValue
 * @typedef {"1" | "2" | "3" | "4"} FlowerSeasonValue
 * @typedef {DragonValue | WindValue | SuitValue | FlowerSeasonValue | "back"} TileValue
 */

/**
 * @typedef {object} TileObject
 * @property {TileType} type
 * @property {TileValue} value
 */
/** @typedef {Readonly<TileObject>} Tile */

/** @type {Readonly<TileType[]>} */
const tileTypeArray = Object.freeze(["dragon", "wind", "bamboo", "circle", "wan", "flower", "season"]);

/** @type {Readonly<DragonValue[]>} */
const dragonValueArray = Object.freeze(["green", "red", "white"]);

/** @type {Readonly<WindValue[]>} */
const WindValueArray = Object.freeze(["east", "south", "west", "north"]);

/** @type {Readonly<FlowerSeasonValue[]>} */
const FlowerSeasonValueArray = Object.freeze(["1", "2", "3", "4"]);

/** @type {Readonly<SuitValue[]>} */
const SuitValueArray = Object.freeze(["1", "2", "3", "4", "5", "6", "7", "8", "9"]);

/**
 * @param {any} input
 * @returns {TileType | undefined}
 */
export function assertTileType(input) {
    if (typeof input !== "string") {
        return undefined;
    }
    for (let tile of tileTypeArray) {
        if (input === tile)
            return tile;
    }
    return undefined;
}

/** 
 * @param {any} input
 * @returns {DragonValue | undefined}
 */
export function assertDragonValue(input) {
    if (typeof input !== "string") {
        return undefined;
    }
    for (let value of dragonValueArray) {
        if (input === value)
            return value;
    }
    return undefined;
}

/** 
 * @param {any} input
 * @returns {WindValue | undefined} 
 */
export function assertWindValue(input) {
    if (typeof input !== "string") {
        return undefined;
    }
    for (let value of WindValueArray) {
        if (input === value)
            return value;
    }
    return undefined;
}

/** 
 * @param {any} input
 * @returns {SuitValue | undefined} 
 */
export function assertSuitValue(input) {
    if (typeof input !== "string") {
        return undefined;
    }
    for (let value of SuitValueArray) {
        if (input === value)
            return value;
    }
    return undefined;
}

/** 
 * @param {any} input
 * @returns {FlowerSeasonValue | undefined} 
 */
export function assertFlowerSeasonValue(input) {
    if (typeof input !== "string") {
        return undefined;
    }
    for (let value of FlowerSeasonValueArray) {
        if (input === value)
            return value;
    }
    return undefined;
}
/** @typedef {"Declared Flower" | "Declared Pung" | "Declared Chow" | "Declared Kong" | "Declared Private Kong" | "Declared Win" | "Claimed Chow" | "Claimed Pung" | "Claimed Kong" | "Turn" | "Discard"} MessageType */
/** @typedef {string} Player */

/**
 * @typedef {object} GameLogEntry
 * @property {string} message
 * @property {string} timestamp
 * @property {Player} player
 * @property {MessageType} messageType
 * @property {string} playerInTurn
 * @property {import("./tiles").Tile[]} tiles
 */

/** @typedef {"Pung" | "Chow" | "Added Kong" | "Concealed Kong" | "Melded Kong"} SetType */

/**
 * @typedef {object} DeclaredSet
 * @property {SetType} setType 
 * @property {Player} playerTakenFrom
 * @property {import("./tiles").Tile} takenTile
 * @property {import("./tiles").Tile[]} tiles
 */

/** @typedef {{[player: Player]: DeclaredSet[]}} PlayerDeclaredSet */

/**
 * @typedef {object} RoundInfo
 * @property {number} roundNumber
 * @property {number} pointsToWin
 * @property {import("./tiles").Tile} prevalentWind
 * @property {Player[]} players
 * @property {{[key: Player]: number}} playerScores
 */

/** @typedef {"Top" | "Left" | "Right" | "Bottom"} PlayerPosition */
/** @type {Readonly<PlayerPosition[]>} */
export const PlayerPositionArray = Object.freeze(["Top", "Left", "Right", "Bottom"]);

/** @typedef {{[key: Player]: PlayerPosition}} PlayerToPosition */
/** 
 * @typedef {object} PositionToPlayer 
 * @property {Player} Top
 * @property {Player} Left
 * @property {Player} Right
 * @property {Player} Bottom
 */
/** 
 * @typedef {object} PlayerPositionsInfo
 * @property {PositionToPlayer} players
 * @property {PlayerToPosition} positions
 */

/**
 * @typedef {object} SetTileTransformation 
 * @property {import("./tiles").Tile} expectedTile
 * @property {import("./tiles").Tile} targetTile
 * @property {number} previousMeldedTilesCount
 * @property {boolean} isMeldedTile
 * @property {boolean} isBackTileAllowed
 */

/** @typedef {SetTileTransformation[]} SetTransformation */

/** 
 * @typedef {object} DeclaredSetTransformation
 * @property {SetTransformation[]} Top 
 * @property {SetTransformation[]} Left 
 * @property {SetTransformation[]} Right 
 * @property {SetTransformation[]} Bottom 
 */

/**
 * @typedef {{element: HTMLElement, setTileTransformation: SetTileTransformation}} SetTileTransformationData
 */
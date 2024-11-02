import { GAMELOG, GAMELOG_LOG_ENTRY, GAMELOG_TILE, GAMELOG_TIMESTAMP } from "./constants/classnames";
import { extractTileFromImageElement, Tiles } from "./tilehelper";
import { querySelectorByClass, querySelectorAllByClass } from "./util";

/** 
 * @param {import("./types/types").RoundInfo} roundInfo
 * @returns {import("./types/types").GameLogEntry[] | undefined} 
 */
export function parseGameLogs(roundInfo) {
    const validPlayers = roundInfo.players;

    const gamelogElement = querySelectorByClass(document, GAMELOG);
    if (!gamelogElement) {
        console.error("Gamelog class not found");
        return undefined;
    }

    const gameLogEntryElements = querySelectorAllByClass(gamelogElement, GAMELOG_LOG_ENTRY);

    const logEntries = [];
    let currentTurnPlayer = undefined;

    for (let gameLogEntryElement of Array.from(gameLogEntryElements)) {
        const pElement = gameLogEntryElement.querySelector("p");
        const timestampElement = querySelectorByClass(gameLogEntryElement, GAMELOG_TIMESTAMP);
        const tileImageElements = gameLogEntryElement.querySelectorAll(`.${GAMELOG_TILE} img`);
        if (!pElement || !timestampElement || !tileImageElements) {
            console.error("Unexepected Gamelog-log-entry structure found.", gameLogEntryElement);
            return undefined;
        }

        const message = pElement.innerText.trim();
        const timestamp = timestampElement.textContent;
        const tiles = [];
        for (let tileImageElement of tileImageElements) {
            const tile = extractTileFromImageElement(tileImageElement);
            if (tile === undefined) {
                return undefined;
            }
            tiles.push(tile);
        }

        const parsedMessage = parseGameLogEntryMessage(message, currentTurnPlayer, validPlayers);
        if (parseGameLogEntryMessage === undefined) {
            return undefined;
        }

        if (parsedMessage.shouldUpdateCurrentPlayer) {
            currentTurnPlayer = parsedMessage.playerInTurn;
        }

        const logEntry = {
            message,
            timestamp,
            player: parsedMessage.player,
            messageType: parsedMessage.messageType,
            playerInTurn: parsedMessage.playerInTurn,
            tiles,
        };
        logEntries.push(logEntry);
    }
    return logEntries;
}

/** 
 * @typedef {object} ParsedGameLogMessage
 * @property {import("./types/types").MessageType} messageType
 * @property {import("./types/types").Player} player
 * @property {import("./types/types").Player} playerInTurn
 * @property {boolean} shouldUpdateCurrentPlayer
 */

/**
 * @param {string} message
 * @param {import("./types/types").Player} currentTurnPlayer
 * @param {import("./types/types").Player[]} validPlayers
 * @returns {ParsedGameLogMessage}
 */
function parseGameLogEntryMessage(message, currentTurnPlayer, validPlayers) {
    let player;
    if (message.endsWith("'s turn.")) {
        player = message.substring(0, message.length - 8);
    } else {
        player = message.split(" ")[0];
    }
    if (player === undefined || player === "") {
        console.error("Error parsing player from log message ", message);
        return undefined;
    }

    /** @type {import("./types/types").MessageType} */
    let messageType;
    if (message.endsWith("'s turn.")) {
        messageType = "Turn";
    } else if (message.endsWith("discarded")) {
        messageType = "Discard";
    } else if (message.endsWith("declared a flower")) {
        messageType = "Declared Flower";
    } else if (message.endsWith("declared a win.")) {
        messageType = "Declared Win";
    } else if (message.endsWith("declared a chow.")) {
        messageType = "Declared Chow";
    } else if (message.endsWith("declared a pung.")) {
        messageType = "Declared Pung";
    } else if (message.endsWith("declared a kong.")) {
        messageType = "Declared Kong";
    } else if (message.endsWith("declared a  kong.")) { // typo by playmahjong.io
        messageType = "Declared Kong";
    } else if (message.endsWith("declared a private kong.")) {
        messageType = "Declared Private Kong";
    } else if (message.endsWith("claimed a chow.")) {
        messageType = "Claimed Chow";
    } else if (message.endsWith("claimed a pung.")) {
        messageType = "Claimed Pung";
    } else if (message.endsWith("claimed a kong.")) {
        messageType = "Claimed Kong";
    } else {
        console.error("Unknown message type: ", message);
        return undefined;
    }

    let shouldUpdateCurrentPlayer = false;
    let playerInTurn = currentTurnPlayer;

    if (currentTurnPlayer === undefined && messageType !== "Turn") {
        if (messageType === "Declared Flower") {
            shouldUpdateCurrentPlayer = false;
            playerInTurn = player;
        } else if (messageType) {
            console.error("current player's turn unknown.", message);
            return undefined;
        }
    }

    if (messageType === "Turn") {
        shouldUpdateCurrentPlayer = true;
        playerInTurn = player;
    }

    if (!validPlayers.includes(player)) {
        console.error(`Parsed message '${message}' contains unknown player ${player}. Players parsed from roundInfo: ${validPlayers[0]} ${validPlayers[1]} ${validPlayers[2]} ${validPlayers[3]}`);
        return undefined;
    }

    return {
        player,
        playerInTurn,
        messageType,
        shouldUpdateCurrentPlayer
    };
}

/**
 * @param {import("./types/types").GameLogEntry[]} logEntries
 * @param {import("./types/types").RoundInfo} roundInfo
 * @returns {import("./types/types").PlayerDeclaredSet | undefined}
 */
export function processGameLogs(logEntries, roundInfo) {
    /** @type {import("./types/types").PlayerDeclaredSet} */
    const declaredSets = {};

    /** @type {import("./types/tiles").Tile | undefined} */
    let lastDiscard = undefined;
    for (const logEntry of logEntries) {
        const tiles = logEntry.tiles;
        const messageType = logEntry.messageType;
        const player = logEntry.player;
        let currentPlayerDeclaredSets = declaredSets[player];
        if (currentPlayerDeclaredSets === undefined) {
            currentPlayerDeclaredSets = [];
        }

        /** @type {import("./types/types").DeclaredSet} */
        let declaredSet;
        /** @type {import("./types/types").SetType} */
        let setType;
        let expectedTakenTileOccuranceInTiles;
        let expectedTilesTotalCount = 0;

        if (messageType === "Discard") {
            if (tiles.length !== 1 || tiles[0].type === "back") {
                console.error(`Unexpected tiles associated to log entry for of type ${messageType}`, logEntry);
                return undefined;
            }
            lastDiscard = tiles[0];
            expectedTilesTotalCount = 1;
        }

        if (messageType === "Declared Flower") {
            expectedTilesTotalCount = 1;
            if (tiles[0]?.type !== "flower" && tiles[0]?.type !== "season") {
                console.error(`Unexpected tiles associated to log entry for of type ${messageType}`, logEntry);
                return undefined;
            }
        } else if (messageType === "Claimed Chow") {
            setType = "Chow";
            expectedTilesTotalCount = 3;
            expectedTakenTileOccuranceInTiles = 1;
        } else if (messageType === "Claimed Pung") {
            setType = "Pung";
            expectedTilesTotalCount = 3;
            expectedTakenTileOccuranceInTiles = 3;
        } else if (messageType === "Claimed Kong") {
            setType = "Melded Kong";
            expectedTilesTotalCount = 4;
            expectedTakenTileOccuranceInTiles = 1;
            if (!Tiles.isEqual(tiles[0], lastDiscard) || Tiles.countOccurance(tiles, Tiles.getBackTile()) !== 3) {
                console.error(`Unexpected tiles associated to log entry for of type ${messageType}`, logEntry);
                return undefined;
            }
        } else if (messageType === "Declared Private Kong") {
            setType = "Concealed Kong";
            expectedTilesTotalCount = 4;
            expectedTakenTileOccuranceInTiles = 4;
        } else if (messageType === "Declared Kong" && tiles.length === 4) {
            const previousPungs = currentPlayerDeclaredSets.filter(set => set.setType === "Pung" && Tiles.isEqual(set.tiles[0], tiles[0]));
            if (previousPungs.length === 1) {
                setType = "Added Kong";
                expectedTakenTileOccuranceInTiles = 4;
                expectedTilesTotalCount = 4;
            } else {
                console.error(`Unexpected log entry for of type ${messageType} with missing Pung declared set.`, logEntry);
                return undefined;
            }
        }

        if (tiles.length !== expectedTilesTotalCount) {
            console.error(`Unexpected tiles associated to log entry for of type ${messageType}`, logEntry);
            return undefined;
        }

        if (setType !== undefined) {
            declaredSet = {
                setType: setType,
                takenTile: setType === "Concealed Kong" ? Tiles.getBackTile() : (setType === "Added Kong" ? tiles[0]: lastDiscard),
                playerTakenFrom: logEntry.playerInTurn,
                tiles: setType === "Melded Kong" ? [tiles[0], tiles[0], tiles[0], tiles[0]]: tiles,
            };

            if (Tiles.countOccurance(tiles, declaredSet.takenTile) !== expectedTakenTileOccuranceInTiles) {
                console.error(`Unexpected tiles associated to log entry for of type ${messageType}`, logEntry);
                return undefined;
            }

            if (player === declaredSet.playerTakenFrom && setType !== "Added Kong" && setType !== "Concealed Kong") {
                console.error(`Unexpected error: Player of log entry matches player of last discarded tile '${declaredSet.playerTakenFrom}' for log entry of type ${messageType} with setType ${setType}`, logEntry);
                return undefined;
            }

            if (setType === "Added Kong") {
                const index = currentPlayerDeclaredSets.findIndex(set => set.setType === "Pung" && Tiles.isEqual(set.tiles[0], tiles[0]));
                if (index === -1) {
                    console.error(`Unexpected log entry for of type ${messageType} with missing Pung declared set.`, logEntry, currentPlayerDeclaredSets);
                    return undefined;
                }
                let declaredPung = currentPlayerDeclaredSets[index];
                declaredPung.setType = "Added Kong";
                declaredPung.tiles.push(declaredPung.tiles[0]);
            } else {
                currentPlayerDeclaredSets.push(declaredSet);
            }
        }
        declaredSets[player] = currentPlayerDeclaredSets;
    }

    for (let player of roundInfo.players) {
        if (declaredSets[player] === undefined) {
            declaredSets[player] = [];
        }
    }

    return declaredSets;
}
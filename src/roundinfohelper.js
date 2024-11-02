import { BOARD_LEFT_INFO_AND_FLOWERS_CONTAINER, BOARD_PLAYER_INFO_AND_FLOWERS_CONTAINER, BOARD_RIGHT_INFO_AND_FLOWERS_CONTAINER, BOARD_TOP_INFO_CONTAINER, PLAYER_INFO_NAME, ROUND_INFO, ROUND_INFO_ROUND_NUMBER, ROUND_INFO_SCORES_TABLE, ROUND_INFO_WIND_INFO_TILE } from "./constants/classnames";
import { extractTileFromImageElement } from "./tilehelper";
import { querySelectorByClass } from "./util";

/** @returns {import("./types/types").RoundInfo | undefined} */
export function parseRoundInfo() {
    const roundInfoElement = querySelectorByClass(document, ROUND_INFO);
    if (!roundInfoElement) {
        console.error("RoundInfo class not found");
        return undefined;
    }
    const roundNumberElement = querySelectorByClass(roundInfoElement, ROUND_INFO_ROUND_NUMBER);
    const pointsToWinElement = roundInfoElement.querySelector(":scope > div:nth-child(2)");
    const prevalentWindElement = roundInfoElement.querySelector(`.${ROUND_INFO_WIND_INFO_TILE} img`);
    const playerElements = roundInfoElement.querySelectorAll(`.${ROUND_INFO_SCORES_TABLE} .col:first-child div`);
    const scoreElements = roundInfoElement.querySelectorAll(`.${ROUND_INFO_SCORES_TABLE} .col:last-child div`);

    if (!roundNumberElement || !pointsToWinElement || !prevalentWindElement || !playerElements || !scoreElements) {
        console.error("Unexepected RoundInfo structure found.", roundInfoElement);
        return undefined;
    }

    const roundNumber = parseInt(roundNumberElement.textContent.replace("Round ", ""));
    if (isNaN(roundNumber)) {
        console.error("Unexpected round number", roundNumberElement);
        return undefined;
    }

    const pointsToWin = parseInt(pointsToWinElement.textContent.replace("Points to Win: ", ""));
    if (isNaN(pointsToWin)) {
        console.error("Unexpected points to win", pointsToWinElement);
        return undefined;
    }

    const prevalentWind = extractTileFromImageElement(prevalentWindElement);
    if (prevalentWind === undefined || prevalentWind.type != "wind") {
        console.error("Unexpected prevalent wind info", prevalentWindElement);
        return undefined;
    }

    /** @type {{[key: import("./types/types").Player]: number}} */
    const playerScores = {};
    const players = [];
    if (playerElements.length !== 4 || scoreElements.length !== 4) {
        console.error("Unexpected score table structure", playerElements, scoreElements);
        return undefined;
    }
    playerElements.forEach((playerElement, index) => {
        const player = playerElement.textContent;
        const score = scoreElements[index].textContent;

        if (player === undefined || player === "" || isNaN(parseInt(score))) {
            console.error("Unexpected player or score structure at index ", index, player, score, playerElements, scoreElements);
            return undefined;
        }
        players.push(player);
        playerScores[player] = parseInt(score);
    });
    if (players.length !== new Set(players).size) {
        console.error("Player names not unique", players);
        return undefined;
    };


    const roundInfo = {
        roundNumber,
        pointsToWin,
        prevalentWind,
        players,
        playerScores,
    };

    return roundInfo;
}


/**
 * @param {import("./types/types").RoundInfo} roundInfo
 * @returns {import("./types/types").PlayerPositionsInfo | undefined}
 */
export function parsePlayerPositionsInfo(roundInfo) {
    const infoTopElement = querySelectorByClass(document, BOARD_TOP_INFO_CONTAINER);
    const infoLeftElement = querySelectorByClass(document, BOARD_LEFT_INFO_AND_FLOWERS_CONTAINER);
    const infoRightElement = querySelectorByClass(document, BOARD_RIGHT_INFO_AND_FLOWERS_CONTAINER);
    const infoBottomElement = querySelectorByClass(document, BOARD_PLAYER_INFO_AND_FLOWERS_CONTAINER);

    if (!infoTopElement || !infoLeftElement || !infoRightElement || !infoBottomElement) {
        console.error("Board Info Container classes not found");
        return undefined;
    }

    const topNameElement = infoTopElement.querySelector(`span.${PLAYER_INFO_NAME}`);
    const leftNameElement = infoLeftElement.querySelector(`span.${PLAYER_INFO_NAME}`);
    const rightNameElement = infoRightElement.querySelector(`span.${PLAYER_INFO_NAME}`);
    const bottomNameElement = infoBottomElement.querySelector(`span.${PLAYER_INFO_NAME}`);

    if (!topNameElement || !leftNameElement || !rightNameElement || !bottomNameElement) {
        console.error(`${PLAYER_INFO_NAME} classes not found`);
        return undefined;
    }

    const topPlayerName = topNameElement.textContent;
    const leftPlayerName = infoLeftElement.textContent;
    const rightPlayerName = infoRightElement.textContent;
    const bottomPlayerName = infoBottomElement.textContent;

    if (!topPlayerName || !leftPlayerName || !rightPlayerName || !bottomPlayerName) {
        console.error("player name is empty");
        return undefined;
    }

    /** @type {import("./types/types").PlayerToPosition} */
    const playerToPositions = {
        [topPlayerName]: "Top",
        [leftPlayerName]: "Left",
        [rightPlayerName]: "Right",
        [bottomPlayerName]: "Bottom",
    };

    /** @type {import("./types/types").PositionToPlayer} */
    const positionToPlayer = {
        Top: topPlayerName,
        Left: leftPlayerName,
        Right: rightPlayerName,
        Bottom: bottomPlayerName,
    };

    Object.keys(playerToPositions).forEach(playerName => {
        if (!roundInfo.players.includes(playerName)) {
            console.error(`parsed players from player positions (=${topPlayerName},${leftPlayerName},${rightPlayerName},${bottomPlayerName}) do not include the players parsed from round info`, roundInfo.players);
            return undefined;
        }
    });

    return {
        players: positionToPlayer,
        positions: playerToPositions
    };
}
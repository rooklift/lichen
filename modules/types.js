"use strict";

// These are used internally for our map. The values don't really matter but I've made ICE and ORE match Lux enums.
const NORMAL = -1;
const ICE = 0;
const ORE = 1;

// These are the Lux enums for factory requests.
const BUILD_LIGHT = 0;
const BUILD_HEAVY = 1;
const WATER_LICHEN = 2;

// These are used only in this file.
const MOVE = 0;
const TRANSFER = 1;
const PICKUP = 2;
const DIG = 3;
const SELFDESTRUCT = 4;
const RECHARGE = 5;

const directions = ["centre", "up", "right", "down", "left"];
const resources = ["ice", "ore", "water", "metal", "power"];

function printable_action(action) {

	if (action[0] === MOVE) {
		return `Move ${directions[action[1]]} ${action[5]} ${action[4] ? "r" : ""}`;
	}

	if (action[0] === TRANSFER) {
		return `Transfer ${action[3]} ${resources[action[2]]} ${directions[action[1]]} ${action[4] ? "r" : ""}`;
	}

	if (action[0] === PICKUP) {
		return `Pickup ${action[3]} ${resources[action[2]]} ${action[4] ? "r" : ""}`;
	}

	if (action[0] === DIG) {
		return `Dig ${action[5]} ${action[4] ? "r" : ""}`;
	}

	if (action[0] === SELFDESTRUCT) {
		return `Self-destruct`;
	}

	if (action[0] === RECHARGE) {
		return `Recharge ${action[3]} ${action[4] ? "r" : ""}`;
	}

	return "??";
}


function new_selection(type, name, team_id, i, x, y) {
	return {type, name, team_id, i, x, y};
}


module.exports = {
	NORMAL, ICE, ORE, BUILD_LIGHT, BUILD_HEAVY, WATER_LICHEN,
	printable_action, new_selection,
};

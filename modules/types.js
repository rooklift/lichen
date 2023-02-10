"use strict";

const NORMAL = -1;		// i.e. for a tile.

const ICE = 0;
const ORE = 1;
const WATER = 2;
const METAL = 3;
const POWER = 4;

const MOVE = 0;
const TRANSFER = 1;
const PICKUP = 2;
const DIG = 3;
const SELFDESTRUCT = 4;
const RECHARGE = 5;

const CENTRE = 0;
const UP = 1;
const RIGHT = 2;
const DOWN = 3;
const LEFT = 4;

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


function new_selection(type, name, i, x, y) {
	return {type, name, i, x, y};
}


module.exports = {
	NORMAL, ICE, ORE,
	printable_action, new_selection
};

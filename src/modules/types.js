"use strict";

// These are used internally for our map. The values don't really matter but I've made ICE and ORE match Lux enums.

exports.enums = {

	NORMAL: -1,				// Used internally for our map of the world (means no ice/ore)

	ICE: 0,
	ORE: 1,
	WATER: 2,
	METAL: 3,
	POWER: 4,

	BUILD_LIGHT: 0,
	BUILD_HEAVY: 1,
	WATER_LICHEN: 2,

	MOVE: 0,
	TRANSFER: 1,
	PICKUP: 2,
	DIG: 3,
	SELFDESTRUCT: 4,
	RECHARGE: 5,

	CENTRE: 0,
	UP: 1,
	RIGHT: 2,
	DOWN: 3,
	LEFT: 4,
};

exports.printable_action = function(action) {

	const directions = ["centre", "up", "right", "down", "left"];
	const resources = ["ice", "ore", "water", "metal", "power"];

	if (action[0] === exports.enums.MOVE) {
		return `Move ${directions[action[1]]} ${action[5]} ${action[4] ? "r" : ""}`;
	}

	if (action[0] === exports.enums.TRANSFER) {
		return `Transfer ${action[3]} ${resources[action[2]]} ${directions[action[1]]} ${action[4] ? "r" : ""}`;
	}

	if (action[0] === exports.enums.PICKUP) {
		return `Pickup ${action[3]} ${resources[action[2]]} ${action[4] ? "r" : ""}`;
	}

	if (action[0] === exports.enums.DIG) {
		return `Dig ${action[5]} ${action[4] ? "r" : ""}`;
	}

	if (action[0] === exports.enums.SELFDESTRUCT) {
		return `Self-destruct`;
	}

	if (action[0] === exports.enums.RECHARGE) {
		return `Recharge ${action[3]} ${action[4] ? "r" : ""}`;
	}

	return "??";
};

exports.new_selection = function(type, name, team_id, i, x, y) {
	return {type, name, team_id, i, x, y};
};

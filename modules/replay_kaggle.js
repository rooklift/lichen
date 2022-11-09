"use strict";

const types = require("./types");

function fixed_kaggle_replay(raw_replay) {

	let ret = Object.create(kaggle_replay_props);
	ret.r = raw_replay;

	ret.map = [];			// 2d array giving the type of map cell (normal / ice / ore)

	for (let step of ret.r.steps) {
		step[0].observation.obs = JSON.parse(step[0].observation.obs);		// There's JSON in the JSON (the string is exactly what was sent to the bot I guess)
	}

	for (let x = 0; x < ret.width(); x++) {
		ret.map.push([]);
		for (let y = 0; y < ret.height(); y++) {

			let cell_type = types.NORMAL;
			if (ret.r.steps[0][0].observation.obs.board.ice[y][x]) {		// Translating from [y][x] to [x][y]
				cell_type = types.ICE;
			}
			if (ret.r.steps[0][0].observation.obs.board.ore[y][x]) {		// Translating from [y][x] to [x][y]
				cell_type = types.ORE;
			}

			// TODO - verify a cell is never both ice and ore?

			ret.map[x].push(cell_type);
		}
	}

	return ret;
}

const kaggle_replay_props = {

	width: function() {
		return 48;
	},

	height: function() {
		return 48;
	},

	cell_type: function(x, y) {
		return this.map[x][y];
	}

};

module.exports = {fixed_kaggle_replay};

"use strict";

const types = require("./types");
const {new_2d_array, copy_2d_array} = require("./utils");

function new_replay(steps, width, height) {

	let ret = Object.create(replay_prototype);

	ret.steps = steps;
	ret.width = width;
	ret.height = height;

	ret.observations = null;
	ret.map = new_2d_array(width, height, null);				// 2d array of NORMAL / ORE / ICE (never changes)
	ret.rubble = [new_2d_array(width, height, null)];			// 3d arrays
	ret.lichen = [new_2d_array(width, height, null)];
	ret.lichen_strains = [new_2d_array(width, height, null)];

	return ret;
}

const replay_prototype = {

	init: function(all_observations) {

		if (all_observations.length != this.steps) {
			throw new Error(`all_observations.length != this.steps (${all_observations.length} vs ${this.steps})`);
		}

		this.observations = all_observations;

		// Set the initial maps of rubble, lichen, and strains. Also set the unchanging map of NORMAL / ICE / ORE.

		let board_zero = all_observations[0].board;

		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {

				this.rubble[0][x][y] = board_zero.rubble[x][y];
				this.lichen[0][x][y] = board_zero.lichen[x][y];
				this.lichen_strains[0][x][y] = board_zero.lichen_strains[x][y];

				if (board_zero.ice[x][y] > 0) {
					this.map[x][y] = types.ICE;
				} else if (board_zero.ore[x][y] > 0) {
					this.map[x][y] = types.ORE;
				} else {
					this.map[x][y] = types.NORMAL;
				}
			}
		}

		// Set the later maps of rubble, lichen, and strains.

		for (let i = 1; i < all_observations.length; i++) {

			let obs = all_observations[i];

			for (let key of ["rubble", "lichen", "lichen_strains"]) {
				let new_map = copy_2d_array(this[key][i - 1]);
				for (let [coords, val] of Object.entries(obs.board[key])) {
					let [xs, ys] = coords.split(",");
					let [x, y] = [parseInt(xs, 10), parseInt(ys, 10)];
					new_map[x][y] = val;
				}
				this[key].push(new_map);
			}
		}
	},

	cell_type: function(x, y) {
		return this.map[x][y];
	},

	cell_rubble: function(i, x, y) {
		return this.rubble[i][x][y];
	},

	cell_lichen: function(i, x, y) {
		return this.lichen[i][x][y];
	},

	get_units: function(i) {
		let ret = [];
		for (let player of Object.values(this.observations[i].units)) {
			for (let unit of Object.values(player)) {
				ret.push(unit);
			}
		}
		return ret;
	},

	get_factories: function(i) {
		let ret = [];
		for (let player of Object.values(this.observations[i].factories)) {
			for (let fact of Object.values(player)) {
				ret.push(fact);
			}
		}
		return ret;
	},
}


module.exports = {new_replay};

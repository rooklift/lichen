"use strict";

const types = require("./types");
const {new_2d_array, copy_2d_array} = require("./utils");

function new_replay(steps, width, height, name_0, name_1) {

	let ret = Object.create(replay_prototype);

	ret.steps = steps;
	ret.width = width;
	ret.height = height;
	ret.name_0 = name_0;
	ret.name_1 = name_1;

	ret.observations = null;
	ret.actions = null;

	ret.map = new_2d_array(width, height, null);				// 2d array of NORMAL / ORE / ICE (never changes)
	ret.rubble = [];											// 3d arrays
	ret.lichen = [];
	ret.lichen_strains = [];

	return ret;
}

const replay_prototype = {

	init: function(all_observations, all_actions) {

		if (all_observations.length != this.steps) {
			throw new Error(`all_observations.length != this.steps (${all_observations.length} vs ${this.steps})`);
		}

		if (all_actions.length != this.steps - 1) {
			throw new Error(`all_actions.length != this.steps - 1 (${all_actions.length} vs ${this.steps - 1})`);
		}

		this.observations = all_observations;
		this.actions = all_actions;

		this.actions.push({					// Just so the final frame has an actions object.
			player_0: {},
			player_1: {},
		});

		// Set the initial maps of rubble, lichen, and strains. Also set the unchanging map of NORMAL / ICE / ORE.

		this.rubble.push(new_2d_array(this.width, this.height, null));
		this.lichen.push(new_2d_array(this.width, this.height, null));
		this.lichen_strains.push(new_2d_array(this.width, this.height, null));

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

	real_step: function(i) {
		return this.observations[i].real_env_steps;
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

	cell_lichen_strain: function(i, x, y) {
		return this.lichen_strains[i][x][y];
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

	lichen_owner: function(i, x, y) {
		let strain = this.cell_lichen_strain(i, x, y);
		if (strain === -1) {
			return null;
		}
		for (let z of this.observations[i].teams.player_0.factory_strains) {
			if (z === strain) {
				return 0;
			}
		}
		for (let z of this.observations[i].teams.player_1.factory_strains) {
			if (z === strain) {
				return 1;
			}
		}
		return null;
	},
}


module.exports = {new_replay};

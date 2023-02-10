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

	// --------------------------------------------------------------------------------------------

	cfg: function() {
		return require("./env_cfg");				// TODO - if present in the replay, use it instead.
	},

	real_step: function(i) {
		return this.observations[i].real_env_steps;
	},

	is_night: function(i) {
		let real_step = this.real_step(i);
		if (real_step < 0) {
			return false;
		}
		return real_step % this.cfg().CYCLE_LENGTH >= this.cfg().DAY_LENGTH;
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

	lichen_owner: function(i, x, y) {
		let strain = this.lichen_strains[i][x][y];
		if (strain === -1) {
			return "";
		}
		for (let [player_name, team] of Object.entries(this.observations[i].teams)) {
			for (let z of team.factory_strains) {
				if (z === strain) {
					return player_name;
				}
			}
		}
		return "";
	},

	get_units: function(i) {
		let ret = [];
		for (let units_object of Object.values(this.observations[i].units)) {
			for (let unit of Object.values(units_object)) {
				ret.push(unit);
			}
		}
		return ret;
	},

	get_factories: function(i) {
		let ret = [];
		for (let factories_object of Object.values(this.observations[i].factories)) {
			for (let factory of Object.values(factories_object)) {
				ret.push(factory);
			}
		}
		return ret;
	},

	get_unit_by_id: function(i, s) {
		for (let units_object of Object.values(this.observations[i].units)) {
			if (units_object[s]) {
				return units_object[s];
			}
		}
		return null;
	},

	get_factory_by_id: function(i, s) {
		for (let factories_object of Object.values(this.observations[i].factories)) {
			if (factories_object[s]) {
				return factories_object[s];
			}
		}
		return null;
	},

	unit_request: function(i, s) {
		let unit = this.get_unit_by_id(i, s);
		if (!unit) {
			return [];
		}
		let request = this.actions[i][`player_${unit.team_id}`][unit.unit_id];
		if (!request) {
			return [];
		}
		return request;
	},

	unit_can_receive_request: function(i, s) {		// Note that we won't care here whether there is a request.
		let unit = this.get_unit_by_id(i, s);
		if (!unit) {
			return false;
		}
		if (unit.power < this.cfg().ROBOTS[unit.unit_type].ACTION_QUEUE_POWER_COST) {
			return false;
		}
		return true;
	},

	what_is_at: function(i, x, y) {					// For now, returns string.
		for (let unit of this.get_units(i)) {
			if (unit.pos[0] === x && unit.pos[1] === y) {
				return unit.unit_id;
			}
		}
		for (let factory of this.get_factories(i)) {
			if (factory.pos[0] >= x - 1 && factory.pos[0] <= x + 1 && factory.pos[1] >= y - 1 && factory.pos[1] <= y + 1) {
				return factory.unit_id;
			}
		}
		return "";
	},

	lichen_scores: function(i) {
		let ret = {
			player_0: 0,
			player_1: 0,
		};
		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				let strain = this.lichen_strains[i][x][y];
				if (strain === -1) {
					continue;
				}
				for (let [player_name, team] of Object.entries(this.observations[i].teams)) {
					for (let z of team.factory_strains) {
						if (z === strain) {
							ret[player_name] += this.lichen[i][x][y];
							break;
						}
					}
				}
			}
		}
		return ret;
	},
};


module.exports = {new_replay};

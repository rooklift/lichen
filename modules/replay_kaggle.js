"use strict";

const types = require("./types");
const {copy_2d_array, new_2d_array} = require("./utils");

function fixed_kaggle_replay(raw_replay) {
	let ret = Object.create(kaggle_replay_props);
	ret.r = raw_replay;	
	for (let step of ret.r.steps) {
		step[0].observation.obs = JSON.parse(step[0].observation.obs);		// There's JSON in the JSON (the string is exactly what was sent to the bot I guess)
	}
	ret.make_basic_map();
	ret.make_full_maps();
	return ret;
}

const kaggle_replay_props = {

	make_basic_map: function() {		// Saves a 2d array with (normal / ice / ore), which are unchangeable throughout the game.

		this.map = [];

		for (let x = 0; x < this.width(); x++) {
			this.map.push([]);
			for (let y = 0; y < this.height(); y++) {

				let cell_type = types.NORMAL;
				if (this.r.steps[0][0].observation.obs.board.ice[y][x]) {		// Translating from [y][x] to [x][y]
					cell_type = types.ICE;
				}
				if (this.r.steps[0][0].observation.obs.board.ore[y][x]) {		// Translating from [y][x] to [x][y]
					cell_type = types.ORE;
				}

				// TODO - verify a cell is never both ice and ore?

				this.map[x].push(cell_type);
			}
		}
	},

	make_full_maps: function() {		// Saves some 3d arrays of the things which change throughout the game.

		let last_element = (arr) => arr[arr.length - 1];

		for (let key of ["rubble", "lichen", "lichen_strains"]) {

			this[key] = [new_2d_array(this.width(), this.height(), 0)];

			for (let x = 0; x < this.width(); x++) {
				for (let y = 0; y < this.height(); y++) {
					this[key][0][x][y] = this.r.steps[0][0].observation.obs.board[key][y][x];		// Translating from [y][x] to [x][y]
				}
			}

			for (let step of this.r.steps.slice(1)) {

				let new_map = copy_2d_array(last_element(this[key]));
				let update_object = step[0].observation.obs.board[key];

				for (let k of Object.keys(update_object)) {
					let [xs, ys] = k.split(",");
					let [x, y] = [parseInt(xs, 10), parseInt(ys, 10)];
					let val = update_object[k];
					new_map[x][y] = val;
				}

				this[key].push(new_map);
			}
		}
	},

	width: function() {
		return 48;
	},

	height: function() {
		return 48;
	},

	total_ticks: function() {
		return this.r.steps.length;
	},

	cell_type: function(x, y) {
		return this.map[x][y];
	},

	cell_rubble: function(i, x, y) {
		return this.rubble[i][x][y];
	},

	cell_lichen: function(i, x, y) {
		return this.lichen[i][x][y];
	}

};

module.exports = {fixed_kaggle_replay};

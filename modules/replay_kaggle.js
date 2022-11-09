"use strict";

const types = require("./types");
const {copy_2d_array, new_2d_array} = require("./utils");

function fixed_kaggle_replay(raw_replay) {
	let ret = Object.create(kaggle_replay_props);
	ret.r = raw_replay;	
	for (let step of ret.r.steps) {
		step[0].observation.obs = JSON.parse(step[0].observation.obs);		// There's JSON in the JSON (the string is exactly what was sent to the bot I guess)
	}
	ret.make_map();
	ret.make_rubble_maps();
	return ret;
}

const kaggle_replay_props = {

	make_map: function() {			// Called once, saving a 2d array giving the type of map cell (normal / ice / ore), which are unchangeable throughout the game.

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

	make_rubble_maps: function() {

		this.rubble = [];
		this.rubble.push(new_2d_array(this.width(), this.height(), 0));

		for (let x = 0; x < this.width(); x++) {
			for (let y = 0; y < this.height(); y++) {
				this.rubble[0][x][y] = this.r.steps[0][0].observation.obs.board.rubble[y][x];
			}
		}

		for (let step of this.r.steps.slice(1)) {

			let new_rubble_map = copy_2d_array(this.rubble[this.rubble.length - 1]);
			let rubble_update_object = step[0].observation.obs.board.rubble;

			for (let key of Object.keys(rubble_update_object)) {
				let [xs, ys] = key.split(",");
				let [x, y] = [parseInt(xs, 10), parseInt(ys, 10)];
				let val = rubble_update_object[key];
				new_rubble_map[x][y] = val;
			}

			this.rubble.push(new_rubble_map);
		}
	},

	width: function() {
		return 48;
	},

	height: function() {
		return 48;
	},

	cell_type: function(x, y) {
		return this.map[x][y];
	},

	cell_rubble: function(i, x, y) {
		return this.rubble[i][x][y];
	},

};

module.exports = {fixed_kaggle_replay};

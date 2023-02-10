"use strict";

const fs = require("fs");
const path = require("path");
const {ipcRenderer} = require("electron");
const {draw, calculate_square_size} = require("./draw");
const {fixed_local_replay, fixed_kaggle_replay} = require("./replay_import");
const config_io = require("./config_io");

function init() {

	let hub_prototype = {};
	Object.assign(hub_prototype, hub_main_props);
	Object.assign(hub_prototype, require("./hub_settings"));
	let ret = Object.create(hub_prototype);

	ret.replay = null;
	ret.index = 0;
	ret.selection = null;
	ret.canvas = document.getElementById("canvas");
	ret.infodiv = document.getElementById("info");

	return ret;
}

let hub_main_props = {

	quit: function() {
		config_io.save();										// As long as we use the sync save, this will complete before we
		ipcRenderer.send("terminate");							// send "terminate". Not sure about results if that wasn't so.
	},

	load: function(filepath) {

		let starttime = performance.now();

		if (filepath === __dirname || filepath === ".") {		// Can happen when extra args are passed to main process. Silently return.
			return;
		}
		if (fs.existsSync(filepath) === false) {				// Can happen when extra args are passed to main process. Silently return.
			return;
		}

		let o;

		try {
			let buf = fs.readFileSync(filepath);
			o = JSON.parse(buf);
		} catch(err) {
			alert(err);
			return;
		}

		if (typeof o !== "object" || o === null) {
			alert("This does not appear to be a replay.");
			return;
		}

		// TODO - some further validation here.

		if (o.actions) {
			this.replay = fixed_local_replay(o);
		} else {
			this.replay = fixed_kaggle_replay(o);
		}
		this.index = 0;
		this.selection = null;

		ipcRenderer.send("set_title", `${this.replay.name_0} vs ${this.replay.name_1}`);
		this.draw();

		console.log(`Loaded ${path.basename(filepath)} in ${((performance.now() - starttime) / 1000).toFixed(1)} seconds.`);
	},

	set_index: function(i) {
		if (!this.replay) {
			i = 0;
		} else {
			if (i < 0) {
				i = 0;
			} else if (i >= this.replay.steps) {
				i = this.replay.steps - 1;
			}
		}
		this.index = i;
		this.draw();
	},

	click: function(cx, cy) {

		if (!this.replay) {
			return;
		}

		let cell_size = calculate_square_size(this.canvas, this.replay.width, this.replay.height);
		let draw_width = cell_size * this.replay.width;
		let draw_height = cell_size * this.replay.height;

		let x = Math.floor((cx / draw_width) * this.replay.width);
		let y = Math.floor((cy / draw_height) * this.replay.height);

		if (x < 0 || x >= this.replay.width || y < 0 || y >= this.replay.height) {
			return;
		}

		this.selection = hub.replay.what_is_at(this.index, x, y);
		this.draw();
	},

	backward: function(n) {
		this.set_index(this.index - n);
	},

	forward: function(n) {
		this.set_index(this.index + n);
	},

	draw: function() {
		draw(this.replay, this.index, this.canvas, this.infodiv, this.selection);
	},

	clear_selection: function() {
		this.selection = null;
		this.draw();
	},

};



module.exports = init();

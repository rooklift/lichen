"use strict";

const fs = require("fs");
const {ipcRenderer} = require("electron");

const {draw} = require("./draw");
const {fixed_kaggle_replay} = require("./replay_kaggle");
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

		this.replay = fixed_kaggle_replay(o);
		this.index = 0;
		this.selection = null;

		this.draw();
	},

	set_index: function(i) {
		if (!this.replay) {
			i = 0;
		} else {
			if (i < 0) {
				i = 0;
			} else if (i >= this.replay.total_ticks()) {
				i = this.replay.total_ticks() - 1;
			}
		}
		this.index = i;
		this.draw();
	},

	draw: function() {
		draw(this.replay, this.index, this.canvas, this.infodiv, this.selection);
	},

};



module.exports = init();

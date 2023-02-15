"use strict";

const fs = require("fs");
const path = require("path");
const {ipcRenderer} = require("electron");
const {draw, calculate_square_size} = require("./draw");
const {draw_info} = require("./draw_info");
const {load_local_replay, load_kaggle_replay} = require("./replay_import");
const config_io = require("./config_io");

function init() {

	let hub_prototype = {};
	Object.assign(hub_prototype, hub_main_props);
	Object.assign(hub_prototype, require("./hub_settings"));
	let ret = Object.create(hub_prototype);

	ret.replay = null;
	ret.index = 0;
	ret.selection = null;
	ret.mouse = null;
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

		if (o.actions) {
			this.replay = load_local_replay(o);
		} else if (o.steps) {
			this.replay = load_kaggle_replay(o);
		} else {
			alert("This does not appear to be a replay.");
			return;
		}

		this.index = 0;
		this.selection = null;
		this.mouse = null;

		ipcRenderer.send("set_title", `${path.basename(filepath)} - ${this.replay.name_0} vs ${this.replay.name_1}`);
		this.draw();

		console.log(`Loaded ${path.basename(filepath)} in ${((performance.now() - starttime) / 1000).toFixed(1)} seconds.`);
	},

	set_index: function(i) {
		if (!this.replay) {
			return;
		}
		if (i < 0) {
			i = 0;
		} else if (i >= this.replay.steps) {
			i = this.replay.steps - 1;
			this.set("autoplay", false);
		}
		this.index = i;
		this.draw();
	},

	click: function(mx, my) {

		if (!this.replay) {
			return;
		}

		let cell_size = calculate_square_size(this.canvas, this.replay.width, this.replay.height);
		let x = Math.floor(mx / cell_size);
		let y = Math.floor(my / cell_size);

		if (x < 0 || x >= this.replay.width || y < 0 || y >= this.replay.height) {
			return;
		}

		this.selection = this.replay.what_is_at(this.index, x, y);
		this.mouse = null;
		this.draw();
	},

	mouseover: function(mx, my) {

		if (!this.replay || this.selection) {
			return;
		}

		let old_val = this.mouse;

		let cell_size = calculate_square_size(this.canvas, this.replay.width, this.replay.height);
		let x = Math.floor(mx / cell_size);
		let y = Math.floor(my / cell_size);

		if (x < 0 || x >= this.replay.width || y < 0 || y >= this.replay.height) {
			this.mouse = null;
			if (old_val) {
				this.draw();
			}
		} else {
			this.mouse = {x, y};
			if (!old_val || old_val.x !== x || old_val.y !== y) {
				this.draw();
			}
		}
	},

	backward: function(n) {
		this.set("autoplay", false);
		this.set_index(this.index - n);
	},

	forward: function(n) {
		this.set("autoplay", false);
		this.set_index(this.index + n);
	},

	forward_auto: function() {
		this.set_index(this.index + 1);
	},

	draw: function() {
		if (this.replay) {
			draw(this.replay, this.index, this.canvas, this.selection, this.mouse);
			draw_info(this.replay, this.index, this.infodiv, this.selection, this.mouse);
		}
	},

	clear_selection: function() {
		this.selection = null;
		this.draw();
	},

	adjust_font_size: function(n) {
		let sz = config.info_font_size;
		sz += n;
		if (sz < 12) sz = 12;
		if (sz > 128) sz = 128;
		this.set("info_font_size", sz);
	},

};



module.exports = init();

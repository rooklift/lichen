"use strict";

const {ipcRenderer} = require("electron");

const multichecks = {};
const togglechecks = {
	autoplay: 		["Step", "Autoplay"],
	triangles:		["Misc", "Light triangles"],
};

for (let menupath of Object.values(multichecks)) {
	ipcRenderer.send("verify_menupath", menupath);
}

for (let menupath of Object.values(togglechecks)) {
	ipcRenderer.send("verify_menupath", menupath);
}

module.exports = {

	set: function(key, value) {

		config[key] = value;

		switch (key) {				// Any needed followup actions.

			case "triangles":
			case "maxed":
				hub.draw();
				break;
		}

		if (multichecks.hasOwnProperty(key)) {
			ipcRenderer.send("set_checks", multichecks[key].concat([value]));
		}

		if (togglechecks.hasOwnProperty(key)) {
			ipcRenderer.send(value ? "set_check_true" : "set_check_false", togglechecks[key]);
		}

	},

};
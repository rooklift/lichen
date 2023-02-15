"use strict";

const {ipcRenderer} = require("electron");

const multichecks = {
	autoplay_delay:		["Step", "Delay"],
};

const togglechecks = {
	autoplay: 			["Step", "Autoplay"],
	triangles:			["Misc", "Light triangles"],
	gridlines:			["Misc", "Gridlines"],
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

			case "gridlines":
			case "triangles":
			case "maxed":

				hub.draw();
				break;

			case "info_font_size":

				this.infodiv.style["font-size"] = value.toString() + "px";
				break;

			default:

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

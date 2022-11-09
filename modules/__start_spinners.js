"use strict";

// Poll the window size; adjust our settings if needed. Does nothing if main.js has told us we are
// maxed (by setting config.maxed). There is a race condition here -- the spinner might run after
// the maximize but before hub has told us about it -- but meh.

(function window_resize_spinner() {
	if (!config.maxed) {
		if (config.width !== window.innerWidth || config.height !== window.innerHeight) {
			config.width = window.innerWidth;
			config.height = window.innerHeight;
			if (!hub.resize_time) {
				hub.resize_time = performance.now();
			}
		}
	}

	if (hub.resize_time) {
		if (performance.now() - hub.resize_time > 100) {
			hub.resize_time = null;
			hub.draw();
		}
	}

	setTimeout(window_resize_spinner, 50);
})();

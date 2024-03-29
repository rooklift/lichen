"use strict";

const querystring = require("querystring");

// ------------------------------------------------------------------------------------------------

exports.get_href_query_val = function(key) {
	let s = global.location.search;
	if (s[0] === "?") s = s.slice(1);
	return querystring.parse(s)[key];
};

exports.copy_2d_array = function(arr) {

	let ret = [];

	let width = arr.length;					// Note, it makes no difference whether the array is
	let height = arr[0].length;				// "really" in [x][y] or [y][x] format (we don't care here)

	for (let x = 0; x < width; x++) {
		ret.push(Array.from(arr[x]));
	}

	return ret;
};

exports.new_2d_array = function(width, height, defval) {

	let ret = [];

	for (let x = 0; x < width; x++) {
		ret.push([]);
		for (let y = 0; y < height; y++) {
			ret[x].push(defval);
		}
	}

	return ret;
};

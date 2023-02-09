"use strict";

const {new_replay} = require("./replay_core");


function fixed_local_replay(r) {

	let steps = r.observations.length;
	let size = r.observations[0].board.rubble.length;

	let ret = new_replay(steps, size, size);

	ret.init(r.observations, r.actions);
	return ret;
}


module.exports = {fixed_local_replay};

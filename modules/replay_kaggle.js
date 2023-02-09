"use strict";

const {new_replay} = require("./replay_core");


function fixed_kaggle_replay(r) {

	let steps = r.steps.length;
	let size = r.configuration.env_cfg.map_size;
	
	let ret = new_replay(steps, size, size);

	let all_observations = r.steps.map(foo => JSON.parse(foo[0].observation.obs));

	let all_actions = r.steps.map(foo => {		// For actions, lets prefer the local format I guess...
		return {
			player_0: foo[0].action,
			player_1: foo[1].action,
		};
	});

	all_actions = all_actions.slice(1);			// Kaggle actions are out-of-place by 1 for whatever reason.

	ret.init(all_observations, all_actions);
	return ret;
}


module.exports = {fixed_kaggle_replay};

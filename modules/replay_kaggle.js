"use strict";

const {new_replay} = require("./replay_core");


function fixed_kaggle_replay(r) {

	let steps = r.steps.length;
	let size = r.configuration.env_cfg.map_size;
	
	let ret = new_replay(steps, size, size);

	let all_observations = r.steps.map(foo => JSON.parse(foo[0].observation.obs));
	ret.init(all_observations);
	return ret;
}


module.exports = {fixed_kaggle_replay};

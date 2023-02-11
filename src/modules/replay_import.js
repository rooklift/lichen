"use strict";

const {new_replay} = require("./replay_core");

function load_local_replay(r) {

	let cfg = require("./env_cfg");
	let steps = r.observations.length;
	let size = r.observations[0].board.rubble.length;
	let name_0;
	let name_1;

	try { name_0 = r.actions[0].player_0.faction; } catch (err) { name_0 = "Unknown"; }
	try { name_1 = r.actions[0].player_1.faction; } catch (err) { name_1 = "Unknown"; }

	let ret = new_replay(cfg, steps, size, size, name_0, name_1);

	ret.init(r.observations, r.actions);
	return ret;
}

function load_kaggle_replay(r) {

	let cfg = r.configuration.env_cfg;
	let steps = r.steps.length;
	let size = cfg.map_size;
	let name_0 = r.info.TeamNames[0];
	let name_1 = r.info.TeamNames[1];
	
	let ret = new_replay(cfg, steps, size, size, name_0, name_1);

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


module.exports = {load_local_replay, load_kaggle_replay};

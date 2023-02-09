"use strict";

const {new_replay} = require("./replay_core");


function fixed_local_replay(r) {

	let steps = r.observations.length;
	let size = r.observations[0].board.rubble.length;

	let name_0;
	let name_1;

	try { name_0 = r.actions[0].player_0.faction; } catch (err) { name_0 = "Unknown"; }
	try { name_1 = r.actions[0].player_1.faction; } catch (err) { name_0 = "Unknown"; }

	let ret = new_replay(steps, size, size, name_0, name_1);
	ret.init(r.observations, r.actions);
	return ret;
}


module.exports = {fixed_local_replay};

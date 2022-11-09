"use strict";

function fixed_kaggle_replay(raw_replay) {
	let ret = Object.create(kaggle_replay_props);
	ret.r = raw_replay;
	return ret;
}

const kaggle_replay_props = {
	// TODO
};

module.exports = {fixed_kaggle_replay};

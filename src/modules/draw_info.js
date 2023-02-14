"use strict";

const {enums, printable_action} = require("./types");

function draw_info(replay, index, infodiv, selection, mouse) {

	if (!selection) {
		if (mouse) {
			selection = replay.what_is_at(index, mouse.x, mouse.y);
		}
	}

	infodiv.style["font-size"] = config.info_font_size.toString() + "px";

	let lines = [];				// Will be joined by <br> tags.
	if (selection) {
		if (selection.type === "unit") {
			let unit = replay.get_unit_by_id(index, selection.name);
			if (unit) {
				lines = lines.concat(cell_info_lines(replay, index, {x: unit.pos[0], y: unit.pos[1]}));
				lines.push(``);
				lines = lines.concat(unit_info_lines(replay, index, unit));
			} else {
				let status = (selection.i > index) ? "not yet built" : "destroyed";
				lines.push(`<span class="player_${selection.team_id}">${selection.name}</span> - ${status}`);
			}
		} else if (selection.type === "factory") {
			let factory = replay.get_factory_by_id(index, selection.name);
			if (factory) {
				lines = lines.concat(cell_info_lines(replay, index, {x: factory.pos[0], y: factory.pos[1]}));
				lines.push(``);
				lines = lines.concat(factory_info_lines(replay, index, factory));
			} else {
				let status = (selection.i > index) ? "not yet built" : "destroyed";
				lines.push(`<span class="player_${selection.team_id}">${selection.name}</span> - ${status}`);
			}
		} else if (selection.type === "tile") {
			lines = lines.concat(cell_info_lines(replay, index, selection));
		}
	}
	infodiv.innerHTML = summary_table(replay, index) + `<br>` + lines.join("<br>\n");
}

function unit_info_lines(replay, index, unit) {

	let lines = [];

	lines.push(`<span class="player_${unit.team_id}">${unit.unit_id}</span> &nbsp; <span class="power">⚡${unit.power}</span>`);
	lines.push(`🧊${unit.cargo.ice} &nbsp; 🌑${unit.cargo.ore} &nbsp; 💧${unit.cargo.water} &nbsp; ⚙️${unit.cargo.metal}`);
	lines.push(``);
	let queue;
	let power_left = unit.power;
	let request = replay.unit_request(index, unit.unit_id);
	if (Array.isArray(request)) {								// Which might be []
		queue = request;
		power_left -= replay.cfg.ROBOTS[unit.unit_type].ACTION_QUEUE_POWER_COST;
		lines.push(`<span class="player_${unit.team_id}">New request issued:</span>`);
	} else {
		queue = unit.action_queue;
		lines.push(``);
	}
	let unable = false;
	if (queue.length > 0 && Array.isArray(queue[0])) {
		 if (queue[0][0] === enums.MOVE && queue[0][1] !== enums.CENTRE) {
			let [x, y] = unit.pos;
			let direction = queue[0][1];
			if (direction === enums.UP) y--;
			if (direction === enums.RIGHT) x++;
			if (direction === enums.DOWN) y++;
			if (direction === enums.LEFT) x--;
			if (x < 0 || x >= replay.width || y < 0 || y >= replay.height) {
				unable = true;
			} else {
				if (power_left < replay.movement_cost(index, x, y, unit.unit_type)) {
					unable = true;
				} else {
					let wia = replay.what_is_at(index, x, y);
					if (wia.type === "factory" && wia.team_id !== unit.team_id) {
						unable = true;
					}
				}
			}
		} else if (queue[0][0] === enums.DIG) {
			if (power_left < replay.cfg.ROBOTS[unit.unit_type].DIG_COST) {
				unable = true;
			}
		} else if (queue[0][0] === enums.SELFDESTRUCT) {
			if (power_left < replay.cfg.ROBOTS[unit.unit_type].SELF_DESTRUCT_COST) {
				unable = true;
			}
		}
	}
	for (let i = 0; i < queue.length; i++) {
		let action = queue[i];
		lines.push(`${printable_action(action)} &nbsp; ${unable && i === 0 ? '<span class="warning">(unable)</span>' : ""}`);
	}
	if (Array.isArray(request) && !replay.unit_can_receive_request(index, unit.unit_id)) {
		lines.push(`<span class="warning">Unit cannot receive this request!</span>`);
	}

	return lines;
}

function factory_info_lines(replay, index, factory) {
	let lines = [];
	lines.push(`<span class="player_${factory.team_id}">${factory.unit_id}</span> &nbsp; <span class="power">⚡${factory.power}</span>`);
	lines.push(`🧊${factory.cargo.ice} &nbsp; 🌑${factory.cargo.ore} &nbsp; 💧${factory.cargo.water} &nbsp; ⚙️${factory.cargo.metal}`);
	let [score, tiles] = replay.factory_lichen(index, factory.strain_id);
	lines.push(`🌿<span class="player_${factory.team_id}">${score} [${tiles}]</span>`);
	let request = replay.factory_request(index, factory.unit_id);
	if (typeof request === "number") {
		lines.push(``);
		if (request === enums.BUILD_LIGHT) {
			lines.push("Build light");
		} else if (request === enums.BUILD_HEAVY) {
			lines.push("Build heavy");
		} else if (request === enums.WATER_LICHEN) {
			lines.push("Water lichen");
		}
	}
	return lines;
}

function cell_info_lines(replay, index, xy_haver) {

	let lines = [];

	let {x, y} = xy_haver;

	let rubble = replay.cell_rubble(index, x, y);
	let lichen = replay.cell_lichen(index, x, y);
	let lichen_strain = replay.cell_lichen_strain(index, x, y);

	if (replay.cell_type(x, y) === enums.ICE) {
		lines.push(`[${x},${y}] &nbsp; Ice${rubble > 0 ? ", " + rubble.toString() + " rubble" : ""}`);
	} else if (replay.cell_type(x, y) === enums.ORE) {
		lines.push(`[${x},${y}] &nbsp; Ore${rubble > 0 ? ", " + rubble.toString() + " rubble" : ""}`);
	} else if (lichen > 0) {
		lines.push(`[${x},${y}] &nbsp; ${lichen} lichen (strain ${lichen_strain})`);
	} else {
		lines.push(`[${x},${y}] &nbsp; ${rubble > 0 ? rubble.toString() + " rubble" : ""}`);
	}

	return lines;
}

function summary_table(replay, index) {

	let scores = replay.lichen_scores(index);
	let robot_counts = replay.robot_counts(index);

	return `
	<table>
		<tr class="black">
			<td>Lichen..........</td>
			<td>Robots...</td>
		</tr>
		<tr>
			<td>Turn ${replay.real_step(index)}</td>
			<td class="gray">${replay.is_night(index) ? "(Night)" : ""}</td>
		</tr>
		<tr class="player_0">
			<td>🌿${scores.player_0}</td>
			<td>🤖${robot_counts.player_0.HEAVY} + ${robot_counts.player_0.LIGHT}</td>
		</tr>
		<tr class="player_1">
			<td>🌿${scores.player_1}</td>
			<td>🤖${robot_counts.player_1.HEAVY} + ${robot_counts.player_1.LIGHT}</td>
		</tr>
	</table>`;
}


module.exports = {draw_info};

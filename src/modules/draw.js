"use strict";

const {enums, printable_action} = require("./types");

const all_rubble_colours = make_colour_scale([0x96, 0x96, 0x96], [0xe6, 0xe6, 0xe6]);
const blue_lichen_colours = make_colour_scale([0x8b, 0xc0, 0xed], [0xde, 0xe9, 0xf2]);
const red_lichen_colours = make_colour_scale([0xf2, 0x99, 0x99], [0xf3, 0xe1, 0xe1]);

const factory_colours = [blue_lichen_colours[100], red_lichen_colours[100]];
const unit_colours = ["#228be6ff", "#f03e3eff"];

const ore_colour = "#181818ff";
const water_colour = "#48dbfbff";

function calculate_square_size(canvas, map_width, map_height) {
	let foo = canvas.width / map_width;
	let bar = canvas.height / map_height;
	return Math.floor(Math.min(foo, bar));
}

function draw(replay, index, canvas, infodiv, selection) {

	canvas.height = window.innerHeight;
	canvas.width = canvas.height;
	infodiv.style["font-size"] = config.info_font_size.toString() + "px";

	var ctx = canvas.getContext("2d");

	if (!replay) {
		return;
	}

	let cell_size = calculate_square_size(canvas, replay.width, replay.height);

	ctx.fillStyle = "#ffffffff";
	ctx.fillRect(0, 0, cell_size * replay.width, cell_size * replay.height);

	for (let x = 0; x < replay.width; x++) {
		for (let y = 0; y < replay.height; y++) {

			let cell_type = replay.cell_type(x, y);
			let lichen = replay.cell_lichen(index, x, y);

			if (lichen > 0) {
				if (replay.lichen_owner(index, x, y) === "player_0") {
					fill_cell(blue_lichen_colours[lichen], ctx, cell_size, x, y);
				} else {
					fill_cell(red_lichen_colours[lichen], ctx, cell_size, x, y);
				}
			} else if (cell_type === enums.NORMAL) {
				let rubble = replay.cell_rubble(index, x, y);
				let colour = rubble > 100 ? all_rubble_colours[100] : all_rubble_colours[rubble];
				fill_cell(colour, ctx, cell_size, x, y);
			} else if (cell_type === enums.ICE) {
				fill_cell(water_colour, ctx, cell_size, x, y);
			} else if (cell_type === enums.ORE) {
				fill_cell(ore_colour, ctx, cell_size, x, y);
			}
		}
	}

	for (let factory of replay.get_factories(index)) {
		ctx.fillStyle = factory_colours[factory.team_id];
		let [x, y] = factory.pos;
		ctx.fillRect((x - 1) * cell_size + 1, (y - 1) * cell_size + 1, cell_size * 3 - 1, cell_size * 3 - 1);
	}

	for (let unit of replay.get_units(index)) {
		let [x, y] = unit.pos;
		if (unit.unit_type === "HEAVY") {
			fill_cell(unit_colours[unit.team_id], ctx, cell_size, x, y);
		} else {
			if (config.triangles) {
				fill_triangle(unit_colours[unit.team_id], ctx, cell_size, x, y, replay.unit_direction(index, unit.unit_id));
			} else {
				fill_circle(unit_colours[unit.team_id], ctx, cell_size, x, y);
			}
		}
	}

	if (selection) {
		let thing;
		if (selection.type === "unit") {
			thing = replay.get_unit_by_id(index, selection.name);
		} else if (selection.type === "factory") {
			thing = replay.get_factory_by_id(index, selection.name);
		} else {
			thing = {pos: [selection.x, selection.y]};
		}
		if (thing) {
			let [x, y] = thing.pos;
			ctx.strokeStyle = "#000000ff";
			let gx = x * cell_size + (cell_size / 2) + 0.5;
			let gy = y * cell_size + (cell_size / 2) + 0.5;
			ctx.beginPath();
			ctx.moveTo(0, gy);
			ctx.lineTo(cell_size * replay.width, gy);
			ctx.stroke();
			ctx.moveTo(gx, 0);
			ctx.lineTo(gx, cell_size * replay.width);
			ctx.stroke();
		}
	}

	draw_info(replay, index, infodiv, selection);
}

function fill_cell(colour, ctx, cell_size, x, y) {
	ctx.fillStyle = colour;
	ctx.fillRect(x * cell_size + 1, y * cell_size + 1, cell_size - 1, cell_size - 1);
}

function fill_circle(colour, ctx, cell_size, x, y) {
	ctx.fillStyle = colour;
	let gx = x * cell_size + (cell_size / 2) + 0.5;
	let gy = y * cell_size + (cell_size / 2) + 0.5;
	ctx.beginPath();
	ctx.arc(gx, gy, Math.max(cell_size / 2 - 2, 1), 0, 2 * Math.PI);
	ctx.fill();
}

function fill_triangle(colour, ctx, cell_size, x, y, direction) {
	ctx.fillStyle = colour;
	let a = 0.1;
	let b = 0.5;
	let c = 1 - a;
	if (direction === enums.UP) {
		ctx.beginPath();
		ctx.moveTo((x + a) * cell_size, (y + c) * cell_size);
		ctx.lineTo((x + c) * cell_size, (y + c) * cell_size);
		ctx.lineTo((x + b) * cell_size, (y + a) * cell_size);
		ctx.fill();
	} else if (direction === enums.RIGHT) {
		ctx.beginPath();
		ctx.moveTo((x + a) * cell_size, (y + a) * cell_size);
		ctx.lineTo((x + a) * cell_size, (y + c) * cell_size);
		ctx.lineTo((x + c) * cell_size, (y + b) * cell_size);
		ctx.fill();
	} else if (direction === enums.DOWN) {
		ctx.beginPath();
		ctx.moveTo((x + a) * cell_size, (y + a) * cell_size);
		ctx.lineTo((x + c) * cell_size, (y + a) * cell_size);
		ctx.lineTo((x + b) * cell_size, (y + c) * cell_size);
		ctx.fill();
	} else if (direction === enums.LEFT) {
		ctx.beginPath();
		ctx.moveTo((x + c) * cell_size, (y + a) * cell_size);
		ctx.lineTo((x + c) * cell_size, (y + c) * cell_size);
		ctx.lineTo((x + a) * cell_size, (y + b) * cell_size);
		ctx.fill();
	} else {
		fill_circle(colour, ctx, cell_size, x, y);
	}
}

function draw_info(replay, index, infodiv, selection) {
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
	let request = replay.unit_request(index, unit.unit_id);
	if (request) {
		queue = request;
		lines.push(`<span class="player_${unit.team_id}">New request issued:</span>`);
	} else {
		queue = unit.action_queue;
		lines.push(``);
	}
	for (let action of queue) {
		lines.push(`${printable_action(action)}`);
	}
	if (request && !replay.unit_can_receive_request(index, unit.unit_id)) {
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

function make_colour_scale(dark_rgb, light_rgb) {

	// Returns 101 html colour values
	// Arguments should be in the form of [3]int

	let ret = ["#f4f4f4ff"];				// At index zero.

	for (let n = 1; n <= 100; n++) {

		let s = "";

		for (let i = 0; i < 3; i++) {
			let scale = light_rgb[i] - dark_rgb[i];
			let hex = (light_rgb[i] - Math.floor((n / 100) * scale)).toString(16);
			if (hex.length === 1) hex = "0" + hex;
			s += hex;
		}

		ret.push(`#${s}ff`);
	}

	return ret;
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


module.exports = {draw, calculate_square_size};

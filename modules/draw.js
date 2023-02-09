"use strict";

const {NORMAL, ICE, ORE, printable_action} = require("./types");

const team_colours = ["#228be6ff", "#f03e3eff"];
const factory_colours = ["#59a8ecff", "#f46e6eff"];
const lichen_colours = ["#c5ddf1ff", "#f4cbcbff"];

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

			if (replay.cell_lichen(index, x, y) > 0) {
				let colour = lichen_colours[replay.lichen_owner(index, x, y)];
				fill_cell(colour, ctx, cell_size, x, y);
			} else if (cell_type === NORMAL) {
				let colour = replay.cell_rubble(index, x, y) > 0 ? "#cdcdcdff" : "#f4f4f4ff";
				fill_cell(colour, ctx, cell_size, x, y);
			} else if (cell_type === ICE) {
				fill_cell("#48dbfbff", ctx, cell_size, x, y);
			} else if (cell_type === ORE) {
				fill_cell("#2c3e50ff", ctx, cell_size, x, y);
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
			fill_cell(team_colours[unit.team_id], ctx, cell_size, x, y);
		} else {
			fill_circle(team_colours[unit.team_id], ctx, cell_size, x, y);
		}
	}

	if (selection && selection.startsWith("unit_")) {
		let unit = replay.get_unit_by_id(index, selection);
		if (unit) {
			let [x, y] = unit.pos;
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

function draw_info(replay, index, infodiv, selection) {
	let lines = [];
	lines.push(`<br>Turn ${replay.real_step(index)}`);
	lines.push(`<br>`);
	if (selection && selection.startsWith("unit_")) {
		let unit = replay.get_unit_by_id(index, selection);
		if (unit) {
			lines.push(`<br><span class="player_${unit.team_id}">${selection}</span> &nbsp; [${unit.pos[0]},${unit.pos[1]}]`);
			lines.push(`<br>` +
				`<span class="power">pwr: ${unit.power}</span> &nbsp;` +
				`<span class="ice">ice: ${unit.cargo.ice}</span> &nbsp;` +
				`<span class="ore">ore: ${unit.cargo.ore}</span>`
			);
			lines.push(`<br>`);
			let queue;
			let request = replay.unit_request(index, unit.unit_id);
			if (request) {
				queue = request;
				lines.push(`<br><span class="player_${unit.team_id}">New request issued:</span>`);
			} else {
				queue = unit.action_queue;
				lines.push(`<br>`);
			}
			for (let action of queue) {
				lines.push(`<br>${printable_action(action)}`);
			}
			if (request && !replay.unit_can_receive_request(index, unit.unit_id)) {
				lines.push(`<br><span class="warning">Unit cannot receive this request!</span>`);
			}
		} else {
			lines.push(`<br>${selection} - not present`);
		}
	}
	infodiv.innerHTML = lines.join("\n");
}

function calculate_square_size(canvas, map_width, map_height) {
	let foo = canvas.width / map_width;
	let bar = canvas.height / map_height;
	return Math.floor(Math.min(foo, bar));
}

module.exports = {draw, calculate_square_size};

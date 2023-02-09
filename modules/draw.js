"use strict";

const types = require("./types");

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
				ctx.fillStyle = lichen_colours[replay.lichen_owner(index, x, y)];
			} else if (cell_type === types.NORMAL) {
				ctx.fillStyle = replay.cell_rubble(index, x, y) > 0 ? "#cdcdcdff" : "#f4f4f4ff";
			} else if (cell_type === types.ICE) {
				ctx.fillStyle = "#48dbfbff";
			} else if (cell_type === types.ORE) {
				ctx.fillStyle = "#2c3e50ff";
			}

			fill_cell(ctx, cell_size, x, y);
		}
	}

	for (let factory of replay.get_factories(index)) {
		ctx.fillStyle = factory_colours[factory.team_id];
		let [x, y] = factory.pos;
		ctx.fillRect((x - 1) * cell_size + 1, (y - 1) * cell_size + 1, cell_size * 3 - 1, cell_size * 3 - 1);
	}

	for (let unit of replay.get_units(index)) {
		ctx.fillStyle = team_colours[unit.team_id];
		let [x, y] = unit.pos;
		fill_cell(ctx, cell_size, x, y);
	}

	draw_info(replay, index, infodiv, selection);
}

function fill_cell(ctx, cell_size, x, y) {
	ctx.fillRect(x * cell_size + 1, y * cell_size + 1, cell_size - 1, cell_size - 1);
}

function draw_info(replay, index, infodiv, selection) {
	let lines = [];
	lines.push(`<br>Turn ${replay.real_step(index)}<br>`);
	infodiv.innerHTML = lines.join("\n");
}

function calculate_square_size(canvas, map_width, map_height) {
	let foo = canvas.width / map_width;
	let bar = canvas.height / map_height;
	return Math.floor(Math.min(foo, bar));
}

module.exports = {draw, calculate_square_size};

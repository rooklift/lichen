"use strict";

const types = require("./types");

const team_colours = ["#ff0000ff", "#ff0000ff"];
const factory_colours = ["#ffffffff", "#ffffffff"];

function draw(replay, index, canvas, infodiv, selection) {

	canvas.height = window.innerHeight;
	canvas.width = canvas.height;
	infodiv.style["font-size"] = config.info_font_size.toString() + "px";

	var ctx = canvas.getContext("2d");

	if (!replay) {
		return;
	}

	let cell_size = calculate_square_size(canvas, replay.width(), replay.height());

	ctx.fillStyle = "#000000ff";
	ctx.fillRect(0, 0, cell_size * replay.width(), cell_size * replay.height());

	for (let x = 0; x < replay.width(); x++) {
		for (let y = 0; y < replay.height(); y++) {

			let cell_type = replay.cell_type(x, y);

			if (replay.cell_lichen(index, x, y) > 0) {
				ctx.fillStyle = "#33cc33ff";
			} else if (cell_type === types.NORMAL) {
				ctx.fillStyle = replay.cell_rubble(index, x, y) > 0 ? "#060606ff" : "#222222ff";
			} else if (cell_type === types.ICE) {
				ctx.fillStyle = "#3366ccff";
			} else if (cell_type === types.ORE) {
				ctx.fillStyle = "#cc9966ff";
			}

			ctx.fillRect(x * cell_size + 2, y * cell_size + 2, cell_size - 4, cell_size - 4);
		}
	}

	for (let factory of replay.get_factories(index)) {
		ctx.fillStyle = factory_colours[factory.team_id];
		let [x, y] = factory.pos;
		for (let i = x - 1; i <= x + 1; i++) {
			for (let j = y - 1; j <= y + 1; j++) {
				ctx.fillRect(i * cell_size + 2, j * cell_size + 2, cell_size - 4, cell_size - 4);
			}
		}
	}

	for (let unit of replay.get_units(index)) {
		ctx.fillStyle = team_colours[unit.team_id];
		let [x, y] = unit.pos;
		ctx.fillRect(x * cell_size + 2, y * cell_size + 2, cell_size - 4, cell_size - 4);
	}

	draw_info(replay, index, infodiv, selection);
}

function draw_info(replay, index, infodiv, selection) {
	let lines = [];
	lines.push(`<br>Turn ${index}<br>`);
	infodiv.innerHTML = lines.join("\n");
}

function calculate_square_size(canvas, map_width, map_height) {
	let foo = canvas.width / map_width;
	let bar = canvas.height / map_height;
	return Math.floor(Math.min(foo, bar));
}

module.exports = {draw, calculate_square_size};

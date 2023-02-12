"use strict";

const {enums} = require("./types");

const all_rubble_colours = make_colour_scale([0x96, 0x96, 0x96], [0xe6, 0xe6, 0xe6]);
const blue_lichen_colours = make_colour_scale([0x8b, 0xc0, 0xed], [0xde, 0xe9, 0xf2]);
const red_lichen_colours = make_colour_scale([0xf2, 0x99, 0x99], [0xf3, 0xe1, 0xe1]);

const factory_colours = [blue_lichen_colours[100], red_lichen_colours[100]];
const unit_colours = ["#228be6ff", "#f03e3eff"];

const ore_colour = "#181818ff";
const water_colour = "#48dbfbff";


function draw(replay, index, canvas, selection, mouse) {

	if (!selection) {
		if (mouse) {
			selection = replay.what_is_at(index, mouse.x, mouse.y);
		}
	}

	canvas.height = window.innerHeight;
	canvas.width = canvas.height;

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
		let [x, y] = factory.pos;
		let x1 = (x - 1) * cell_size;
		let y1 = (y - 1) * cell_size;
		ctx.fillStyle = factory_colours[factory.team_id];
		ctx.fillRect(x1, y1, cell_size * 3 + 1, cell_size * 3 + 1);
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

	for (let factory of replay.get_factories(index)) {
		let [x, y] = factory.pos;
		let x1 = (x - 1) * cell_size;
		let y1 = (y - 1) * cell_size;
		let x2 = (x + 2) * cell_size;
		let y2 = (y + 2) * cell_size;
		let ln = cell_size * 3 + 1;
		let wd = 3;
		ctx.fillStyle = "#000000ff";
		ctx.fillRect(x1 + 0, y1 + 0, wd, ln);		// Left edge
		ctx.fillRect(x2 - 2, y1 + 0, wd, ln);		// Right edge
		ctx.fillRect(x1 + 0, y1 + 0, ln, wd);		// Top edge
		ctx.fillRect(x1 + 0, y2 - 2, ln, wd);		// Bottom edge
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
}

function fill_cell(colour, ctx, cell_size, x, y) {
	ctx.fillStyle = colour;
	if (config.gridlines) {
		ctx.fillRect(x * cell_size + 1, y * cell_size + 1, cell_size - 1, cell_size - 1);
	} else {
		ctx.fillRect(x * cell_size, y * cell_size, cell_size, cell_size);
	}
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

// ------------------------------------------------------------------------------------------------

function calculate_square_size(canvas, map_width, map_height) {
	let foo = canvas.width / map_width;
	let bar = canvas.height / map_height;
	return Math.floor(Math.min(foo, bar));
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


module.exports = {draw, calculate_square_size};

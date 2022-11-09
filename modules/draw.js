"use strict";

function draw(replay, index, canvas, infodiv, selection) {

	canvas.height = window.innerHeight;
	canvas.width = canvas.height;
	infodiv.style["font-size"] = config.info_font_size.toString() + "px";

	var ctx = canvas.getContext("2d");

	if (!replay) {
		return;
	}

	let square_size = calculate_square_size(canvas, 48, 48);

	ctx.fillStyle = "#000000ff";
	ctx.fillRect(0, 0, square_size * 48, square_size * 48);

}

function calculate_square_size(canvas, map_width, map_height) {
	let foo = canvas.width / map_width;
	let bar = canvas.height / map_height;
	return Math.floor(Math.min(foo, bar));
}

module.exports = {draw, calculate_square_size};

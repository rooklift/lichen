"use strict";

const {ipcRenderer} = require("electron");

window.addEventListener("error", (event) => {
	alert("An uncaught exception happened in the renderer process. See the dev console for details. The app might now be in a bad state.");
}, {once: true});

// ------------------------------------------------------------------------------------------------

ipcRenderer.on("set", (event, msg) => {
	for (let [key, value] of Object.entries(msg)) {
		hub.set(key, value);
	}
});

ipcRenderer.on("toggle", (event, msg) => {
	hub.set(msg, !config[msg]);
});

ipcRenderer.on("call", (event, msg) => {
	let fn;
	if (typeof msg === "string") {																		// msg is function name
		fn = hub[msg].bind(hub);
	} else if (typeof msg === "object" && typeof msg.fn === "string" && Array.isArray(msg.args)) {		// msg is object with fn and args
		fn = hub[msg.fn].bind(hub, ...msg.args);
	} else {
		console.log("Bad call, msg was...");
		console.log(msg);
	}
	fn();
});

// ------------------------------------------------------------------------------------------------
// Dragging files onto the window should load them...

window.addEventListener("dragenter", (event) => {		// Necessary to prevent brief flashes of "not allowed" icon.
	event.preventDefault();
});

window.addEventListener("dragover", (event) => {		// Necessary to prevent always having the "not allowed" icon.
	event.preventDefault();
});

window.addEventListener("drop", (event) => {
	event.preventDefault();
	let files = [];
	if (event.dataTransfer && event.dataTransfer.files) {
		for (let file of event.dataTransfer.files) {
			if (file.path) {
				files.push(file.path);
			}
		}
	}
	if (files.length > 0) {
		hub.load(files[0]);
	}
});

// ------------------------------------------------------------------------------------------------

canvas.addEventListener("mousedown", (event) => {
	event.preventDefault();							// Stop from selecting text etc.
	event.stopPropagation();						// So it can't reach the window handler, see below.
	hub.click(event.offsetX, event.offsetY);
});

window.addEventListener("mousedown", (event) => {
	event.preventDefault();							// Stop from selecting text etc.
	hub.clear_selection();
});

for (let s of ["mousemove", "mouseleave"]) {
	canvas.addEventListener(s, (event) => {
		hub.mouseover(event.offsetX, event.offsetY);
	});
}

"use strict";

const electron = require("electron");
const path = require("path");
const alert = require("./modules/alert_main");
const stringify = require("./modules/stringify");

const config_io = require("./modules/config_io");					// Creates global.config
config_io.load();													// Populates global.config

let menu = menu_build();
let menu_is_set = false;
let have_sent_quit = false;
let have_received_terminate = false;
let win;											// Need to keep global references to every window we make. (Is that still true?)

electron.app.whenReady().then(() => {

	electron.nativeTheme.themeSource = "light";

	let desired_zoomfactor = 1 / electron.screen.getPrimaryDisplay().scaleFactor;

	win = new electron.BrowserWindow({
		width: Math.round(config.width * desired_zoomfactor),
		height: Math.round(config.height * desired_zoomfactor),
		backgroundColor: "#ffffffff",
		resizable: true,
		show: false,
		useContentSize: true,
		webPreferences: {
			backgroundThrottling: false,
			contextIsolation: false,
			nodeIntegration: true,
			spellcheck: false,
			zoomFactor: desired_zoomfactor			// Unreliable? See https://github.com/electron/electron/issues/10572
		}
	});

	win.once("ready-to-show", () => {

		try {
			win.webContents.setZoomFactor(desired_zoomfactor);	// This seems to work, note issue 10572 above.
		} catch (err) {
			win.webContents.zoomFactor = desired_zoomfactor;	// The method above "will be removed" in future.
		}

		if (config.maxed) {
			win.maximize();
		}

		win.show();
		win.focus();
	});

	win.on("maximize", (event) => {
		win.webContents.send("set", {maxed: true});
	});

	win.on("unmaximize", (event) => {					// Note that these are not received when a maximized window is minimized.
		win.webContents.send("set", {maxed: false});	// I think they are only received when a maximized window becomes normal.
	});													// So our .maxed var tracks what we are trying to be, when shown at all.

	// Note: even though there is an event called "restore", if we call win.restore() for a minimized window
	// which wants to go back to being maximized, it generates a "maximize" event, not a "restore" event.

	win.on("close", (event) => {						// We used to use .once() but I suppose there's a race condition if two events happen rapidly.

		if (!have_received_terminate) {

			event.preventDefault();						// Only a "terminate" message from the Renderer should close the app.

			if (!have_sent_quit) {
				win.webContents.send("call", "quit");	// Renderer's "quit" method runs. It then sends "terminate" back.
				have_sent_quit = true;
			}

			// Create a setTimeout that will make the app close without the renderer's help if it takes too long (due to a crash)...

			setTimeout(() => {
				console.log("Renderer seems unresponsive, quitting anyway.");
				have_received_terminate = true;
				win.close();
			}, 3000);
		}
	});

	electron.ipcMain.on("terminate", () => {
		have_received_terminate = true;					// Needed so the "close" handler (see above) knows to allow it.
		win.close();
	});

	electron.app.on("window-all-closed", () => {
		electron.app.quit();
	});

	electron.ipcMain.once("renderer_ready", () => {
		// This is the place to load any files given on command line.
	});

	electron.ipcMain.on("set_title", (event, msg) => {
		win.setTitle(msg);
	});

	electron.ipcMain.on("alert", (event, msg) => {
		alert(win, msg);
	});

	electron.ipcMain.on("set_checks", (event, msg) => {
		set_checks(msg);
	});

	electron.ipcMain.on("set_check_false", (event, msg) => {
		set_one_check(false, msg);
	});

	electron.ipcMain.on("set_check_true", (event, msg) => {
		set_one_check(true, msg);
	});

	electron.ipcMain.on("verify_menupath", (event, msg) => {
		verify_menupath(msg);
	});

	electron.Menu.setApplicationMenu(menu);
	menu_is_set = true;

	// Actually load the page last, I guess, so the event handlers above are already set up.
	// Send some possibly useful info as a query.

	let query = {};
	query.user_data_path = electron.app.getPath("userData");

	win.loadFile(
		path.join(__dirname, "renderer.html"),
		{query: query}
	);
});

// --------------------------------------------------------------------------------------------------------------

function menu_build() {

	const template = [
		{
			label: "App",
			submenu: [
				{
					label: "About",
					click: () => {
						alert(win, `${electron.app.getName()} (${electron.app.getVersion()}) in Electron (${process.versions.electron})`);
					}
				},
				{
					type: "separator",
				},
				{
					label: "Open replay...",
					accelerator: "CommandOrControl+O",
					click: () => {
						electron.dialog.showOpenDialog(win, {defaultPath: config.open_folder})
						.then(o => {
							if (Array.isArray(o.filePaths) && o.filePaths.length > 0) {
								win.webContents.send("call", {
									fn: "load",
									args: [o.filePaths[0]]
								});
								two_process_set("open_folder", path.dirname(o.filePaths[0]));
							}
						});
					}
				},
				{
					type: "separator",
				},
				{
					role: "toggledevtools"
				},
				{
					label: `Show ${config_io.filename}`,
					click: () => {
						electron.shell.showItemInFolder(config_io.filepath);
					}
				},
				{
					type: "separator",
				},
				{
					label: "Quit",
					accelerator: "CommandOrControl+Q",
					role: "quit"
				},
			]
		},
		{
			label: "Step",
			submenu: [
				{
					label: "Backward",
					accelerator: "Left",
					click: () => {
						win.webContents.send("call", {
							fn: "backward",
							args: [1]
						});
					}
				},
				{
					label: "Forward",
					accelerator: "Right",
					click: () => {
						win.webContents.send("call", {
							fn: "forward",
							args: [1]
						});
					}
				},
				{
					type: "separator",
				},
				{
					label: "Backward 10",
					accelerator: "PageUp",
					click: () => {
						win.webContents.send("call", {
							fn: "backward",
							args: [10]
						});
					}
				},
				{
					label: "Forward 10",
					accelerator: "PageDown",
					click: () => {
						win.webContents.send("call", {
							fn: "forward",
							args: [10]
						});
					}
				},
				{
					type: "separator",
				},
				{
					label: "Go to start",
					accelerator: "Home",
					click: () => {
						win.webContents.send("call", {
							fn: "backward",
							args: [999999]
						});
					}
				},
				{
					label: "Go to end",
					accelerator: "End",
					click: () => {
						win.webContents.send("call", {
							fn: "forward",
							args: [999999]
						});
					}
				},
				{
					type: "separator",
				},
				{
					label: "Autoplay",
					accelerator: "Space",
					type: "checkbox",
					checked: false,						// Not saved to config
					click: () => {
						win.webContents.send("toggle", "autoplay");
					}
				},
				{
					label: "Delay",
					submenu: [
						{
							label: "100",
							type: "checkbox",
							checked: config.autoplay_delay === 100,
							click: () => {
								win.webContents.send("set", {autoplay_delay: 100});
							}
						},
						{
							label: "50",
							type: "checkbox",
							checked: config.autoplay_delay === 50,
							click: () => {
								win.webContents.send("set", {autoplay_delay: 50});
							}
						},
						{
							label: "25",
							type: "checkbox",
							checked: config.autoplay_delay === 25,
							click: () => {
								win.webContents.send("set", {autoplay_delay: 25});
							}
						},
					]
				},
			]
		},
		{
			label: "Misc",
			submenu: [
				{
					label: "Backward",
					accelerator: "Up",
					click: () => {
						win.webContents.send("call", {
							fn: "backward",
							args: [1]
						});
					}
				},
				{
					label: "Forward",
					accelerator: "Down",
					click: () => {
						win.webContents.send("call", {
							fn: "forward",
							args: [1]
						});
					}
				},
				{
					type: "separator",
				},
				{
					label: "Clear selection",
					accelerator: "Escape",
					click: () => {
						win.webContents.send("call", "clear_selection");
					}
				},
				{
					type: "separator",
				},
				{
					label: "Light triangles",
					type: "checkbox",
					checked: config.triangles,
					click: () => {
						win.webContents.send("toggle", "triangles");
					}
				},
				{
					label: "Gridlines",
					type: "checkbox",
					checked: config.gridlines,
					click: () => {
						win.webContents.send("toggle", "gridlines");
					}
				},
				{
					type: "separator",
				},
				{
					label: "Increase font size",
					accelerator: "CommandOrControl+]",
					click: () => {
						win.webContents.send("call", {
							fn: "adjust_font_size",
							args: [2]
						});
					}
				},
				{
					label: "Decrease font size",
					accelerator: "CommandOrControl+[",
					click: () => {
						win.webContents.send("call", {
							fn: "adjust_font_size",
							args: [-2]
						});
					}
				},
			],
		},
	];

	return electron.Menu.buildFromTemplate(template);
}

// --------------------------------------------------------------------------------------------------------------

function two_process_set(key, value) {

	// For most keys we don't care that the main and renderer processes get their configs out
	// of sync as the user changes things, but this function can be used when it does matter.
	// Remember it's the renderer process that actually saves our config file.

	config[key] = value;

	let msg = {};
	msg[key] = value;					// not msg = {key: value} which makes the key "key"
	win.webContents.send("set", msg);
}

// --------------------------------------------------------------------------------------------------------------

function get_submenu_items(menupath) {

	// Not case-sensitive (or even type sensitive) in the menupath array, above.
	//
	// If the path is to a submenu, this returns a list of all items in the submenu.
	// If the path is to a specific menu item, it just returns that item.

	let ret = menu.items;

	for (let s of menupath) {

		s = stringify(s).toLowerCase();

		ret = ret.find(o => o.label.toLowerCase() === s);

		if (ret === undefined) {
			throw new Error(`get_submenu_items(): invalid path: ${menupath}`);
		}

		if (ret.submenu) {
			ret = ret.submenu.items;
		}
	}

	return ret;
}

function set_checks(menupath) {

	if (!menu_is_set) {
		return;
	}

	let items = get_submenu_items(menupath.slice(0, -1));
	let desired = stringify(menupath[menupath.length - 1]).toLowerCase();
	for (let n = 0; n < items.length; n++) {
		if (items[n].checked !== undefined) {
			items[n].checked = items[n].label.toLowerCase() === desired;
		}
	}
}

function set_one_check(desired_state, menupath) {

	if (!menu_is_set) {
		return;
	}

	let item = get_submenu_items(menupath);

	if (item.checked !== undefined) {
		item.checked = desired_state ? true : false;
	}
}

function verify_menupath(menupath) {

	if (!menu_is_set) {					// Not possible given how this is used, I think.
		return;
	}

	try {
		get_submenu_items(menupath);
	} catch (err) {
		alert(win, `Failed to verify menupath: ${stringify(menupath)}`);
	}
}

const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const TaskStore = require("./tasks/taskStore");
const { registerSessionHandlers } = require("./sessions/sessionsStart");

const isDev = Boolean(process.env.ELECTRON_RENDERER_URL);
let taskStore;

function createWindow() {
	const mainWindow = new BrowserWindow({
		width: 1280,
		height: 720,
		minWidth: 1024,
		minHeight: 640,
		show: false,
		backgroundColor: "#0f172a",
		title: "Focus Modes Dashboard",
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			nodeIntegration: false,
			contextIsolation: true,
		},
	});

	mainWindow.once("ready-to-show", () => {
		mainWindow.show();
		if (isDev) {
			mainWindow.webContents.openDevTools({ mode: "detach" });
		}
	});

	if (isDev && process.env.ELECTRON_RENDERER_URL) {
		mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
	} else {
		mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
	}

	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: "deny" };
	});
}

app.whenReady().then(async () => {
	const dataDir = path.join(app.getPath("userData"), "dashboard-data");
	taskStore = new TaskStore({
		dataDir,
		seedTasksFile: path.join(__dirname, "tasks.json"),
		seedFinishedFile: path.join(__dirname, "finished-tasks.json"),
	});

	await taskStore.init();

	registerSessionHandlers(ipcMain);

	ipcMain.handle("open-link", async (_event, url) => {
		if (typeof url === "string" && url.startsWith("http")) {
			await shell.openExternal(url);
		}
	});

	ipcMain.handle("tasks:list", async () => taskStore.listTasks());

	ipcMain.handle("tasks:add", async (_event, payload) => {
		const task = await taskStore.addTask(payload ?? {});
		const tasks = await taskStore.listTasks();
		return { task, tasks };
	});

	ipcMain.handle("tasks:update-status", async (_event, payload) => {
		const updated = await taskStore.updateTaskStatus(
			payload?.id,
			payload?.status
		);
		const tasks = await taskStore.listTasks();
		return { task: updated, tasks };
	});

	ipcMain.handle("tasks:complete", async (_event, payload) => {
		const result = await taskStore.completeTask(payload?.id);
		return result;
	});

	ipcMain.handle("finished:list", async () => taskStore.listFinishedTasks());

	ipcMain.handle("finished:clear", async () =>
		taskStore.clearFinishedTasks()
	);

	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

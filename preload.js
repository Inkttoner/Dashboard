const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("dashboard", {
	openLink: (url) => ipcRenderer.invoke("open-link", url),
	tasks: {
		list: () => ipcRenderer.invoke("tasks:list"),
		add: (task) => ipcRenderer.invoke("tasks:add", task),
		updateStatus: (id, status) =>
			ipcRenderer.invoke("tasks:update-status", { id, status }),
		complete: (id) => ipcRenderer.invoke("tasks:complete", { id }),
		listFinished: () => ipcRenderer.invoke("finished:list"),
		clearFinished: () => ipcRenderer.invoke("finished:clear"),
	},
	sessions: {
		getConfig: () => ipcRenderer.invoke("session:get-config"),
		startStudy: (payload) =>
			ipcRenderer.invoke("session:start-study", payload),
		startGaming: (payload) =>
			ipcRenderer.invoke("session:start-gaming", payload),
		startCoding: (payload) =>
			ipcRenderer.invoke("session:start-coding", payload),
	},
});

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("gifStudio", {
	pickOutput: () => ipcRenderer.invoke("pick-output"),
	convertVideo: (payload) => ipcRenderer.invoke("convert-video", payload),
	convertVideos: (payload) => ipcRenderer.invoke("convert-videos", payload)
});

const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("gifStudio", {});

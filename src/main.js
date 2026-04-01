const path = require("node:path");
const fs = require("node:fs");
const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegPath);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 980,
    height: 740,
    minWidth: 880,
    minHeight: 620,
    backgroundColor: "#f4f0e7",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
}

app.whenReady().then(() => {
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

ipcMain.handle("pick-output", async () => {
  const result = await dialog.showOpenDialog({
    title: "Selecione a pasta de destino",
    properties: ["openDirectory", "createDirectory"]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle("convert-video", async (_event, payload) => {
  const {
    inputPath,
    outputDir,
    fps = 12,
    width = 640,
    maxDuration = 10,
    keepOriginal = true
  } = payload;

  if (!inputPath || !outputDir) {
    throw new Error("Arquivo de entrada e pasta de destino sao obrigatorios.");
  }

  if (!fs.existsSync(inputPath)) {
    throw new Error("Arquivo de video nao encontrado.");
  }

  if (!fs.existsSync(outputDir)) {
    throw new Error("Pasta de destino nao encontrada.");
  }

  const ext = path.extname(inputPath).toLowerCase();
  if (ext !== ".mp4") {
    throw new Error("Somente arquivos .mp4 sao suportados neste momento.");
  }

  const baseName = path.basename(inputPath, ext);
  const outputPath = path.join(outputDir, `${baseName}.gif`);

  const safeFps = Number.isFinite(Number(fps)) ? Number(fps) : 12;
  const safeWidth = Number.isFinite(Number(width)) ? Number(width) : 640;
  const safeDuration = Number.isFinite(Number(maxDuration)) ? Number(maxDuration) : 10;

  const filterGraph = [
    `[0:v]fps=${safeFps},scale=${safeWidth}:-1:flags=lanczos,split[a][b]`,
    `[a]palettegen=stats_mode=full[p]`,
    `[b][p]paletteuse=dither=sierra2_4a`
  ];

  await new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions(["-t", `${safeDuration}`])
      .complexFilter(filterGraph)
      .on("end", resolve)
      .on("error", reject)
      .save(outputPath);
  });

  if (!keepOriginal) {
    fs.unlinkSync(inputPath);
  }

  return {
    outputPath,
    removedOriginal: !keepOriginal
  };
});

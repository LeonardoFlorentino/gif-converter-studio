const path = require("node:path");
const fs = require("node:fs");
const { execFile } = require("node:child_process");
const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Runs ffmpeg cropdetect and returns the most stable "W:H:X:Y" string,
 * or null when no significant black border is found.
 */
async function detectCrop(inputPath) {
  return new Promise((resolve) => {
    execFile(
      ffmpegPath,
      [
        "-i",
        inputPath,
        "-vf",
        "cropdetect=limit=24:round=2:reset=0",
        "-f",
        "null",
        "-",
      ],
      { timeout: 30_000 },
      (_err, _stdout, stderr) => {
        const matches = [...stderr.matchAll(/crop=(\d+):(\d+):(\d+):(\d+)/g)];
        if (matches.length === 0) {
          resolve(null);
          return;
        }
        // Tally occurrences and pick the most frequent crop value (most stable)
        const tally = {};
        for (const m of matches) {
          const key = `${m[1]}:${m[2]}:${m[3]}:${m[4]}`;
          tally[key] = (tally[key] ?? 0) + 1;
        }
        const best = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
        resolve(best);
      },
    );
  });
}

const QUALITY_PRESETS = {
  high: { maxColors: 256, dither: "sierra2_4a", scaleWidth: "iw" },
  medium: { maxColors: 128, dither: "floyd_steinberg", scaleWidth: null },
  low: { maxColors: 64, dither: "bayer:bayer_scale=3", scaleWidth: null },
};

async function convertOneVideo(inputPath, outputDir, options = {}) {
  const {
    fps = 12,
    width = 640,
    maxDuration = 30,
    keepOriginal = true,
    quality = "high",
  } = options;

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
  const safeDuration = Number.isFinite(Number(maxDuration))
    ? Number(maxDuration)
    : 10;

  const { maxColors, dither, scaleWidth } =
    QUALITY_PRESETS[quality] ?? QUALITY_PRESETS.high;

  // scaleWidth "iw" = keep original video resolution; null = use user-provided width
  const scaleTarget = scaleWidth ?? safeWidth;

  // Detect and remove black borders (pillarbox / letterbox)
  const crop = await detectCrop(inputPath);
  const cropStep = crop ? `crop=${crop},` : "";

  const filterGraph = [
    `[0:v]fps=${safeFps},${cropStep}scale=${scaleTarget}:-1:flags=lanczos,split[a][b]`,
    `[a]palettegen=stats_mode=full:max_colors=${maxColors}[p]`,
    `[b][p]paletteuse=dither=${dither}`,
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
    inputPath,
    outputPath,
    removedOriginal: !keepOriginal,
  };
}

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
      nodeIntegration: false,
    },
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
    properties: ["openDirectory", "createDirectory"],
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
    fps,
    width,
    maxDuration,
    keepOriginal,
    quality,
  } = payload;
  return convertOneVideo(inputPath, outputDir, {
    fps,
    width,
    maxDuration,
    keepOriginal,
    quality,
  });
});

ipcMain.handle("convert-videos", async (_event, payload) => {
  const {
    inputPaths,
    outputDir,
    fps = 12,
    width = 640,
    maxDuration = 10,
    keepOriginal = true,
    quality = "high",
  } = payload;

  if (!Array.isArray(inputPaths) || inputPaths.length === 0) {
    throw new Error("Selecione ao menos um video .mp4 para conversao em lote.");
  }

  const results = [];
  for (const inputPath of inputPaths) {
    const result = await convertOneVideo(inputPath, outputDir, {
      fps,
      width,
      maxDuration,
      keepOriginal,
      quality,
    });
    results.push(result);
  }

  return {
    count: results.length,
    results,
  };
});

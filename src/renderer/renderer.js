const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const selectedFileLabel = document.getElementById("selected-file");
const outputDirInput = document.getElementById("output-dir");
const chooseOutputButton = document.getElementById("choose-output");
const convertButton = document.getElementById("convert");
const themeToggleButton = document.getElementById("theme-toggle");
const presetInput = document.getElementById("preset");
const fpsInput = document.getElementById("fps");
const widthInput = document.getElementById("width");
const durationInput = document.getElementById("duration");
const keepOriginalInput = document.getElementById("keep-original");
const qualityInput = document.getElementById("quality");
const statusEl = document.getElementById("status");

const THEME_STORAGE_KEY = "gif-studio-theme";
let selectedPaths = [];

function getPreferredTheme() {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggleButton.textContent =
    theme === "dark" ? "Modo claro" : "Modo escuro";
  themeToggleButton.setAttribute("aria-pressed", String(theme === "dark"));
}

function toggleTheme() {
  const nextTheme =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  applyTheme(nextTheme);
}

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

function setSelectedFiles(filePaths) {
  selectedPaths = filePaths;

  if (!filePaths || filePaths.length === 0) {
    selectedFileLabel.textContent = "Nenhum arquivo selecionado";
    return;
  }

  const preview = filePaths.slice(0, 3).join(" | ");
  const remaining =
    filePaths.length > 3 ? ` +${filePaths.length - 3} arquivo(s)` : "";
  selectedFileLabel.textContent = `${filePaths.length} arquivo(s): ${preview}${remaining}`;
}

function pickFromInput() {
  if (fileInput.files.length === 0) {
    return;
  }

  const paths = Array.from(fileInput.files)
    .map((file) => file.path)
    .filter((filePath) => filePath.toLowerCase().endsWith(".mp4"));

  setSelectedFiles(paths);
  setStatus("Video carregado. Escolha o destino e converta.", "idle");
}

function applyPreset() {
  if (presetInput.value === "github-readme") {
    fpsInput.value = "10";
    widthInput.value = "480";
    durationInput.value = "8";
    qualityInput.value = "medium";
    setStatus("Preset README GitHub aplicado.", "idle");
  }
}

function setDragState(isDragging) {
  if (isDragging) {
    dropZone.classList.add("dragging");
  } else {
    dropZone.classList.remove("dragging");
  }
}

function syncWidthField() {
  const isOriginal = qualityInput.value === "high";
  widthInput.disabled = isOriginal;
  widthInput.placeholder = isOriginal ? "Original" : "640";
}

applyTheme(getPreferredTheme());
syncWidthField();

dropZone.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", pickFromInput);
themeToggleButton.addEventListener("click", toggleTheme);
qualityInput.addEventListener("change", syncWidthField);

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  setDragState(true);
});

dropZone.addEventListener("dragleave", (event) => {
  event.preventDefault();
  setDragState(false);
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  setDragState(false);

  const files = event.dataTransfer?.files;
  if (!files || files.length === 0) {
    return;
  }

  const paths = Array.from(files)
    .map((file) => file.path)
    .filter((filePath) => filePath.toLowerCase().endsWith(".mp4"));

  if (paths.length === 0) {
    setStatus("Arraste apenas arquivos .mp4", "error");
    return;
  }

  setSelectedFiles(paths);
  setStatus("Video carregado. Escolha o destino e converta.", "idle");
});

presetInput.addEventListener("change", applyPreset);

chooseOutputButton.addEventListener("click", async () => {
  const chosen = await window.gifStudio.pickOutput?.();
  if (chosen) {
    outputDirInput.value = chosen;
  } else {
    setStatus("Selecione uma pasta de destino.", "idle");
  }
});

convertButton.addEventListener("click", async () => {
  if (!selectedPaths.length) {
    setStatus("Selecione ao menos um arquivo MP4 primeiro.", "error");
    return;
  }

  if (!outputDirInput.value.trim()) {
    setStatus("Selecione uma pasta de destino.", "error");
    return;
  }

  try {
    convertButton.disabled = true;
    setStatus("Convertendo... isso pode levar alguns segundos.", "working");

    if (selectedPaths.length > 1) {
      const batchResult = await window.gifStudio.convertVideos({
        inputPaths: selectedPaths,
        outputDir: outputDirInput.value.trim(),
        fps: Number(fpsInput.value),
        width: Number(widthInput.value),
        maxDuration: Number(durationInput.value),
        keepOriginal: keepOriginalInput.checked,
        quality: qualityInput.value,
      });

      setStatus(
        `Conversao concluida: ${batchResult.count} GIF(s) gerados.`,
        "success",
      );
    } else {
      const result = await window.gifStudio.convertVideo({
        inputPath: selectedPaths[0],
        outputDir: outputDirInput.value.trim(),
        fps: Number(fpsInput.value),
        width: Number(widthInput.value),
        maxDuration: Number(durationInput.value),
        keepOriginal: keepOriginalInput.checked,
        quality: qualityInput.value,
      });

      const removed = result.removedOriginal ? " MP4 removido." : "";
      setStatus(`GIF criado em: ${result.outputPath}.${removed}`, "success");
    }
  } catch (error) {
    setStatus(`Erro: ${error.message || "Falha na conversao."}`, "error");
  } finally {
    convertButton.disabled = false;
  }
});

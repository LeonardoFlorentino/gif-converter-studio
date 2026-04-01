const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const selectedFileLabel = document.getElementById("selected-file");
const outputDirInput = document.getElementById("output-dir");
const chooseOutputButton = document.getElementById("choose-output");
const convertButton = document.getElementById("convert");
const statusEl = document.getElementById("status");

let selectedPath = "";

function setStatus(message, type) {
	statusEl.textContent = message;
	statusEl.className = `status ${type}`;
}

function setSelectedFile(filePath) {
	selectedPath = filePath;
	selectedFileLabel.textContent = filePath || "Nenhum arquivo selecionado";
}

function pickFromInput() {
	if (fileInput.files.length === 0) {
		return;
	}

	const file = fileInput.files[0];
	setSelectedFile(file.path);
	setStatus("Video carregado. Escolha o destino e converta.", "idle");
}

function setDragState(isDragging) {
	if (isDragging) {
		dropZone.classList.add("dragging");
	} else {
		dropZone.classList.remove("dragging");
	}
}

dropZone.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", pickFromInput);

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

	const file = files[0];
	if (!file.path.toLowerCase().endsWith(".mp4")) {
		setStatus("Arraste apenas arquivos .mp4", "error");
		return;
	}

	setSelectedFile(file.path);
	setStatus("Video carregado. Escolha o destino e converta.", "idle");
});

chooseOutputButton.addEventListener("click", async () => {
	const chosen = await window.gifStudio.pickOutput?.();
	if (chosen) {
		outputDirInput.value = chosen;
	} else {
		setStatus("Selecione uma pasta de destino.", "idle");
	}
});

convertButton.addEventListener("click", () => {
	if (!selectedPath) {
		setStatus("Selecione um arquivo MP4 primeiro.", "error");
		return;
	}

	if (!outputDirInput.value.trim()) {
		setStatus("Selecione uma pasta de destino.", "error");
		return;
	}

	setStatus("UI pronta. A conversao entra no proximo commit.", "working");
});

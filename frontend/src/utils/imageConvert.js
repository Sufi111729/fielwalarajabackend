function yieldToUI() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas, mimeType, quality = 0.95) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Conversion failed"));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

export async function convertImageFile(file, targetMime, quality = 0.95) {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (targetMime === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0, img.width, img.height);
  await yieldToUI();

  return canvasToBlob(canvas, targetMime, quality);
}

export async function convertImagesToSinglePdf(files, onProgress) {
  const [{ jsPDF }] = await Promise.all([
    import("jspdf"),
    yieldToUI()
  ]);

  const loadedImages = [];
  for (let i = 0; i < files.length; i += 1) {
    const img = await loadImage(files[i]);
    loadedImages.push({ img, name: files[i].name });
    if (onProgress) onProgress(Math.round(((i + 1) / files.length) * 40));
    await yieldToUI();
  }

  const first = loadedImages[0].img;
  const orientation = first.width >= first.height ? "landscape" : "portrait";
  const pdf = new jsPDF({
    orientation,
    unit: "px",
    format: [Math.max(first.width, 1), Math.max(first.height, 1)],
    compress: true
  });

  for (let i = 0; i < loadedImages.length; i += 1) {
    const { img } = loadedImages[i];
    if (i > 0) {
      pdf.addPage([Math.max(img.width, 1), Math.max(img.height, 1)], img.width >= img.height ? "landscape" : "portrait");
    }

    const ratio = Math.min(
      pdf.internal.pageSize.getWidth() / img.width,
      pdf.internal.pageSize.getHeight() / img.height
    );
    const renderW = img.width * ratio;
    const renderH = img.height * ratio;
    const x = (pdf.internal.pageSize.getWidth() - renderW) / 2;
    const y = (pdf.internal.pageSize.getHeight() - renderH) / 2;

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = img.width;
    pageCanvas.height = img.height;
    const pageCtx = pageCanvas.getContext("2d");
    pageCtx.drawImage(img, 0, 0);
    const pageDataUrl = pageCanvas.toDataURL("image/jpeg", 0.98);

    pdf.addImage(pageDataUrl, "JPEG", x, y, renderW, renderH, undefined, "FAST");
    if (onProgress) onProgress(40 + Math.round(((i + 1) / loadedImages.length) * 60));
    await yieldToUI();
  }

  return pdf.output("blob");
}

export function getOutputName(inputName, ext) {
  const dot = inputName.lastIndexOf(".");
  const base = dot > 0 ? inputName.slice(0, dot) : inputName;
  return `${base}.${ext}`;
}


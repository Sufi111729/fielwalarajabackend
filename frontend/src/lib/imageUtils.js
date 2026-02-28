export const PRESETS = {
  photo: {
    id: "photo",
    label: "PAN Photo",
    widthCm: 2.5,
    heightCm: 3.5,
    dpi: 300,
    maxKb: 50
  },
  signature: {
    id: "signature",
    label: "PAN Signature",
    widthCm: 4.5,
    heightCm: 2.0,
    dpi: 300,
    maxKb: 50
  }
};
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

export function cmToPx(cm, dpi = 200) {
  return Math.round((cm / 2.54) * dpi);
}

export function getPresetTargetPx(preset) {
  return {
    width: cmToPx(preset.widthCm, preset.dpi),
    height: cmToPx(preset.heightCm, preset.dpi)
  };
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

function canvasToJpegBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("JPEG conversion failed"))),
      "image/jpeg",
      quality
    );
  });
}

function drawHighQualityResize(sourceCanvas, targetWidth, targetHeight) {
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = targetWidth;
  finalCanvas.height = targetHeight;

  const finalCtx = finalCanvas.getContext("2d");
  finalCtx.imageSmoothingEnabled = true;
  finalCtx.imageSmoothingQuality = "high";

  let currentCanvas = sourceCanvas;
  let currentWidth = sourceCanvas.width;
  let currentHeight = sourceCanvas.height;

  // Multi-step downscale for better visual quality on large source images.
  while (currentWidth / 2 > targetWidth && currentHeight / 2 > targetHeight) {
    const tempCanvas = document.createElement("canvas");
    const nextWidth = Math.max(targetWidth, Math.floor(currentWidth / 2));
    const nextHeight = Math.max(targetHeight, Math.floor(currentHeight / 2));
    tempCanvas.width = nextWidth;
    tempCanvas.height = nextHeight;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = "high";
    tempCtx.drawImage(currentCanvas, 0, 0, currentWidth, currentHeight, 0, 0, nextWidth, nextHeight);
    currentCanvas = tempCanvas;
    currentWidth = nextWidth;
    currentHeight = nextHeight;
  }

  finalCtx.drawImage(currentCanvas, 0, 0, currentWidth, currentHeight, 0, 0, targetWidth, targetHeight);
  return finalCanvas;
}

function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG conversion failed"))), "image/png");
  });
}

function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load processed image"));
    };
    img.src = url;
  });
}

async function removeBackgroundViaBackend(canvas) {
  const inputBlob = await canvasToPngBlob(canvas);
  const form = new FormData();
  form.append("file", new File([inputBlob], "pan-photo.png", { type: "image/png" }));

  const res = await fetch(`${API_BASE}/api/remove-bg-white`, {
    method: "POST",
    body: form
  });
  if (!res.ok) {
    throw new Error("Background removal failed on server.");
  }

  const processedBlob = await res.blob();
  const processedImage = await loadImageFromBlob(processedBlob);
  const out = document.createElement("canvas");
  out.width = processedImage.width;
  out.height = processedImage.height;
  const ctx = out.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(processedImage, 0, 0);
  return out;
}

function enhanceCanvasForClarity(canvas, preset) {
  // Subtle enhancement for tiny PAN outputs to preserve perceived facial detail.
  if (preset.id !== "photo") return canvas;
  const enhanced = document.createElement("canvas");
  enhanced.width = canvas.width;
  enhanced.height = canvas.height;
  const ctx = enhanced.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.filter = "contrast(1.06) saturate(1.04)";
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = "none";
  return enhanced;
}

function scaleCanvas(sourceCanvas, ratio) {
  const next = document.createElement("canvas");
  next.width = Math.max(1, Math.round(sourceCanvas.width * ratio));
  next.height = Math.max(1, Math.round(sourceCanvas.height * ratio));
  const ctx = next.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 0, 0, next.width, next.height);
  return next;
}

export async function buildResizedCanvas({ file, cropPixels, preset, onProgress }) {
  const start = performance.now();
  const image = await loadImageFromFile(file);
  if (onProgress) onProgress(20);

  const target = getPresetTargetPx(preset);
  const sx = Math.max(0, Math.round(cropPixels?.x ?? 0));
  const sy = Math.max(0, Math.round(cropPixels?.y ?? 0));
  const sWidth = Math.max(1, Math.round(cropPixels?.width ?? image.width));
  const sHeight = Math.max(1, Math.round(cropPixels?.height ?? image.height));

  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = sWidth;
  cropCanvas.height = sHeight;
  const cropCtx = cropCanvas.getContext("2d");
  cropCtx.imageSmoothingEnabled = true;
  cropCtx.imageSmoothingQuality = "high";
  cropCtx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

  if (onProgress) onProgress(60);

  const resizedCanvas = drawHighQualityResize(cropCanvas, target.width, target.height);
  const canvas = enhanceCanvasForClarity(resizedCanvas, preset);
  const canvasCtx = canvas.getContext("2d");
  canvasCtx.globalCompositeOperation = "destination-over";
  canvasCtx.fillStyle = "#ffffff";
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

  if (onProgress) onProgress(100);

  return {
    canvas,
    width: target.width,
    height: target.height,
    elapsedMs: Math.round(performance.now() - start)
  };
}

export async function compressQualityBinarySearch(
  canvas,
  maxBytes,
  onProgress,
  options = {}
) {
  const minQuality = options.minQuality ?? 0.42;
  const maxQuality = options.maxQuality ?? 0.98;
  const maxIter = options.maxIter ?? 12;
  let low = minQuality;
  let high = maxQuality;
  let bestBlob = null;
  let bestQuality = maxQuality;

  const highBlob = await canvasToJpegBlob(canvas, maxQuality);
  if (highBlob.size <= maxBytes) {
    return {
      blob: highBlob,
      quality: Number(maxQuality.toFixed(3)),
      withinLimit: true
    };
  }

  for (let i = 0; i < maxIter; i += 1) {
    const quality = (low + high) / 2;
    const blob = await canvasToJpegBlob(canvas, quality);

    if (onProgress) {
      onProgress(i + 1, maxIter);
    }

    if (blob.size <= maxBytes) {
      bestBlob = blob;
      bestQuality = quality;
      low = quality;
    } else {
      high = quality;
    }
  }

  if (!bestBlob) {
    // If we cannot satisfy max size within quality floor, keep minimum acceptable quality.
    bestBlob = await canvasToJpegBlob(canvas, minQuality);
    bestQuality = minQuality;
    return {
      blob: bestBlob,
      quality: Number(bestQuality.toFixed(3)),
      withinLimit: false
    };
  }

  return {
    blob: bestBlob,
    quality: Number(bestQuality.toFixed(3)),
    withinLimit: true
  };
}

export async function resizeAndCompressImage({
  file,
  cropPixels,
  preset,
  onProgress,
  autoWhiteBackground = true
}) {
  const start = performance.now();
  const image = await loadImageFromFile(file);
  if (onProgress) onProgress(15);

  const target = getPresetTargetPx(preset);

  const sx = Math.max(0, Math.round(cropPixels?.x ?? 0));
  const sy = Math.max(0, Math.round(cropPixels?.y ?? 0));
  const sWidth = Math.max(1, Math.round(cropPixels?.width ?? image.width));
  const sHeight = Math.max(1, Math.round(cropPixels?.height ?? image.height));

  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = sWidth;
  cropCanvas.height = sHeight;
  const cropCtx = cropCanvas.getContext("2d");
  cropCtx.imageSmoothingEnabled = true;
  cropCtx.imageSmoothingQuality = "high";
  cropCtx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

  const resizedCanvas = drawHighQualityResize(cropCanvas, target.width, target.height);
  const preparedCanvas =
    preset.id === "photo" && autoWhiteBackground
      ? resizedCanvas
      : resizedCanvas;
  if (preset.id === "photo" && autoWhiteBackground) {
    try {
      const bgRemoved = await removeBackgroundViaBackend(preparedCanvas);
      preparedCanvas.width = bgRemoved.width;
      preparedCanvas.height = bgRemoved.height;
      const replaceCtx = preparedCanvas.getContext("2d");
      replaceCtx.drawImage(bgRemoved, 0, 0);
    } catch (e) {
      console.log("bg_remove_warning", e.message || "Background removal failed");
    }
  }
  const canvas = enhanceCanvasForClarity(preparedCanvas, preset);
  const canvasCtx = canvas.getContext("2d");
  canvasCtx.globalCompositeOperation = "destination-over";
  canvasCtx.fillStyle = "#ffffff";
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

  if (onProgress) onProgress(35);

  const maxBytes = preset.maxKb * 1024;
  const minQuality = preset.id === "photo" ? 0.40 : 0.45;
  let activeCanvas = canvas;
  let compressed = await compressQualityBinarySearch(
    canvas,
    maxBytes,
    (step, total) => {
      const progress = 35 + Math.round((step / total) * 60);
      if (onProgress) onProgress(progress);
    },
    { minQuality, maxQuality: 0.98, maxIter: 12 }
  );

  // If strict 50KB cannot be achieved at minimum quality, reduce dimensions slightly
  // and retry with max possible quality under the size cap.
  if (!compressed.withinLimit) {
    for (let i = 0; i < 8; i += 1) {
      activeCanvas = scaleCanvas(activeCanvas, 0.96);
      compressed = await compressQualityBinarySearch(
        activeCanvas,
        maxBytes,
        () => {},
        { minQuality, maxQuality: 0.98, maxIter: 10 }
      );
      if (compressed.withinLimit) break;
    }
  }
  if (onProgress) onProgress(100);

  return {
    blob: compressed.blob,
    previewUrl: URL.createObjectURL(compressed.blob),
    width: activeCanvas.width,
    height: activeCanvas.height,
    kb: Number((compressed.blob.size / 1024).toFixed(2)),
    quality: compressed.quality,
    withinLimit: compressed.withinLimit,
    elapsedMs: Math.round(performance.now() - start)
  };
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

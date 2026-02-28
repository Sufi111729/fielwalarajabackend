export function canvasToJpegBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    if (!canvas) {
      reject(new Error("Canvas is missing"));
      return;
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("JPEG conversion failed"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality
    );
  });
}

function createScaledCanvas(sourceCanvas, scale) {
  const w = Math.max(1, Math.round(sourceCanvas.width * scale));
  const h = Math.max(1, Math.round(sourceCanvas.height * scale));
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 0, 0, w, h);
  return out;
}

async function findBestQualityForCanvas(canvas, targetBytes, minQ, maxQ, maxIter) {
  const highBlob = await canvasToJpegBlob(canvas, maxQ);
  if (highBlob.size <= targetBytes) {
    return { blob: highBlob, quality: maxQ, hit: true };
  }

  const lowBlob = await canvasToJpegBlob(canvas, minQ);
  if (lowBlob.size > targetBytes) {
    return { blob: lowBlob, quality: minQ, hit: false };
  }

  let low = minQ;
  let high = maxQ;
  let bestBlob = lowBlob;
  let bestQuality = minQ;

  for (let i = 0; i < maxIter; i += 1) {
    const mid = (low + high) / 2;
    const blob = await canvasToJpegBlob(canvas, mid);
    if (blob.size <= targetBytes) {
      bestBlob = blob;
      bestQuality = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  return { blob: bestBlob, quality: bestQuality, hit: true };
}

export async function smartCompressToKB(
  canvas,
  targetKB,
  { minQ = 0.45, maxQ = 0.95, maxIter = 8, mode = "best" } = {}
) {
  const start = performance.now();
  const targetBytes = Math.max(1, Math.round(targetKB * 1024));
  const effectiveTargetBytes = mode === "safer" ? Math.floor(targetBytes * 0.94) : targetBytes;
  const cappedMaxQ = mode === "safer" ? Math.min(maxQ, 0.9) : maxQ;
  const floorQ = Math.min(minQ, cappedMaxQ);
  const minScale = mode === "safer" ? 0.05 : 0.35;
  const scaleIter = mode === "safer" ? 10 : 6;

  const base = await findBestQualityForCanvas(canvas, effectiveTargetBytes, floorQ, cappedMaxQ, maxIter);
  if (base.hit) {
    return {
      blob: base.blob,
      quality: Number(base.quality.toFixed(3)),
      ms: Math.round(performance.now() - start),
      finalKB: Number((base.blob.size / 1024).toFixed(2)),
      hit: base.blob.size <= targetBytes
    };
  }

  // Aggressive fallback for very small targets (e.g. 10KB): find largest scale that can fit.
  const minScaleCanvas = createScaledCanvas(canvas, minScale);
  const minScaleFit = await findBestQualityForCanvas(
    minScaleCanvas,
    effectiveTargetBytes,
    floorQ,
    cappedMaxQ,
    maxIter
  );
  if (!minScaleFit.hit) {
    return {
      blob: minScaleFit.blob,
      quality: Number(minScaleFit.quality.toFixed(3)),
      ms: Math.round(performance.now() - start),
      finalKB: Number((minScaleFit.blob.size / 1024).toFixed(2)),
      hit: minScaleFit.blob.size <= targetBytes
    };
  }

  let lowScale = minScale;
  let highScale = 1;
  let bestFitCanvas = minScaleCanvas;

  for (let i = 0; i < scaleIter; i += 1) {
    const midScale = (lowScale + highScale) / 2;
    const midCanvas = createScaledCanvas(canvas, midScale);
    const midLowBlob = await canvasToJpegBlob(midCanvas, floorQ);
    if (midLowBlob.size <= effectiveTargetBytes) {
      bestFitCanvas = midCanvas;
      lowScale = midScale;
    } else {
      highScale = midScale;
    }
  }

  const scaled = await findBestQualityForCanvas(
    bestFitCanvas,
    effectiveTargetBytes,
    floorQ,
    cappedMaxQ,
    maxIter
  );

  return {
    blob: scaled.blob,
    quality: Number(scaled.quality.toFixed(3)),
    ms: Math.round(performance.now() - start),
    finalKB: Number((scaled.blob.size / 1024).toFixed(2)),
    hit: scaled.blob.size <= targetBytes
  };
}

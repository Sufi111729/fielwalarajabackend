package com.sufi.demo.service;

import java.awt.Dimension;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import javax.imageio.ImageIO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ImageValidationService {

  @Value("${app.validation.max-kb:50}")
  private int maxKb;

  @Value("${app.features.enhance-enabled:false}")
  private boolean enhanceEnabled;

  private static final Map<String, Dimension> PRESET_DIMENSIONS = Map.of(
      "photo", new Dimension(197, 276),
      "signature", new Dimension(354, 157));

  public ValidationResult validate(MultipartFile file, String presetId, Integer expectedWidth,
      Integer expectedHeight) {
    List<ValidationError> errors = new ArrayList<>();
    Meta meta = new Meta();

    if (file == null || file.isEmpty()) {
      errors.add(new ValidationError("EMPTY_FILE", "File is required."));
      return new ValidationResult(false, errors, meta);
    }

    byte[] bytes;
    try {
      bytes = file.getBytes();
    } catch (Exception e) {
      errors.add(new ValidationError("READ_ERROR", "Unable to read uploaded file."));
      return new ValidationResult(false, errors, meta);
    }

    meta.kb = roundKb(bytes.length);

    if (!isJpegMagic(bytes)) {
      errors.add(new ValidationError("INVALID_FORMAT", "Final output must be JPEG/JPG."));
      return new ValidationResult(false, errors, meta);
    }

    long maxBytes = (long) maxKb * 1024;
    if (bytes.length > maxBytes) {
      errors.add(new ValidationError("FILE_TOO_LARGE", "File size exceeds " + maxKb + "KB."));
    }

    BufferedImage image;
    try {
      image = ImageIO.read(new ByteArrayInputStream(bytes));
    } catch (Exception e) {
      image = null;
    }

    if (image == null) {
      errors.add(new ValidationError("INVALID_IMAGE", "Cannot decode image."));
      return new ValidationResult(false, errors, meta);
    }

    meta.width = image.getWidth();
    meta.height = image.getHeight();

    Dimension expected = resolveExpected(presetId, expectedWidth, expectedHeight);
    if (expected == null) {
      errors.add(new ValidationError("MISSING_DIMENSIONS",
          "Provide valid presetId or expectedWidth/expectedHeight."));
    } else if (meta.width != expected.width || meta.height != expected.height) {
      errors.add(new ValidationError("DIMENSION_MISMATCH",
          "Expected " + expected.width + "x" + expected.height + " px."));
    }

    return new ValidationResult(errors.isEmpty(), errors, meta);
  }

  public byte[] enhance(MultipartFile file) throws Exception {
    if (!enhanceEnabled) {
      throw new IllegalStateException("Enhancement is disabled.");
    }

    BufferedImage input = ImageIO.read(file.getInputStream());
    if (input == null) {
      throw new IllegalArgumentException("Invalid image.");
    }

    BufferedImage out =
        new BufferedImage(input.getWidth(), input.getHeight(), BufferedImage.TYPE_INT_RGB);
    Graphics2D g2d = out.createGraphics();
    g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION,
        RenderingHints.VALUE_INTERPOLATION_BILINEAR);
    g2d.drawImage(input, 0, 0, null);
    g2d.dispose();

    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    ImageIO.write(out, "jpg", baos);
    return baos.toByteArray();
  }

  public byte[] removeBackgroundToWhite(MultipartFile file) throws Exception {
    BufferedImage input = ImageIO.read(file.getInputStream());
    if (input == null) {
      throw new IllegalArgumentException("Invalid image.");
    }

    int width = input.getWidth();
    int height = input.getHeight();
    if (width < 8 || height < 8) {
      throw new IllegalArgumentException("Image too small.");
    }

    int[] bgAvg = estimateBorderAverage(input);
    boolean[] bgMask = buildFloodBackgroundMask(input, bgAvg);
    boolean[] fgMask = invertMask(bgMask);
    boolean[] mainFg = extractMainForegroundComponent(fgMask, width, height);
    boolean[] smoothFg = smoothMask(mainFg, width, height);

    BufferedImage out = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
    for (int y = 0; y < height; y += 1) {
      for (int x = 0; x < width; x += 1) {
        int idx = y * width + x;
        if (smoothFg[idx]) {
          out.setRGB(x, y, input.getRGB(x, y) & 0x00FFFFFF);
        } else {
          out.setRGB(x, y, 0xFFFFFF);
        }
      }
    }

    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    ImageIO.write(out, "jpg", baos);
    return baos.toByteArray();
  }

  private static int[] estimateBorderAverage(BufferedImage image) {
    int width = image.getWidth();
    int height = image.getHeight();
    int border = Math.max(2, Math.min(width, height) / 20);

    long sumR = 0;
    long sumG = 0;
    long sumB = 0;
    long count = 0;

    for (int y = 0; y < height; y += 1) {
      for (int x = 0; x < width; x += 1) {
        boolean onBorder = x < border || y < border || x >= width - border || y >= height - border;
        if (!onBorder) {
          continue;
        }
        int rgb = image.getRGB(x, y);
        int r = (rgb >> 16) & 0xFF;
        int g = (rgb >> 8) & 0xFF;
        int b = rgb & 0xFF;
        sumR += r;
        sumG += g;
        sumB += b;
        count += 1;
      }
    }

    if (count == 0) {
      return new int[] {255, 255, 255};
    }
    return new int[] {(int) (sumR / count), (int) (sumG / count), (int) (sumB / count)};
  }

  private static boolean[] buildFloodBackgroundMask(BufferedImage image, int[] bgAvg) {
    int width = image.getWidth();
    int height = image.getHeight();
    boolean[] visited = new boolean[width * height];
    ArrayDeque<Integer> queue = new ArrayDeque<>();

    for (int x = 0; x < width; x += 1) {
      tryPushBackground(image, x, 0, bgAvg, visited, queue);
      tryPushBackground(image, x, height - 1, bgAvg, visited, queue);
    }
    for (int y = 0; y < height; y += 1) {
      tryPushBackground(image, 0, y, bgAvg, visited, queue);
      tryPushBackground(image, width - 1, y, bgAvg, visited, queue);
    }

    while (!queue.isEmpty()) {
      int p = queue.removeFirst();
      int x = p % width;
      int y = p / width;

      if (x > 0) {
        tryPushBackground(image, x - 1, y, bgAvg, visited, queue);
      }
      if (x < width - 1) {
        tryPushBackground(image, x + 1, y, bgAvg, visited, queue);
      }
      if (y > 0) {
        tryPushBackground(image, x, y - 1, bgAvg, visited, queue);
      }
      if (y < height - 1) {
        tryPushBackground(image, x, y + 1, bgAvg, visited, queue);
      }
    }

    return visited;
  }

  private static void tryPushBackground(BufferedImage image, int x, int y, int[] bgAvg,
      boolean[] visited, ArrayDeque<Integer> queue) {
    int width = image.getWidth();
    int p = y * width + x;
    if (visited[p]) {
      return;
    }

    int rgb = image.getRGB(x, y);
    int r = (rgb >> 16) & 0xFF;
    int g = (rgb >> 8) & 0xFF;
    int b = rgb & 0xFF;

    int dr = r - bgAvg[0];
    int dg = g - bgAvg[1];
    int db = b - bgAvg[2];
    int dist2 = dr * dr + dg * dg + db * db;

    int max = Math.max(r, Math.max(g, b));
    int min = Math.min(r, Math.min(g, b));
    int saturation = max - min;

    boolean bgLike = dist2 < (55 * 55) || (dist2 < (78 * 78) && saturation < 30);
    if (!bgLike) {
      return;
    }

    visited[p] = true;
    queue.add(p);
  }

  private static boolean[] invertMask(boolean[] mask) {
    boolean[] out = new boolean[mask.length];
    for (int i = 0; i < mask.length; i += 1) {
      out[i] = !mask[i];
    }
    return out;
  }

  private static boolean[] extractMainForegroundComponent(boolean[] fgMask, int width, int height) {
    boolean[] seen = new boolean[fgMask.length];
    boolean[] best = new boolean[fgMask.length];
    int bestSize = 0;
    int cx = width / 2;
    int cy = height / 2;

    for (int i = 0; i < fgMask.length; i += 1) {
      if (!fgMask[i] || seen[i]) {
        continue;
      }

      ArrayDeque<Integer> queue = new ArrayDeque<>();
      List<Integer> pixels = new ArrayList<>();
      queue.add(i);
      seen[i] = true;
      boolean touchesCenter = false;

      while (!queue.isEmpty()) {
        int p = queue.removeFirst();
        pixels.add(p);
        int x = p % width;
        int y = p / width;

        if (Math.abs(x - cx) < width / 4 && Math.abs(y - cy) < height / 3) {
          touchesCenter = true;
        }

        if (x > 0) {
          int n = p - 1;
          if (fgMask[n] && !seen[n]) {
            seen[n] = true;
            queue.add(n);
          }
        }
        if (x < width - 1) {
          int n = p + 1;
          if (fgMask[n] && !seen[n]) {
            seen[n] = true;
            queue.add(n);
          }
        }
        if (y > 0) {
          int n = p - width;
          if (fgMask[n] && !seen[n]) {
            seen[n] = true;
            queue.add(n);
          }
        }
        if (y < height - 1) {
          int n = p + width;
          if (fgMask[n] && !seen[n]) {
            seen[n] = true;
            queue.add(n);
          }
        }
      }

      int size = pixels.size();
      if (touchesCenter && size > bestSize) {
        bestSize = size;
        best = new boolean[fgMask.length];
        for (int p : pixels) {
          best[p] = true;
        }
      }
    }

    if (bestSize > 0) {
      return best;
    }

    // Fallback: keep all foreground if no center component found.
    return fgMask;
  }

  private static boolean[] smoothMask(boolean[] mask, int width, int height) {
    // Dilate then erode (closing) to fill tiny holes.
    boolean[] dilated = new boolean[mask.length];
    for (int y = 0; y < height; y += 1) {
      for (int x = 0; x < width; x += 1) {
        int p = y * width + x;
        if (!mask[p]) {
          continue;
        }
        for (int dy = -1; dy <= 1; dy += 1) {
          for (int dx = -1; dx <= 1; dx += 1) {
            int nx = x + dx;
            int ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              dilated[ny * width + nx] = true;
            }
          }
        }
      }
    }

    boolean[] eroded = new boolean[mask.length];
    for (int y = 1; y < height - 1; y += 1) {
      for (int x = 1; x < width - 1; x += 1) {
        int p = y * width + x;
        boolean keep = true;
        for (int dy = -1; dy <= 1 && keep; dy += 1) {
          for (int dx = -1; dx <= 1; dx += 1) {
            int n = (y + dy) * width + (x + dx);
            if (!dilated[n]) {
              keep = false;
              break;
            }
          }
        }
        eroded[p] = keep;
      }
    }
    return eroded;
  }

  private static boolean isJpegMagic(byte[] bytes) {
    if (bytes == null || bytes.length < 4) {
      return false;
    }
    return (bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8
        && (bytes[bytes.length - 2] & 0xFF) == 0xFF && (bytes[bytes.length - 1] & 0xFF) == 0xD9;
  }

  private static Dimension resolveExpected(String presetId, Integer expectedWidth,
      Integer expectedHeight) {
    if (presetId != null && PRESET_DIMENSIONS.containsKey(presetId)) {
      return PRESET_DIMENSIONS.get(presetId);
    }
    if (expectedWidth != null && expectedHeight != null && expectedWidth > 0 && expectedHeight > 0) {
      return new Dimension(expectedWidth, expectedHeight);
    }
    return null;
  }

  private static double roundKb(long bytes) {
    return Math.round((bytes / 1024.0) * 100.0) / 100.0;
  }

  public static class ValidationResult {
    public boolean ok;
    public List<ValidationError> errors;
    public Meta meta;

    public ValidationResult(boolean ok, List<ValidationError> errors, Meta meta) {
      this.ok = ok;
      this.errors = errors;
      this.meta = meta;
    }
  }

  public static class ValidationError {
    public String code;
    public String message;

    public ValidationError(String code, String message) {
      this.code = code;
      this.message = message;
    }
  }

  public static class Meta {
    public int width;
    public int height;
    public double kb;
  }
}

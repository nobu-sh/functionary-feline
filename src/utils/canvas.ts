import type { CanvasRenderingContext2D } from "@napi-rs/canvas";
import { createCanvas } from "@napi-rs/canvas";

export function createProgressBar(progress: number) {
  const canvas = createCanvas(1024, 32);
  const ctx = canvas.getContext("2d");

  const barWidth = canvas.width - 86; // Leave space for text

  // Fill the background
  ctx.fillStyle = "#1a1a1e";
  drawRectangleWithBorderRadius(ctx, 0, 0, barWidth, canvas.height, 16);
  ctx.fill();

  // Status fill
  ctx.fillStyle = "#e594b7";
  drawRectangleWithBorderRadius(ctx, 0, 0, barWidth * progress, canvas.height, 16);
  ctx.fill();

  // Status text at end of bar
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 24px sans-serif";
  const statusText = `${Math.round(progress * 100)}%`;
  ctx.fillText(statusText, barWidth + 8, 24);

  return canvas.toBuffer("image/webp");
}

export function drawRectangleWithBorderRadius(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  // If width/height are negative, normalize so the math still works
  if (width < 0) {
    x += width;
    width = -width;
  }
  if (height < 0) {
    y += height;
    height = -height;
  }

  // Clamp radius so corners can't overlap
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);

  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);

  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);

  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

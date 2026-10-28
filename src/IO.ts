mport { LineDraw, Point, strokeInfo } from "./main.ts";

export function exportHighRes(
  lines: LineDraw[],
  stamps: StampDraw[],
  orginialWidth: number,
  originalHeight: number,
  scale: number = 2
) {
  const highResCanvas = document.createElement("canvas");
  highResCanvas.width = originalWidth * scale;
  highResCanvas.height = originalHeight * scale;
  const ctx = highResCanvas.getContext("2d");

  if (!ctx) return;

  ctx.scale(scale, scale);
  
  for (const line of lines) {
    line.redrawSelf(ctx);
  }

  for (const stamp or stamps) {
    stamp.redrawSelf(ctx);
  }

  const link = document.createElement("a");
  link.download = "mapmaker-high-res.png";
  link.href = highResCanvas.toDataURL("image/png");
  link.click();
}


export function exportDrawingJSON(lines: LineDraw[]. stamps: StampDraw[]) {
  const data = JSON.stringify({
    lines: lines.map(l => ({
      points: l.points,
      stroke: l.stroke
    })),

    stamps: stamps.map(s => ({
      x: s.x,
      y: s.y,
      width: s.width,
      height: s.height,
      src: s.src
    }))
  });

  const blob = new Blob(
    [data],
    {type: "application/json"}
  );

  const link = document.crreateElement("a");
  link.download = "drawing-data.json";
  link.href = URL.createObjectURL(blob);
  link.click();
}




import { LineDraw, Point } from "./main.ts";

export interface SerializedStamp {
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
}

export interface SerializedProject {
  lines: LineDraw[];
  stamps?: SerializedStamp[];
}

export function exportHighRes(
  lines: LineDraw[],
  stamps: StampDraw[],
  originalWidth: number,
  originalHeight: number,
  scale: number = 2,
) {
  const highResCanvas = document.createElement("canvas");
  highResCanvas.width = originalWidth * scale;
  highResCanvas.height = originalHeight * scale;
  const ctx = highResCanvas.getContext("2d");

  if (!ctx) return;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, highResCanvas.width, highResCanvas.height);

  ctx.scale(scale, scale);

  for (const line of lines) {
    line.redrawSelf(ctx);
  }

  for (const stamp of stamps) {
    stamp.redrawSelf(ctx);
  }

  const link = document.createElement("a");
  link.download = "mapmaker-high-res.png";
  link.href = highResCanvas.toDataURL("image/png");
  link.click();
}

export function exportDrawingJSON(lines: LineDraw[], stamps: StampDraw[]) {
  const data = JSON.stringify({
    lines: lines.map((l) => ({
      points: l.points,
      stroke: l.stroke,
    })),

    stamps: stamps.map((s) => ({
      x: s.x,
      y: s.y,
      width: s.width,
      height: s.height,
      src: s.src,
    })),
  });

  const blob = new Blob(
    [data],
    { type: "application/json" },
  );

  const link = document.createElement("a");
  link.download = "drawing-data.json";
  link.href = URL.createObjectURL(blob);
  link.click();
}

export function importDrawingJSON(
  file: File,
  callback: (lines: LineDraw[], stamps: StampDraw[]) => void,
) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const json = JSON.parse(e.target?.result as string) as SerializedProject;

      const loadedLines: LineDraw[] = json.lines.map((l: LineDraw) => {
        const firstPoint = { x: l.points[0].x, y: l.points[0].y };
        const line = new LineDraw(firstPoint);
        line.stroke = l.stroke;
        line.points = l.points.map((p: Point) => ({ x: p.x, y: p.y }));
        return line;
      });

      const loadedStamps: StampDraw[] = [];
      let loadedCount = 0;

      const stampsData = json.stamps;

      if (!json.stamps || json.stamps.length === 0) {
        callback(loadedLines, []);
        return;
      }

      json.stamps.forEach((s: SerializedStamp) => {
        const img = new Image();
        img.src = s.src;
        img.onload = () => {
          loadedStamps.push(
            new StampDraw(img, s.x, s.y, s.width, s.height, s.src),
          );
          loadedCount++;
          if (loadedCount === stampsData!.length) {
            callback(loadedLines, loadedStamps);
          }
        };
      });
    } catch (err) {
      console.error("Failed to parse uploaded project file, try again", err);
    }
  };
  reader.readAsText(file);
}

export class StampDraw {
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;

  constructor(
    image: HTMLImageElement,
    x: number,
    y: number,
    width = 40,
    height = 40,
    src = "",
  ) {
    this.image = image;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.src = src || image.src;
  }

  redrawSelf(ctx: CanvasRenderingContext2D) {
    ctx.drawImage(
      this.image,
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height,
    );
  }
}

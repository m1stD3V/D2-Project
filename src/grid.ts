import { canvas, ctx, LineDraw, redrawCanvas, setStroke } from "./main.ts";

interface gridLine {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}
export default class Grid {
  gridsize: number;
  gridLineWidth: number;
  gridLines: gridLine[];
  constructor(gridsize: number) {
    this.gridsize = gridsize;
    this.gridLineWidth = 2;
    this.gridLines = [];
    this.setupGrid();
  }
  setupGrid() {
    this.gridLines.length = 0;
    const rect = canvas.getBoundingClientRect();
    for (let x = 0; x <= rect.width; x += this.gridsize) {
      this.gridLines.push({ x1: x, x2: x, y1: 0, y2: rect.height });
    }
    for (let y = 0; y <= rect.width; y += this.gridsize) {
      this.gridLines.push({ y1: y, y2: y, x1: 0, x2: rect.width });
    }
    this.drawGrid();
  }
  drawGrid() {
    setStroke({
      width: this.gridLineWidth,
      color: "#a2f8f2",
      cap: "round",
    });
    if (!ctx) return;
    for (const line of this.gridLines) {
      ctx.beginPath();
      ctx.moveTo(line.x1, line.y1);
      ctx.lineTo(line.x2, line.y2);
      ctx.stroke();
    }
  }
  alignGridline(line: gridLine) {
    const rect = canvas.getBoundingClientRect();
    line.x1 = (line.x1 - rect.left) * (canvas.width / rect.width);
    line.y1 = (line.y1 - rect.top) * (canvas.height / rect.height);
    line.x2 = (line.x2 - rect.left) * (canvas.width / rect.width);
    line.y2 = (line.y2 - rect.top) * (canvas.height / rect.height);
  }
  snapToGrid(line: LineDraw) {
    for (const point of line.points) {
      point.x = this.snapDimension(point.x);
      point.y = this.snapDimension(point.y);
    }
    this.liquidateLine(line);
    this.redrawSnappedLine();
  }
  snapDimension(distance: number) {
    const gridIndex = Math.round(distance / this.gridsize);
    return gridIndex * this.gridsize;
  }
  liquidateLine(line: LineDraw) {
    const seen = new Set<string>();
    line.points = line.points.filter((p) => {
      const key = `${p.x},${p.y}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  redrawSnappedLine() {
    redrawCanvas();
  }
}

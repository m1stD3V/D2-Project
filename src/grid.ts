import { canvas, ctx, LineDraw, redrawCanvas } from "./main.ts";

interface gridLine {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}
export default class Grid {
  gridsize: number;
  gridLineWidth: number;
  gridLineColor: string;
  gridLines: gridLine[];
  visible: boolean;
  constructor(gridsize: number) {
    this.gridsize = gridsize;
    this.gridLineWidth = 2;
    this.gridLineColor = "#a2f8f2";
    this.gridLines = [];
    this.visible = true;
    this.setupGrid();
  }
  setSize(gridsize: number) {
    this.gridsize = gridsize;
    this.setupGrid();
  }

  setupGrid() {
    this.gridLines.length = 0;
    for (let x = 0; x <= canvas.width; x += this.gridsize) {
      this.gridLines.push({ x1: x, x2: x, y1: 0, y2: canvas.height });
    }
    for (let y = 0; y <= canvas.height; y += this.gridsize) {
      this.gridLines.push({ y1: y, y2: y, x1: 0, x2: canvas.width });
    }
  }

  drawGrid() {
    if (this.visible) this.drawGridOn(ctx);
  }

  drawGridOn(target: CanvasRenderingContext2D | null) {
    if (!target) return;
    target.save();
    target.lineWidth = this.gridLineWidth;
    target.strokeStyle = this.gridLineColor;
    target.lineCap = "round";
    target.beginPath();
    for (const line of this.gridLines) {
      target.moveTo(line.x1, line.y1);
      target.lineTo(line.x2, line.y2);
    }
    target.stroke();
    target.restore();
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

  snapToCellCenter(distance: number) {
    return (Math.floor(distance / this.gridsize) + 0.5) * this.gridsize;
  }

  liquidateLine(line: LineDraw) {
    line.points = line.points.filter(
      (p, i, pts) => i === 0 || p.x !== pts[i - 1].x || p.y !== pts[i - 1].y,
    );
  }
  redrawSnappedLine() {
    redrawCanvas();
  }
}

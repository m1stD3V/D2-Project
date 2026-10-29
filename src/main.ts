import {
  exportDrawingJSON,
  exportHighRes,
  importDrawingJSON,
  StampDraw,
} from "./IO.ts";
import Grid from "./grid.ts";

const app = document.querySelector<HTMLElement>("#app")!;
export const canvas = document.querySelector<HTMLCanvasElement>("#gridCanvas")!;
export const ctx = canvas.getContext("2d");

//Globals
let mouseDown = false;
let snapToGrid = true;
//export const layerLines: LineDraw[][] = [];
const GRIDSIZE: number = 25;
const grid = new Grid(GRIDSIZE);
export const lines: LineDraw[] = [];
export const undoLines: LineDraw[] = [];
export const stamps: StampDraw[] = [];
let currLine: LineDraw | undefined;
let activeStampImage: HTMLImageElement | null = null;

const heading = document.createElement("h1");
heading.className = "heading";
heading.textContent = "Mapcrafter";
app.append(heading);

const toolbar = document.createElement("div");
toolbar.className = "toolbar";

const btnHighRes = document.createElement("button");
btnHighRes.textContent = "Export(H)";
btnHighRes.onclick = () =>
  exportHighRes(lines, stamps, canvas.width, canvas.height, 3);

const btnExportJSON = document.createElement("button");
btnExportJSON.textContent = "Save(JSON)";
btnExportJSON.onclick = () => exportDrawingJSON(lines, stamps);

const btnPen = document.createElement("button");
btnPen.textContent = "Pen (P)";
btnPen.onclick = () => {
  activeStampImage = null;
};

const fileInputJSON = document.createElement("input");
fileInputJSON.type = "file";
fileInputJSON.accept = ".json";
fileInputJSON.title = "Upload JSON";
fileInputJSON.onchange = (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    importDrawingJSON(file, (loadedLines, loadedStamps) => {
      lines.length = 0;
      lines.push(...loadedLines);
      stamps.length = 0;
      stamps.push(...loadedStamps);
      redrawCanvas();
    });
  }
};

const stampFileInput = document.createElement("input");
stampFileInput.type = "file";
stampFileInput.accept = "image/*";
stampFileInput.title = "Upload IMG";
stampFileInput.onchange = (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        activeStampImage = img;
        stampFileInput.value = "";
        alert(
          "Stamp Successfully Loaded! Click on the canvas to apply the stamp.",
        );
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

toolbar.append(btnPen, btnHighRes, btnExportJSON, fileInputJSON, stampFileInput);
app.append(toolbar);

export function setStroke(
  stroke: strokeInfo = { width: 3, color: "black", cap: "round" },
) {
  if (!ctx) return;
  ctx.lineWidth = stroke.width;
  ctx.strokeStyle = stroke.color;
  ctx.lineCap = stroke.cap;
}

app.append(heading);

canvas.onmousedown = function (pointer) {
  if (!ctx) return;
  const position = fixMouseOffset(pointer);

  if (activeStampImage) {
    const newStamp = new StampDraw(activeStampImage, position.x, position.y);
    stamps.push(newStamp);
    redrawCanvas();
    return;
  }

  mouseDown = true;
  setStroke();
  ctx.beginPath();
  const newPoint = position;
  const newLine = new LineDraw(newPoint);
  lines.push(newLine);
  currLine = newLine;
  ctx.lineTo(position.x, position.y);
  undoLines.length = 0;
};

const stop = () => {
  if (currLine != undefined && snapToGrid) grid.snapToGrid(currLine);
  mouseDown = false;
  currLine = undefined;
};

canvas.onmouseup = stop;
canvas.onmouseleave = stop;

canvas.onmousemove = function (pointer) {
  if (!ctx || mouseDown == false || !currLine) return;
  const position = fixMouseOffset(pointer);
  ctx.lineTo(position.x, position.y);
  const newPoint = position;
  currLine.pushingP(newPoint);
  ctx.stroke();
};

function fixMouseOffset(pointer: MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (pointer.clientX - rect.left) * (canvas.width / rect.width),
    y: (pointer.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function clearCanvas() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  grid.setupGrid();
}

export function redrawCanvas() {
  if (!ctx) return;
  clearCanvas();
  console.log("made it");
  for (const line of lines) {
    line.redrawSelf(ctx);
  }
  for (const stamp of stamps) {
    stamp.redrawSelf(ctx);
  }
}

function undo() {
  if (lines.length > 0) {
    const taken = lines.pop();
    if (taken) undoLines.push(taken);
  }
  redrawCanvas();
}
function redo() {
  if (undoLines.length > 0) {
    const taken = undoLines.pop();
    if (taken) lines.push(taken);
  }
  redrawCanvas();
}

//not yet implemented into drawing or redrawing
export interface strokeInfo {
  width: number;
  color: string | CanvasGradient | CanvasPattern;
  cap: CanvasLineCap;
}

export class LineDraw {
  points: Point[];
  stroke: strokeInfo;
  constructor(firstPoint: Point) {
    this.points = [];
    this.stroke = { width: 3, color: "black", cap: "round" };
    this.points.push(firstPoint);
  }
  pushingP(newPoint: Point) {
    this.points.push(newPoint);
  }
  poppingP() {
    this.points.pop();
  }
  redrawSelf(ctx: CanvasRenderingContext2D) {
    if (this.points.length === 0) return;

    ctx.lineWidth = this.stroke.width;
    ctx.strokeStyle = this.stroke.color;
    ctx.lineCap = this.stroke.cap;
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (const point of this.points) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
  }
}
export interface Point {
  x: number;
  y: number;
}

document.addEventListener("keydown", (event) => {
  if (event.key == "c") {
    lines.length = 0;
    stamps.length = 0;
    clearCanvas();
  } else if (event.key == "r") redrawCanvas();
  else if (event.key == "z") undo();
  else if (event.key == "y") redo();
  else if (event.key == "g") snapToGrid = !snapToGrid;
  else if (event.key == "h") {
    exportHighRes(lines, stamps, canvas.width, canvas.height, 3);
  } else if (event.key == "p") activeStampImage = null;
});

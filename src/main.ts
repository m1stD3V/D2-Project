import {
  exportDrawingJSON,
  exportHighRes,
  importDrawingJSON,
  StampDraw,
} from "./IO.ts";
import Grid from "./grid.ts";

export const canvas = document.querySelector<HTMLCanvasElement>("#gridCanvas")!;
export const ctx = canvas.getContext("2d");

const el = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;

//Globals
let mouseDown = false;
let snapToGrid = true;
let currentStroke: strokeInfo = { width: 3, color: "#000000", cap: "round" };
const GRIDSIZE: number = 40;
const grid = new Grid(GRIDSIZE);
export const lines: LineDraw[] = [];
export const stamps: StampDraw[] = [];
let currLine: LineDraw | undefined;
let activeStampImage: HTMLImageElement | null = null;

type HistoryEntry =
  | { kind: "line"; item: LineDraw }
  | { kind: "stamp"; item: StampDraw };

const history: HistoryEntry[] = [];
const redoStack: HistoryEntry[] = [];

//Options in user space
const btnPen = el<HTMLButtonElement>("btnPen");
const penColor = el<HTMLInputElement>("penColor");
const penWidth = el<HTMLInputElement>("penWidth");
const penWidthOut = el<HTMLOutputElement>("penWidthOut");
const btnUndo = el<HTMLButtonElement>("btnUndo");
const btnRedo = el<HTMLButtonElement>("btnRedo");
const btnClear = el<HTMLButtonElement>("btnClear");
const showGrid = el<HTMLInputElement>("showGrid");
const snapBox = el<HTMLInputElement>("snapBox");
const gridSizeSelect = el<HTMLSelectElement>("gridSize");
const exportGridBox = el<HTMLInputElement>("exportGrid");
const btnExport = el<HTMLButtonElement>("btnExport");
const btnSave = el<HTMLButtonElement>("btnSave");
const loadInput = el<HTMLInputElement>("loadJSON");
const stampFileInput = el<HTMLInputElement>("stampFiles");
const stampList = el<HTMLElement>("stampList");
const toolStatus = el<HTMLElement>("toolStatus");
const stampButtons = new Map<HTMLImageElement, HTMLButtonElement>();

export function setStroke(
  stroke: strokeInfo = { width: 3, color: "black", cap: "round" },
) {
  if (!ctx) return;
  ctx.lineWidth = stroke.width;
  ctx.strokeStyle = stroke.color;
  ctx.lineCap = stroke.cap;
}

function commit(entry: HistoryEntry) {
  history.push(entry);
  redoStack.length = 0;
  syncHistoryButtons();
}

canvas.onmousedown = function (pointer) {
  if (!ctx) return;
  const position = fixMouseOffset(pointer);

  if (activeStampImage) {
    const size = grid.gridsize;
    const x = snapToGrid ? grid.snapToCellCenter(position.x) : position.x;
    const y = snapToGrid ? grid.snapToCellCenter(position.y) : position.y;
    const newStamp = new StampDraw(activeStampImage, x, y, size, size);
    stamps.push(newStamp);
    commit({ kind: "stamp", item: newStamp });
    redrawCanvas();
    return;
  }

  mouseDown = true;
  setStroke(currentStroke);
  ctx.beginPath();
  const newLine = new LineDraw(position, currentStroke);
  lines.push(newLine);
  commit({ kind: "line", item: newLine });
  currLine = newLine;
  ctx.moveTo(position.x, position.y);
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
  currLine.pushingP(position);
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
  grid.drawGrid();
}

export function redrawCanvas() {
  if (!ctx) return;
  clearCanvas();
  for (const line of lines) {
    line.redrawSelf(ctx);
  }
  for (const stamp of stamps) {
    stamp.redrawSelf(ctx);
  }
  syncHistoryButtons();
}

function syncHistoryButtons() {
  btnUndo.disabled = history.length === 0;
  btnRedo.disabled = redoStack.length === 0;
}

function undo() {
  if (mouseDown) return;
  const entry = history.pop();
  if (!entry) return;
  if (entry.kind === "line") {
    const i = lines.indexOf(entry.item);
    if (i >= 0) lines.splice(i, 1);
  } else {
    const i = stamps.indexOf(entry.item);
    if (i >= 0) stamps.splice(i, 1);
  }
  redoStack.push(entry);
  redrawCanvas();
}

function redo() {
  if (mouseDown) return;
  const entry = redoStack.pop();
  if (!entry) return;
  if (entry.kind === "line") lines.push(entry.item);
  else stamps.push(entry.item);
  history.push(entry);
  redrawCanvas();
}

function clearAll() {
  if (lines.length === 0 && stamps.length === 0) return;
  if (!confirm("Clear the whole map? This cannot be undone!")) return;
  lines.length = 0;
  stamps.length = 0;
  history.length = 0;
  redoStack.length = 0;
  redrawCanvas();
}

function exportPNG() {
  const withGrid = exportGridBox.checked;
  exportHighRes(
    lines,
    stamps,
    canvas.width,
    canvas.height,
    3,
    withGrid ? (target) => grid.drawGridOn(target) : undefined,
  );
}

function setSnap(on: boolean) {
  snapToGrid = on;
  snapBox.checked = on;
}

function setActiveStamp(img: HTMLImageElement | null) {
  activeStampImage = img;
  btnPen.classList.toggle("active", img === null);
  for (const [image, button] of stampButtons) {
    button.classList.toggle("active", image === img);
  }
  toolStatus.textContent = img ? "Tool: Stamp" : "Tool: Pen";
}

function addStampToLibrary(img: HTMLImageElement) {
  const button = document.createElement("button");
  button.className = "stamp";
  button.title = "Use this stamp";
  const thumb = new Image();
  thumb.src = img.src;
  thumb.alt = "Stamp";
  button.append(thumb);
  button.onclick = () => setActiveStamp(img);
  stampList.append(button);
  stampButtons.set(img, button);
  setActiveStamp(img);
}

//Hookin up the buttons
btnPen.onclick = () => setActiveStamp(null);
btnUndo.onclick = undo;
btnRedo.onclick = redo;
btnClear.onclick = clearAll;
btnExport.onclick = exportPNG;
btnSave.onclick = () => exportDrawingJSON(lines, stamps);

penColor.oninput = () => {
  currentStroke = { ...currentStroke, color: penColor.value };
};

penWidth.oninput = () => {
  currentStroke = { ...currentStroke, width: Number(penWidth.value) };
  penWidthOut.textContent = penWidth.value;
};

showGrid.onchange = () => {
  grid.visible = showGrid.checked;
  redrawCanvas();
};
snapBox.onchange = () => setSnap(snapBox.checked);
gridSizeSelect.onchange = () => {
  grid.setSize(Number(gridSizeSelect.value));
  redrawCanvas();
};

loadInput.onchange = () => {
  const file = loadInput.files?.[0];
  if (file) {
    importDrawingJSON(file, (loadedLines, loadedStamps) => {
      lines.length = 0;
      lines.push(...loadedLines);
      stamps.length = 0;
      stamps.push(...loadedStamps);

      history.length = 0;
      redoStack.length = 0;
      for (const item of lines) history.push({ kind: "line", item });
      for (const item of stamps) history.push({ kind: "stamp", item });
      redrawCanvas();
    });
  }
  loadInput.value = "";
};

stampFileInput.onchange = () => {
  for (const file of Array.from(stampFileInput.files ?? [])) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => addStampToLibrary(img);
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }
  stampFileInput.value = "";
};

export interface strokeInfo {
  width: number;
  color: string | CanvasGradient | CanvasPattern;
  cap: CanvasLineCap;
}

export class LineDraw {
  points: Point[];
  stroke: strokeInfo;
  constructor(
    firstPoint: Point,
    stroke: strokeInfo = { width: 3, color: "black", cap: "round" },
  ) {
    this.points = [];
    this.stroke = { ...stroke };
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
  const key = event.key.toLowerCase();

  if (event.ctrlKey || event.metaKey) {
    if (key === "z") {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    } else if (key === "y") {
      event.preventDefault();
      redo();
    }
    return;
  }

  switch (key) {
    case "c":
      clearAll();
      break;
    case "r":
      redrawCanvas();
      break;
    case "z":
      undo();
      break;
    case "y":
      redo();
      break;
    case "g":
      setSnap(!snapToGrid);
      break;
    case "h":
      exportPNG();
      break;
    case "p":
      setActiveStamp(null);
      break;
  }
});

setActiveStamp(null);
redrawCanvas();

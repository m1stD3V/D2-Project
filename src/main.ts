const app = document.querySelector<HTMLElement>("#app")!;
const canvas = document.querySelector<HTMLCanvasElement>("#gridCanvas")!;
const ctx = canvas.getContext("2d");

//Globals
let mouseDown = false;
const lines: LineDraw[] = [];
const undoLines: LineDraw[] = [];
let currLine: LineDraw | undefined;

const heading = document.createElement("h1");
heading.textContent = "Mapcrafter";

function setStroke(
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
  mouseDown = true;
  setStroke();
  ctx.beginPath();
  const position = fixMouseOffset(pointer);
  const newPoint = new Point(position.x, position.y);
  const newLine = new LineDraw(newPoint);
  lines.push(newLine);
  currLine = newLine;
  ctx.lineTo(position.x, position.y);
  undoLines.length = 0;
};

const stop = () => {
  mouseDown = false;
  currLine = undefined;
};

canvas.onmouseup = stop;
canvas.onmouseleave = stop;

canvas.onmousemove = function (pointer) {
  if (!ctx || mouseDown == false || !currLine) return;
  const position = fixMouseOffset(pointer);
  ctx.lineTo(position.x, position.y);
  const newPoint = new Point(position.x, position.y);
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
}

function redrawPoints() {
  if (!ctx) return;
  clearCanvas();
  console.log("made it");
  for (const line of lines) {
    line.redrawSelf(ctx);
  }
}

function undo() {
  if (lines.length > 0) {
    const taken = lines.pop();
    if (taken) undoLines.push(taken);
  }
  redrawPoints();
}
function redo() {
  if (undoLines.length > 0) {
    const taken = undoLines.pop();
    if (taken) lines.push(taken);
  }
  redrawPoints();
}

//not yet implemented into drawing or redrawing
interface strokeInfo {
  width: number;
  color: string | CanvasGradient | CanvasPattern;
  cap: CanvasLineCap;
}

class LineDraw {
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

    setStroke(this.stroke);
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (const point of this.points) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
  }
}
class Point {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

document.addEventListener("keydown", (event) => {
  if (event.key == "c") clearCanvas();
  else if (event.key == "r") redrawPoints();
  else if (event.key == "z") undo();
  else if (event.key == "y") redo();
});

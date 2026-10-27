const app = document.querySelector<HTMLElement>("#app")!;
const canvas = document.querySelector<HTMLCanvasElement>("#gridCanvas")!;
const ctx = canvas.getContext("2d");

//Globals
let mouseDown = false;
const pointStarts: Point[] = [];
let currPoint: Point | undefined;

const heading = document.createElement("h1");
heading.textContent = "Mapcrafter";

function setStroke(
  width: number = 3,
  color: string | CanvasGradient | CanvasPattern = "black",
  cap: CanvasLineCap = "round",
) {
  if (!ctx) return;
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.lineCap = cap;
}

app.append(heading);

canvas.onmousedown = function (pointer) {
  if (!ctx) return;
  mouseDown = true;
  setStroke();
  ctx.beginPath();
  const position = fixMouseOffset(pointer);
  const newPoint = new Point(position.x, position.y);
  pointStarts.push(newPoint);
  currPoint = newPoint;
  ctx.lineTo(position.x, position.y);
};

const stop = () => {
  mouseDown = false;
  currPoint = undefined;
};

canvas.onmouseup = stop;
canvas.onmouseleave = stop;

canvas.onmousemove = function (pointer) {
  if (!ctx || mouseDown == false || !currPoint) return;
  const position = fixMouseOffset(pointer);
  ctx.lineTo(position.x, position.y);
  const newPoint = new Point(position.x, position.y);
  currPoint.nextPoint = newPoint;
  currPoint = newPoint;
  ctx.stroke();
};

function fixMouseOffset(pointer: MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (pointer.clientX - rect.left) * (canvas.width / rect.width),
    y: (pointer.clientY - rect.top) * (canvas.height / rect.height),
  };
}

class Point {
  x: number;
  y: number;
  nextPoint: Point | undefined;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  next() {
    return this.nextPoint;
  }
}

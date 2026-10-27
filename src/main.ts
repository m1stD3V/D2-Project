const app = document.querySelector<HTMLElement>("#app")!;
const canvas = document.querySelector<HTMLCanvasElement>("#gridCanvas")!;
const ctx = canvas.getContext("2d");

let mouseDown = false;

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
  ctx.lineTo(position.x, position.y);
};

canvas.onmouseup = function () {
  mouseDown = false;
};
canvas.onmouseleave = function () {
  mouseDown = false;
};

canvas.onmousemove = function (pointer) {
  if (!ctx || mouseDown == false) return;
  const position = fixMouseOffset(pointer);
  ctx.lineTo(position.x, position.y);
  ctx.stroke();
};

function fixMouseOffset(pointer: MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (pointer.clientX - rect.left) * (canvas.width / rect.width),
    y: (pointer.clientY - rect.top) * (canvas.height / rect.height),
  };
}

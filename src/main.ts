import { createParticle, moveParticle, spreadParticle } from "./particles";
import { SimulatorState, ParticleKind } from "./types";
import init, { interpolate_line } from "pixelz-rs";

const CELL_SIZE = 8;

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

const state: SimulatorState = new SimulatorState();

let currentParticle: ParticleKind | null = null;

let pressed = false;
let mouseX = 0;
let mouseY = 0;

function circle(
  kind: ParticleKind,
  posX: number,
  posY: number,
  radius: number,
  prob: number
) {
  posX = Math.floor(posX / CELL_SIZE);
  posY = Math.floor(posY / CELL_SIZE);

  for (let x = posX - radius; x <= posX + radius; x++) {
    for (let y = posY - radius; y <= posY + radius; y++) {
      if (Math.sqrt((x - posX) ** 2 + (y - posY) ** 2) <= radius) {
        const index = state.toIndex(x, y);
        if (Math.random() < prob) {
          state.cells[index] = createParticle(kind);
          state.updateCells.push([x, y]);
        }
      }
    }
  }
}

function tick() {
  if (pressed && currentParticle !== null) {
    circle(currentParticle, mouseX, mouseY, 5, 0.1);
  }

  for (let y = state.height - 1; y >= 0; y--) {
    for (let x = 0; x < state.width; x++) {
      const particle = state.getParticle(x, y);

      if (particle !== null) {
        const possibleLocations = spreadParticle(state, particle, x, y);

        for (const [nextX, nextY] of possibleLocations) {
          const particleMoved = moveParticle(
            state,
            particle,
            x,
            y,
            nextX,
            nextY
          );

          if (particleMoved) {
            break;
          }
        }
      }
    }
  }
}

function renderLoop() {
  tick();

  while (state.updateCells.length > 0) {
    const [x, y] = state.updateCells.pop()!;

    if (x < state.width && y < state.height) {
      const cell = state.getParticle(x, y);

      ctx.beginPath();

      if (cell === null) {
        ctx.clearRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      } else {
        ctx.fillStyle = cell.colour;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }

      ctx.stroke();
    }
  }

  requestAnimationFrame(renderLoop);
}

window.onload = async () => {
  await init();

  canvas = document.getElementById("canvas") as HTMLCanvasElement;
  ctx = canvas.getContext("2d")!;

  state.cells = new Array(state.width * state.height).fill(null);

  const resize = () => {
    const oldWidth = state.width;
    const oldHeight = state.height;

    state.width = Math.floor(window.innerWidth / CELL_SIZE);
    state.height = Math.floor(window.innerHeight / CELL_SIZE);

    if (state.width != oldWidth || state.height != oldHeight) {
      const newCells = new Array(state.width * state.height).fill(null);

      for (let y = 0; y < Math.min(state.height, oldHeight); y++) {
        for (let x = 0; x < Math.min(state.width, oldWidth); x++) {
          newCells[state.toIndex(x, y)] = state.getParticle(x, y);
        }
      }

      state.cells = newCells;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        state.updateCells.push([x, y]);
      }
    }
  };

  resize();
  addEventListener("resize", resize);

  canvas.addEventListener("mousedown", (event) => {
    pressed = true;
    mouseX = event.offsetX;
    mouseY = event.offsetY;
  });

  canvas.addEventListener("mousemove", (event) => {
    if (pressed && currentParticle !== null) {
      const lineCoordinates = interpolate_line(
        mouseX,
        mouseY,
        event.offsetX,
        event.offsetY
      );

      for (const { x, y } of lineCoordinates) {
        circle(currentParticle, x, y, 5, 0.1);
      }

      mouseX = event.offsetX;
      mouseY = event.offsetY;
    }
  });

  canvas.addEventListener("mouseup", () => {
    pressed = false;
  });

  requestAnimationFrame(renderLoop);
};

const createButton = (text: string, newParticle: ParticleKind | null) => {
  const button = document.createElement("button");
  button.innerText = text;
  button.addEventListener("click", () => (currentParticle = newParticle));
  document.getElementById("type-buttons")!.appendChild(button);
};

for (const particleName of Object.values(ParticleKind)) {
  createButton(particleName, particleName);
}

createButton("Erase", null);

let canvas = null;
let ctx = null;

const cellSize = 8;
let width = 0;
let height = 0;

let cells = [];

let pressed = false;
let mouseX = 0;
let mouseY = 0;

function choose(array) {
    return array[Math.floor(Math.random() * array.length)]
}

class Particle {
    constructor(colours) {
        this.colour = choose(colours);
    }
}

class Empty extends Particle {
    constructor() {
        super(["#000000ff"]);
    }
}

class Sand extends Particle {
    constructor() {
        const colours = [
            "#ffee00ff",
            "#eedd00ff",
            "#ddcc00ff",
            "#ccbb00ff"
        ]
        super(colours);
    }
}

function circle(posX, posY, radius, prob) {
    posX = Math.floor(posX / cellSize);
    posY = Math.floor(posY / cellSize);

    for (let x = posX - radius; x <= posX + radius; x++) {
        for (let y = posY - radius; y <= posY + radius; y++) {
            if (Math.sqrt((x - posX)**2 + (y - posY)**2) <= radius) {
                if (Math.random() < prob) {
                    cells[y * width + x] = new Sand();
                } else {
                    cells[y * width + x] = new Empty();
                }
            }
        }
    }
}

function tick() {
    if (pressed) {
        circle(mouseX, mouseY, 5, 0.7);
    }

    let nextCells = Array.from({length: width * height}, () => new Empty());

    for (let y = height - 1; y >= 0; y--) {
        for (let x = 0; x < width; x++) {
            let cellIndex = y * width + x;
            let particle = cells[cellIndex]
            if (!(particle instanceof Empty)) {
                let possibleLocations = [];

                if (y < height - 1) {
                    let down = cellIndex + width;

                    possibleLocations.push(down);

                    let left = down - 1;
                    let right = down + 1
                    let hasLeft = x > 0;
                    let hasRight = x < width - 1;

                    if (hasLeft && hasRight)
                    {
                        if (Math.random() < 0.5) {
                            possibleLocations.push(left);
                        } else {
                            possibleLocations.push(right);
                        }
                    }
                    else if (hasLeft) {
                        possibleLocations.push(left);
                    }
                    else if (hasRight) {
                        possibleLocations.push(right);
                    }
                }

                possibleLocations.push(cellIndex);

                for (let i = 0; i < possibleLocations.length; i++) {
                    let loc = possibleLocations[i];
                    if (nextCells[loc] instanceof Empty) {
                        nextCells[loc] = particle;
                        break;
                    }
                }
            }
        }
    }

    cells = nextCells;
}

function renderLoop() {
    tick();

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            ctx.fillStyle = cells[y * width + x].colour;
            ctx.beginPath();
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            ctx.stroke();
        }
    }

    requestAnimationFrame(renderLoop);
}

window.onload = () => {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    width = Math.floor(canvas.clientWidth / cellSize);
    height = Math.floor(canvas.clientHeight / cellSize);

    cells = Array.from({length: width * height}, () => new Empty());

    addEventListener("mousedown", (event) => {
        pressed = true;
        mouseX = event.offsetX;
        mouseY = event.offsetY;
    });
    addEventListener("mousemove", (event) => {
        if (pressed) {
            let x0 = mouseX;
            let y0 = mouseY;
            let x1 = event.offsetX;
            let y1 = event.offsetY;

            let dx = Math.abs(x1 - x0);
            let sx = x0 < x1 ? 1 : -1;
            let dy = -Math.abs(y1 - y0);
            let sy = y0 < y1 ? 1 : -1;
            let error = dx + dy;

            while (true) {
                circle(x0, y0, 5, 0.7);

                if (x0 == x1 && y0 == y1) {
                    break;
                }
                let e2 = 2 * error;
                if (e2 >= dy) {
                    if (x0 == x1) {
                        break;
                    }
                    error += dy;
                    x0 += sx;
                }
                if (e2 <= dx) {
                    if (y0 == y1) {
                        break;
                    }
                    error += dx;
                    y0 += sy;
                }
            }

            mouseX = event.offsetX;
            mouseY = event.offsetY;
        }
    });
    addEventListener("mouseup", () => {
        pressed = false;
    });

    requestAnimationFrame(renderLoop);
}

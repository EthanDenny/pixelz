let canvas = null;
let ctx = null;

const cellSize = 8;
let width = 0;
let height = 0;

let cells = [];
let updateCells = [];

let pressed = false;
let buttonDown = 0;
let mouseX = 0;
let mouseY = 0;

let newParticle = () => null

function choose(array) {
    return array[Math.floor(Math.random() * array.length)]
}

function toIndex(x, y) {
    return y * width + x;
}

class Particle {
    constructor(density, colours) {
        this.density = density;
        this.colour = choose(colours);
    }
}

class Sand extends Particle {
    constructor() {
        const colours = [
            "#ffee00ff",
            "#eedd00ff",
            "#ddcc00ff",
            "#ccbb00ff",
        ]
        super(1, colours);
    }
}

class Water extends Particle {
    constructor() {
        const colours = [
            "#0000ffff",
            "#0000eeff",
            "#0000ddff",
            "#0000ccff",
        ]
        super(0, colours);
    }
}

function setType(type) {
    switch (type) {
        case "sand":
            newParticle = () => new Sand();
            break;
        case "water":
            newParticle = () => new Water();
            break;
        default:
            newParticle = () => null;
            break;
    }
}

function circle(posX, posY, radius, prob) {
    posX = Math.floor(posX / cellSize);
    posY = Math.floor(posY / cellSize);

    for (let x = posX - radius; x <= posX + radius; x++) {
        for (let y = posY - radius; y <= posY + radius; y++) {
            if (Math.sqrt((x - posX)**2 + (y - posY)**2) <= radius) {
                let index = toIndex(x, y);
                if (Math.random() < prob) {
                    cells[index] = newParticle();
                    updateCells.push([x, y]);
                }
            }
        }
    }
}

function tick() {
    if (pressed) {
        circle(mouseX, mouseY, 5, 0.1);
    }

    for (let y = height - 1; y >= 0; y--) {
        for (let x = 0; x < width; x++) {
            let cellIndex = toIndex(x, y);
            let particle = cells[cellIndex]
            let possibleLocations = [];

            let down = [x, y + 1];
            let left = [x - 1, y];
            let right = [x + 1, y];
            let downLeft = [x - 1, y + 1];
            let downRight = [x + 1, y + 1];

            let hasDown = y < height - 1;
            let hasLeft = x > 0;
            let hasRight = x < width - 1;

            if (particle instanceof Sand) {
                if (hasDown) {
                    possibleLocations.push(down);

                    if (hasLeft && hasRight)
                    {
                        if (Math.random() < 0.5) {
                            possibleLocations.push(downLeft);
                        } else {
                            possibleLocations.push(downRight);
                        }
                    }
                    else if (hasLeft) {
                        possibleLocations.push(downLeft);
                    }
                    else if (hasRight) {
                        possibleLocations.push(downRight);
                    }
                }

                possibleLocations.push([x, y]);
            }

            if (particle instanceof Water) {
                if (hasDown) {
                    possibleLocations.push(down);

                    if (hasLeft && hasRight)
                    {
                        if (Math.random() < 0.5) {
                            possibleLocations.push(downLeft);
                        } else {
                            possibleLocations.push(downRight);
                        }
                    }
                    else if (hasLeft) {
                        possibleLocations.push(downLeft);
                    }
                    else if (hasRight) {
                        possibleLocations.push(downRight);
                    }
                }

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

                possibleLocations.push([x, y]);
            }

            if (particle !== null) {
                for (let i = 0; i < possibleLocations.length; i++) {
                    let [nextX, nextY] = possibleLocations[i];
                    let nextIndex = toIndex(nextX, nextY);
                    let nextParticle = cells[nextIndex];

                    if (nextParticle === null || nextParticle.density < particle.density) {
                        // Swap particles
                        cells[cellIndex] = nextParticle;
                        cells[nextIndex] = particle;

                        updateCells.push([x, y]);
                        updateCells.push([nextX, nextY])

                        break;
                    }
                }
            }
        }
    }
}

function renderLoop() {
    tick();

    while (updateCells.length > 0) {
        let [x, y] = updateCells.pop();
        let cell = cells[toIndex(x, y)];

        ctx.beginPath();

        if (cell === null) {
            ctx.clearRect(x * cellSize, y * cellSize, cellSize, cellSize);
        } else {
            ctx.fillStyle = cell.colour;
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }

        ctx.stroke();
    }

    requestAnimationFrame(renderLoop);
}

window.onload = () => {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    width = Math.floor(canvas.clientWidth / cellSize);
    height = Math.floor(canvas.clientHeight / cellSize);

    cells = new Array(width * height).fill(null);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            updateCells.push([x, y]);
        }
    }

    canvas.addEventListener("mousedown", (event) => {
        pressed = true;
        mouseX = event.offsetX;
        mouseY = event.offsetY;
        buttonDown = event.button;
    });
    canvas.addEventListener("mousemove", (event) => {
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
                circle(x0, y0, 5, 0.1);

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
    canvas.addEventListener("mouseup", () => {
        pressed = false;
    });

    requestAnimationFrame(renderLoop);
}

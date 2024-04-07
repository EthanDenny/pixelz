let canvas = null;
let ctx = null;

const cellSize = 8;
let width = 0;
let height = 0;

let cells = [];
let updateCells = [];

let pressed = false;
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

    spread(x, y) {
        return true;
    }

    move(x0, y0, x1, y1) {
        let startIndex = toIndex(x0, y0);
        let endIndex = toIndex(x1, y1);

        let startParticle = cells[startIndex];
        let endParticle = cells[endIndex];

        if (endParticle === null || endParticle.density < startParticle.density) {
            cells[startIndex] = endParticle;
            cells[endIndex] = startParticle;

            updateCells.push([x0, y0]);
            updateCells.push([x1, y1]);

            return true;
        }

        return false;
    }
}

class Dust extends Particle {
    constructor(density, colours) {
        super(density, colours);
    }

    spread(x, y) {
        let possibleLocations = [];

        let down = [x, y + 1];
        let downLeft = [x - 1, y + 1];
        let downRight = [x + 1, y + 1];

        let hasDown = y < height - 1;
        let hasLeft = x > 0;
        let hasRight = x < width - 1;

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

        return possibleLocations;
    }
}

class Liquid extends Particle {
    constructor(density, colours) {
        super(density, colours);
    }

    spread(x, y) {
        let possibleLocations = [];

        let down = [x, y + 1];
        let left = [x - 1, y];
        let right = [x + 1, y];
        let downLeft = [x - 1, y + 1];
        let downRight = [x + 1, y + 1];

        let hasDown = y < height - 1;
        let hasLeft = x > 0;
        let hasRight = x < width - 1;

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

        return possibleLocations;
    }
}

class Stone extends Particle {
    constructor() {
        const colours = [
            "#ddddddff",
            "#ccccccff",
            "#bbbbbbff",
            "#aaaaaaff",
        ]
        super(1, colours);
    }
}

class Sand extends Dust {
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

class Water extends Liquid {
    constructor() {
        const colours = [
            "#0000ffff",
            "#0000eeff",
            "#0000ddff",
            "#0000ccff",
        ]
        super(0.5, colours);
    }
}

class Acid extends Liquid {
    constructor() {
        const colours = [
            "#00ff00ff",
            "#00ee00ff",
            "#00dd00ff",
            "#00cc00ff",
        ]
        super(0, colours);
    }

    move(x0, y0, x1, y1) {
        let startIndex = toIndex(x0, y0);
        let endIndex = toIndex(x1, y1);

        let startParticle = cells[startIndex];
        let endParticle = cells[endIndex];

        if (!(endParticle instanceof Acid)) {
            if (Math.random() < 0.02) {
                cells[startIndex] = null;
                cells[endIndex] = startParticle;

                updateCells.push([x0, y0]);
                updateCells.push([x1, y1]);

                return true;
            }
            
            if (endParticle === null) {
                cells[startIndex] = endParticle;
                cells[endIndex] = startParticle;
    
                updateCells.push([x0, y0]);
                updateCells.push([x1, y1]);
    
                return true;
            }
        }

        return false;
    }
}

function setType(type) {
    switch (type) {
        case "stone":
            newParticle = () => new Stone();
            break;
        case "sand":
            newParticle = () => new Sand();
            break;
        case "water":
            newParticle = () => new Water();
            break;
        case "acid":
            newParticle = () => new Acid();
            break;
        case "erase":
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

            if (particle !== null) {
                let possibleLocations = particle.spread(x, y);
                for (let i = 0; i < possibleLocations.length; i++) {
                    let [nextX, nextY] = possibleLocations[i];
                    if (particle.move(x, y, nextX, nextY)) {
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

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

function isFlammable(x, y) {
    let index = toIndex(x, y);
    return cells[index] !== null && cells[index].flammable;
}

class Particle {
    constructor(density, colours, flammable) {
        this.density = density;
        this.colour = choose(colours);
        this.flammable = flammable;
    }

    spread(x, y) {
        return [];
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

function ignite(x, y) {
    if (!isFlammable(x, y)) {
        return false;
    }

    let index = toIndex(x, y);
    cells[index] = new Fire();
    updateCells.push([x, y]);

    return true;
}

class Fire extends Particle {
    constructor() {
        const colours = [
            "#ff6600ff",
            "#ee5500ff",
            "#dd4400ff",
            "#cc3300ff",
        ]
        super(0, colours, false);
        
        this.canSpread = false;
        this.hasSpread = false;
    }

    spread(x, y) {
        let possibleLocations = [];

        this.canSpread = false;

        for (let nextY = Math.max(0, y - 1); nextY <= Math.min(height - 1, y + 1); nextY++) {
            for (let nextX = Math.max(0, x - 1); nextX <= Math.min(width - 1, x + 1); nextX++) {
                if (isFlammable(nextX, nextY)) {
                    this.canSpread = true;
                }
                possibleLocations.push([nextX, nextY]);
            }
        }

        if (Math.random() < 0.1) {
            return [choose(possibleLocations)];
        }
        
        return [];
    }

    move(x0, y0, x1, y1) {
        if (ignite(x1, y1)) {
            this.hasSpread = true;
        }

        let snuffChance = 0;

        if (!this.canSpread) {
            snuffChance += 0.9;

            if (this.hasSpread) {
                snuffChance += 0.1;
            }
        }

        if (Math.random() < snuffChance) {
            let startIndex = toIndex(x0, y0);
            cells[startIndex] = null;
            updateCells.push([x0, y0]);
        }

        return true;
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
        super(1, colours, false);
    }
}

class Wood extends Particle {
    constructor() {
        const colours = [
            "#774400ff",
            "#663300ff",
            "#552200ff",
            "#441100ff",
        ]
        super(1, colours, true);
    }
}

class Dust extends Particle {
    constructor(density, colours, flammable) {
        super(density, colours, flammable);
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

class Sand extends Dust {
    constructor() {
        const colours = [
            "#ffee00ff",
            "#eedd00ff",
            "#ddcc00ff",
            "#ccbb00ff",
        ]
        super(1, colours, false);
    }
}

class Liquid extends Particle {
    constructor(density, colours) {
        super(density, colours, false);
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

    move(x0, y0, x1, y1) {
        let startIndex = toIndex(x0, y0);
        let endIndex = toIndex(x1, y1);

        let startParticle = cells[startIndex];
        let endParticle = cells[endIndex];

        if (endParticle instanceof Fire) {
            cells[startIndex] = null;
            cells[endIndex] = startParticle;

            updateCells.push([x0, y0]);
            updateCells.push([x1, y1]);
        } else if (endParticle instanceof Lava) {
            cells[endIndex] = new Stone();
            updateCells.push([x1, y1]);
        } else if (endParticle === null || endParticle.density < startParticle.density) {
            cells[startIndex] = endParticle;
            cells[endIndex] = startParticle;

            updateCells.push([x0, y0]);
            updateCells.push([x1, y1]);
        } else {
            return false;
        }

        return true;
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

                if (cells[endIndex] !== null && Math.random() < 0.8) {
                    cells[endIndex] = null;
                } else {
                    cells[endIndex] = startParticle;
                }

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

class Lava extends Liquid {
    constructor() {
        const colours = [
            "#dd3300ff",
            "#cc2200ff",
            "#bb1100ff",
            "#aa0000ff",
        ]
        super(0.5, colours);
    }

    move(x0, y0, x1, y1) {
        let startIndex = toIndex(x0, y0);
        let endIndex = toIndex(x1, y1);

        let startParticle = cells[startIndex];
        let endParticle = cells[endIndex];
        
        if (endParticle === null) {
            cells[startIndex] = endParticle;
            cells[endIndex] = startParticle;

            updateCells.push([x0, y0]);
            updateCells.push([x1, y1]);
        } else if (endParticle instanceof Water) {
            cells[startIndex] = new Stone();
            updateCells.push([x0, y0]);
        } else if (Math.random() < 0.02) {
            ignite(x1, y1);
            updateCells.push([x1, y1]);
        } else {
            return false;
        }

        return true;
    }
}

function setType(type) {
    switch (type) {
        case "stone":
            newParticle = () => new Stone();
            break;
        case "wood":
            newParticle = () => new Wood();
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
        case "fire":
            newParticle = () => new Fire();
            break;
        case "lava":
            newParticle = () => new Lava();
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

        if (x < width && y < height)
        {
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
    }

    requestAnimationFrame(renderLoop);
}

window.onload = () => {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    cells = new Array(width * height).fill(null);

    let resize = (event) => {
        let oldWidth = width;
        let oldHeight = height;

        width = Math.floor(window.innerWidth / cellSize);
        height = Math.floor(window.innerHeight / cellSize);

        if (width != oldWidth || height != oldHeight) {
            let newCells = new Array(width * height).fill(null);

            for (let y = 0; y < Math.min(height, oldHeight); y++) {
                for (let x = 0; x < Math.min(width, oldWidth); x++) {
                    newCells[toIndex(x, y)] = cells[y * oldWidth + x];
                }
            }

            cells = newCells;
        }

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                updateCells.push([x, y]);
            }
        }
    }

    resize(null);
    addEventListener("resize", resize);

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

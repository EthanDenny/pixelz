let canvas = null;
let context = null;
let canvasWidth = 0;
let canvasHeight = 0;
let cells = [];

let pressed = false;
let lastX = 0;
let lastY = 0;

function tick() {
    if (pressed) {
        cells[lastY * canvasHeight + lastX] = 255;
    }

    let nextCells = new Array(canvasWidth * canvasHeight).fill(0);

    for (let y = canvasHeight - 1; y >= 0; y--) {
        for (let x = 0; x < canvasWidth; x++) {
            let cellIndex = y * canvasWidth + x;
            if (cells[cellIndex] == 255) {
                let possibleLocations = [];

                if (y < canvasHeight - 1) {
                    let down = cellIndex + canvasWidth;

                    possibleLocations.push(down);

                    let left = down - 1;
                    let right = down + 1

                    let hasLeft = x > 0;
                    let hasRight = x < canvasWidth - 1;

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
                    if (nextCells[loc] == 0) {
                        nextCells[loc] = 255;
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

    var data = new Uint8ClampedArray(canvasWidth * canvasHeight * 4);
    for (let index = 0; index < canvasWidth * canvasHeight; index++) {
        let pixel = index * 4;
        let cell = cells[index];
        data[pixel + 0] = cell;
        data[pixel + 1] = cell;
        data[pixel + 2] = cell;
        data[pixel + 3] = 255;
    }

    let image = new ImageData(data, canvasWidth, canvasHeight);
    context.putImageData(image, 0.0, 0.0)

    requestAnimationFrame(renderLoop);
}

function start() {
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");
    canvasWidth = canvas.clientWidth;
    canvasHeight = canvas.clientHeight;
    cells = new Array(canvasWidth * canvasHeight).fill(0);

    addEventListener("mousedown", (event) => {
        pressed = true;
        lastX = event.offsetX;
        lastY = event.offsetY;
    });
    addEventListener("mousemove", (event) => {
        if (pressed) {
            let x0 = lastX;
            let y0 = lastY;
            let x1 = event.offsetX;
            let y1 = event.offsetY;

            let dx = Math.abs(x1 - x0);
            let sx = x0 < x1 ? 1 : -1;
            let dy = -Math.abs(y1 - y0);
            let sy = y0 < y1 ? 1 : -1;
            let error = dx + dy;

            while (true) {
                cells[y0 * canvasHeight + x0] = 255;

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

            lastX = event.offsetX;
            lastY = event.offsetY;
        }
    });
    addEventListener("mouseup", () => {
        pressed = false;
    });

    requestAnimationFrame(renderLoop);
}

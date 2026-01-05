use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Coordinate {
    pub x: i32,
    pub y: i32,
}

#[wasm_bindgen]
pub fn interpolate_line(mut x0: i32, mut y0: i32, x1: i32, y1: i32) -> Vec<Coordinate> {
    let dx = (x1 - x0).abs();
    let sx = if x0 < x1 { 1 } else { -1 };
    let dy = -(y1 - y0).abs();
    let sy = if y0 < y1 { 1 } else { -1 };
    let mut error = dx + dy;

    let mut line_coordinates = Vec::new();

    loop {
        line_coordinates.push(Coordinate { x: x0, y: y0 });

        if x0 == x1 && y0 == y1 {
            break;
        }
        let e2 = 2 * error;
        if e2 >= dy {
            if x0 == x1 {
                break;
            }
            error += dy;
            x0 += sx;
        }
        if e2 <= dx {
            if y0 == y1 {
                break;
            }
            error += dx;
            y0 += sy;
        }
    }

    line_coordinates
}

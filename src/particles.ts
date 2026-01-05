import { ParticleKind, ParticleState, SimulatorState, Index } from "./types";
import { choose } from "./utils";

export function createParticle(kind: ParticleKind): ParticleState {
  switch (kind) {
    case ParticleKind.Stone:
      return {
        kind,
        colour: choose(["#ddddddff", "#ccccccff", "#bbbbbbff", "#aaaaaaff"]),
      };
    case ParticleKind.Wood:
      return {
        kind,
        colour: choose(["#774400ff", "#663300ff", "#552200ff", "#441100ff"]),
      };
    case ParticleKind.Sand:
      return {
        kind,
        colour: choose(["#ffee00ff", "#eedd00ff", "#ddcc00ff", "#ccbb00ff"]),
      };
    case ParticleKind.Water:
      return {
        kind,
        colour: choose(["#0000ffff", "#0000eeff", "#0000ddff", "#0000ccff"]),
      };
    case ParticleKind.Acid:
      return {
        kind,
        colour: choose(["#00ff00ff", "#00ee00ff", "#00dd00ff", "#00cc00ff"]),
      };
    case ParticleKind.Fire:
      return {
        kind,
        colour: choose(["#ff6600ff", "#ee5500ff", "#dd4400ff", "#cc3300ff"]),
        canSpread: false,
        hasSpread: false,
      };
    case ParticleKind.Lava:
      return {
        kind,
        colour: choose(["#dd3300ff", "#cc2200ff", "#bb1100ff", "#aa0000ff"]),
      };
    default:
      throw new Error(`Unknown particle kind: ${kind}`);
  }
}

function getDensity(kind: ParticleKind): number {
  switch (kind) {
    case ParticleKind.Stone:
    case ParticleKind.Wood:
    case ParticleKind.Sand:
      return 1;
    case ParticleKind.Lava:
    case ParticleKind.Water:
      return 0.5;
    case ParticleKind.Acid:
    case ParticleKind.Fire:
      return 0;
  }
}

export function isFlammable(kind: ParticleKind): boolean {
  switch (kind) {
    case ParticleKind.Wood:
      return true;
    default:
      return false;
  }
}

function ignite(state: SimulatorState, x: number, y: number) {
  const index = state.toIndex(x, y);

  if (!state.cells[index] || !isFlammable(state.cells[index].kind)) {
    return false;
  }

  state.cells[index] = createParticle(ParticleKind.Fire);
  state.updateCells.push([x, y]);

  return true;
}

function spreadFire(
  state: SimulatorState,
  particle: ParticleState,
  x: number,
  y: number
) {
  const possibleLocations: Index[] = [];

  particle.canSpread = false;

  for (
    let nextY = Math.max(0, y - 1);
    nextY <= Math.min(state.height - 1, y + 1);
    nextY++
  ) {
    for (
      let nextX = Math.max(0, x - 1);
      nextX <= Math.min(state.width - 1, x + 1);
      nextX++
    ) {
      const nextParticle = state.getParticle(nextX, nextY);
      if (nextParticle && isFlammable(nextParticle.kind)) {
        particle.canSpread = true;
      }
      possibleLocations.push([nextX, nextY]);
    }
  }

  if (Math.random() < 0.1) {
    return [choose(possibleLocations)];
  }

  return [];
}

const spreadDust = (state: SimulatorState, x: number, y: number) => {
  const possibleLocations: Index[] = [];

  const down: Index = [x, y + 1];
  const downLeft: Index = [x - 1, y + 1];
  const downRight: Index = [x + 1, y + 1];

  const hasDown = y < state.height - 1;
  const hasLeft = x > 0;
  const hasRight = x < state.width - 1;

  if (hasDown) {
    possibleLocations.push(down);

    if (hasLeft && hasRight) {
      if (Math.random() < 0.5) {
        possibleLocations.push(downLeft);
      } else {
        possibleLocations.push(downRight);
      }
    } else if (hasLeft) {
      possibleLocations.push(downLeft);
    } else if (hasRight) {
      possibleLocations.push(downRight);
    }
  }

  possibleLocations.push([x, y]);

  return possibleLocations;
};

function spreadLiquid(state: SimulatorState, x: number, y: number) {
  const possibleLocations: Index[] = [];

  const down: Index = [x, y + 1];
  const left: Index = [x - 1, y];
  const right: Index = [x + 1, y];
  const downLeft: Index = [x - 1, y + 1];
  const downRight: Index = [x + 1, y + 1];

  const hasDown = y < state.height - 1;
  const hasLeft = x > 0;
  const hasRight = x < state.width - 1;

  if (hasDown) {
    possibleLocations.push(down);

    if (hasLeft && hasRight) {
      if (Math.random() < 0.5) {
        possibleLocations.push(downLeft);
      } else {
        possibleLocations.push(downRight);
      }
    } else if (hasLeft) {
      possibleLocations.push(downLeft);
    } else if (hasRight) {
      possibleLocations.push(downRight);
    }
  }

  if (hasLeft && hasRight) {
    if (Math.random() < 0.5) {
      possibleLocations.push(left);
    } else {
      possibleLocations.push(right);
    }
  } else if (hasLeft) {
    possibleLocations.push(left);
  } else if (hasRight) {
    possibleLocations.push(right);
  }

  possibleLocations.push([x, y]);

  return possibleLocations;
}

export function spreadParticle(
  state: SimulatorState,
  particle: ParticleState,
  x: number,
  y: number
) {
  switch (particle.kind) {
    case ParticleKind.Fire:
      return spreadFire(state, particle, x, y);
    case ParticleKind.Sand:
      return spreadDust(state, x, y);
    case ParticleKind.Acid:
    case ParticleKind.Water:
    case ParticleKind.Lava:
      return spreadLiquid(state, x, y);
    default:
      return [];
  }
}

function moveDefault(
  state: SimulatorState,
  x: number,
  y: number,
  nextX: number,
  nextY: number
) {
  const startIndex = state.toIndex(x, y);
  const endIndex = state.toIndex(nextX, nextY);

  const startParticle = state.cells[startIndex];
  const endParticle = state.cells[endIndex];

  if (
    startParticle == null ||
    endParticle === null ||
    getDensity(endParticle.kind) < getDensity(startParticle.kind)
  ) {
    state.cells[startIndex] = endParticle;
    state.cells[endIndex] = startParticle;

    state.updateCells.push([x, y]);
    state.updateCells.push([nextX, nextY]);

    return true;
  }

  return false;
}

function moveWater(
  state: SimulatorState,
  x: number,
  y: number,
  nextX: number,
  nextY: number
) {
  const startIndex = state.toIndex(x, y);
  const endIndex = state.toIndex(nextX, nextY);

  const startParticle = state.cells[startIndex];
  const endParticle = state.cells[endIndex];

  if (endParticle?.kind === ParticleKind.Fire) {
    state.cells[startIndex] = null;
    state.cells[endIndex] = startParticle;

    state.updateCells.push([x, y]);
    state.updateCells.push([nextX, nextY]);
  } else if (endParticle?.kind === ParticleKind.Lava) {
    state.cells[endIndex] = createParticle(ParticleKind.Stone);
    state.updateCells.push([nextX, nextY]);
  } else if (
    startParticle == null ||
    endParticle === null ||
    getDensity(endParticle.kind) < getDensity(startParticle.kind)
  ) {
    state.cells[startIndex] = endParticle;
    state.cells[endIndex] = startParticle;

    state.updateCells.push([x, y]);
    state.updateCells.push([nextX, nextY]);
  } else {
    return false;
  }

  return true;
}

function moveAcid(
  state: SimulatorState,
  x: number,
  y: number,
  nextX: number,
  nextY: number
) {
  const startIndex = state.toIndex(x, y);
  const endIndex = state.toIndex(nextX, nextY);

  const startParticle = state.cells[startIndex];
  const endParticle = state.cells[endIndex];

  if (endParticle?.kind !== ParticleKind.Acid) {
    if (Math.random() < 0.02) {
      state.cells[startIndex] = null;

      if (state.cells[endIndex] !== null && Math.random() < 0.8) {
        state.cells[endIndex] = null;
      } else {
        state.cells[endIndex] = startParticle;
      }

      state.updateCells.push([x, y]);
      state.updateCells.push([nextX, nextY]);

      return true;
    }

    if (endParticle === null) {
      state.cells[startIndex] = endParticle;
      state.cells[endIndex] = startParticle;

      state.updateCells.push([x, y]);
      state.updateCells.push([nextX, nextY]);

      return true;
    }
  }

  return false;
}

function moveLava(
  state: SimulatorState,
  x: number,
  y: number,
  nextX: number,
  nextY: number
) {
  const startIndex = state.toIndex(x, y);
  const endIndex = state.toIndex(nextX, nextY);

  const startParticle = state.cells[startIndex];
  const endParticle = state.cells[endIndex];

  if (endParticle === null) {
    state.cells[startIndex] = endParticle;
    state.cells[endIndex] = startParticle;

    state.updateCells.push([x, y]);
    state.updateCells.push([nextX, nextY]);
  } else if (endParticle?.kind === ParticleKind.Water) {
    state.cells[startIndex] = createParticle(ParticleKind.Stone);
    state.updateCells.push([x, y]);
  } else if (Math.random() < 0.02) {
    ignite(state, nextX, nextY);
    state.updateCells.push([nextX, nextY]);
  } else {
    return false;
  }

  return true;
}

function moveFire(
  state: SimulatorState,
  x: number,
  y: number,
  nextX: number,
  nextY: number
) {
  const startIndex = state.toIndex(x, y);
  const particle = state.cells[startIndex]!;

  if (ignite(state, nextX, nextY)) {
    particle.hasSpread = true;
  }

  particle.canSpread = particle.canSpread ?? false;
  particle.hasSpread = particle.hasSpread ?? false;

  const getSnuffChance = () => {
    if (particle.canSpread) {
      return 0;
    }

    if (particle.hasSpread) {
      return 1;
    }

    return 0.9;
  };

  if (Math.random() < getSnuffChance()) {
    state.cells[startIndex] = null;
    state.updateCells.push([x, y]);
  }

  return true;
}

export function moveParticle(
  state: SimulatorState,
  particle: ParticleState,
  x: number,
  y: number,
  nextX: number,
  nextY: number
) {
  switch (particle.kind) {
    case ParticleKind.Water:
      return moveWater(state, x, y, nextX, nextY);
    case ParticleKind.Acid:
      return moveAcid(state, x, y, nextX, nextY);
    case ParticleKind.Lava:
      return moveLava(state, x, y, nextX, nextY);
    case ParticleKind.Fire:
      return moveFire(state, x, y, nextX, nextY);
    default:
      return moveDefault(state, x, y, nextX, nextY);
  }
}

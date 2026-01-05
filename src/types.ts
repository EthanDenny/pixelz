export type Index = [number, number];

export enum ParticleKind {
  Stone = "Stone",
  Wood = "Wood",
  Sand = "Sand",
  Water = "Water",
  Acid = "Acid",
  Fire = "Fire",
  Lava = "Lava",
}

export type ParticleState = {
  kind: ParticleKind;
  colour: string;
  canSpread?: boolean;
  hasSpread?: boolean;
};

export class SimulatorState {
  cells: (ParticleState | null)[];
  updateCells: Index[];
  width: number;
  height: number;

  constructor() {
    this.cells = [];
    this.updateCells = [];
    this.width = 0;
    this.height = 0;
  }

  toIndex(x: number, y: number) {
    return y * this.width + x;
  }

  getParticle(x: number, y: number) {
    return this.cells[this.toIndex(x, y)];
  }
}

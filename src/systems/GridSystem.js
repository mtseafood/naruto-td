import { GRID_COLS, GRID_ROWS, CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from '../data/maps.js';

export class GridSystem {
  constructor(pathCells) {
    this.cols = GRID_COLS;
    this.rows = GRID_ROWS;
    this.cell = CELL_SIZE;
    this.ox = GRID_OFFSET_X;
    this.oy = GRID_OFFSET_Y;

    // grid[row][col] = null | Ninja
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));

    this.pathSet = new Set(pathCells.map(([c, r]) => `${c},${r}`));
  }

  isPath(col, row) { return this.pathSet.has(`${col},${row}`); }
  isOccupied(col, row) { return !!this.grid[row]?.[col]; }
  getNinja(col, row) { return this.grid[row]?.[col] ?? null; }

  placeNinja(col, row, ninja) { this.grid[row][col] = ninja; }
  removeNinja(col, row) { this.grid[row][col] = null; }

  // Pixel center of a cell
  cellCenter(col, row) {
    return {
      x: this.ox + col * this.cell + this.cell / 2,
      y: this.oy + row * this.cell + this.cell / 2,
    };
  }

  // Convert pixel to grid coords (-1 if outside)
  pixelToGrid(px, py) {
    const col = Math.floor((px - this.ox) / this.cell);
    const row = Math.floor((py - this.oy) / this.cell);
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return null;
    return { col, row };
  }

  isValidPlacement(col, row) {
    return !this.isPath(col, row) && !this.isOccupied(col, row);
  }
}

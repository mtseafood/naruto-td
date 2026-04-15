// Grid & map layout definitions
// Three distinct path shapes assigned to different levels

export const GRID_COLS = 7;
export const GRID_ROWS = 10;
export const CELL_SIZE = 55;
export const GRID_OFFSET_X = 15;
export const GRID_OFFSET_Y = 55;
export const GRID_RIGHT = GRID_OFFSET_X + GRID_COLS * CELL_SIZE; // 400

function cx(col) { return GRID_OFFSET_X + col * CELL_SIZE + CELL_SIZE / 2; }
function cy(row) { return GRID_OFFSET_Y + row * CELL_SIZE + CELL_SIZE / 2; }

export const MAP_LAYOUTS = [
  // ── 0: S-Shape (levels 1-3, 10) ──────────────────────────
  {
    name: 'S 型路線',
    waypoints: [
      { x: GRID_RIGHT + 35, y: cy(0) },
      { x: cx(0), y: cy(0) },
      { x: cx(0), y: cy(5) },
      { x: cx(6), y: cy(5) },
      { x: cx(6), y: cy(9) },
      { x: cx(0), y: cy(9) },
      { x: -40,   y: cy(9) },
    ],
    pathCells: [
      [0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],
      [0,1],[0,2],[0,3],[0,4],[0,5],
      [1,5],[2,5],[3,5],[4,5],[5,5],[6,5],
      [6,6],[6,7],[6,8],[6,9],
      [0,9],[1,9],[2,9],[3,9],[4,9],[5,9],
    ],
  },

  // ── 1: U-Shape (levels 4-6) ─ enter left, loop right, exit left
  {
    name: 'U 型路線',
    waypoints: [
      { x: -40,   y: cy(1) },
      { x: cx(0), y: cy(1) },
      { x: cx(6), y: cy(1) },
      { x: cx(6), y: cy(8) },
      { x: cx(0), y: cy(8) },
      { x: -40,   y: cy(8) },
    ],
    pathCells: [
      [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],
      [6,2],[6,3],[6,4],[6,5],[6,6],[6,7],[6,8],
      [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],
    ],
  },

  // ── 2: Maze / Double-Z (levels 7-9) ─ complex winding path
  {
    name: '迷宮路線',
    waypoints: [
      { x: GRID_RIGHT + 35, y: cy(0) },
      { x: cx(0), y: cy(0) },
      { x: cx(0), y: cy(4) },
      { x: cx(6), y: cy(4) },
      { x: cx(6), y: cy(7) },
      { x: cx(2), y: cy(7) },
      { x: cx(2), y: cy(9) },
      { x: -40,   y: cy(9) },
    ],
    pathCells: [
      [0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],
      [0,1],[0,2],[0,3],[0,4],
      [1,4],[2,4],[3,4],[4,4],[5,4],[6,4],
      [6,5],[6,6],[6,7],
      [2,7],[3,7],[4,7],[5,7],
      [2,8],[2,9],
      [0,9],[1,9],
    ],
  },

  // ── 3: Spiral (level 10) ─ spiral inward then exit right
  {
    name: '螺旋路線',
    waypoints: [
      { x: -40,              y: cy(0) },
      { x: cx(6),            y: cy(0) },
      { x: cx(6),            y: cy(9) },
      { x: cx(0),            y: cy(9) },
      { x: cx(0),            y: cy(3) },
      { x: cx(5),            y: cy(3) },
      { x: cx(5),            y: cy(6) },
      { x: GRID_RIGHT + 35,  y: cy(6) },
    ],
    pathCells: [
      // Row 0 (enter left → right)
      [0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],
      // Col 6 (down)
      [6,1],[6,2],[6,3],[6,4],[6,5],[6,6],[6,7],[6,8],[6,9],
      // Row 9 (left)
      [0,9],[1,9],[2,9],[3,9],[4,9],[5,9],
      // Col 0 (up to row 3)
      [0,3],[0,4],[0,5],[0,6],[0,7],[0,8],
      // Row 3 (right to col 5)
      [1,3],[2,3],[3,3],[4,3],[5,3],
      // Col 5 (down to row 6)
      [5,4],[5,5],[5,6],
      // Row 6 (right → exit)
      [2,6],[3,6],[4,6],
    ],
  },
];

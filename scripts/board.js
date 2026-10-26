const BOARD_SIZE = 8;
let grid = [];

const createEmptyGrid = () => {
  grid = Array.from({ length: BOARD_SIZE }, () => new Array(BOARD_SIZE).fill(0));
};
const renderBoard = () => {
  const boardEl = document.getElementById("board");
  boardEl.innerHTML = "";

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cellEl = document.createElement("div");
      cellEl.classList.add("cell");
      cellEl.dataset.row = row;
      cellEl.dataset.col = col;

      if (grid[row][col] === 1) {
        cellEl.classList.add("filled");
      }

      boardEl.appendChild(cellEl);
    }
  }
};

const canPlaceShape = (shape, startRow, startCol) => {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] === 0) continue;

      const boardRow = startRow + r;
      const boardCol = startCol + c;

      if (
        boardRow < 0 || boardRow >= BOARD_SIZE ||
        boardCol < 0 || boardCol >= BOARD_SIZE
      ) {
        return false;
      }

      if (grid[boardRow][boardCol] === 1) {
        return false;
      }
    }
  }
  return true;
};

const placeShape = (shape, startRow, startCol) => {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] === 1) {
        grid[startRow + r][startCol + c] = 1;
      }
    }
  }
};

const clearFullLines = () => {
  const fullRows = [];
  const fullCols = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    if (grid[row].every((cell) => cell === 1)) {
      fullRows.push(row);
    }
  }

  for (let col = 0; col < BOARD_SIZE; col++) {
    let colFull = true;
    for (let row = 0; row < BOARD_SIZE; row++) {
      if (grid[row][col] === 0) {
        colFull = false;
        break;
      }
    }
    if (colFull) fullCols.push(col);
  }

  fullRows.forEach((row) => {
    grid[row] = new Array(BOARD_SIZE).fill(0);
  });

  fullCols.forEach((col) => {
    for (let row = 0; row < BOARD_SIZE; row++) {
      grid[row][col] = 0;
    }
  });

  return fullRows.length + fullCols.length;
};


const isAnyPlacementPossible = (shapesArray) => {
  for (const shape of shapesArray) {
    if (!shape) continue;
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (canPlaceShape(shape, row, col)) {
          return true;
        }
      }
    }
  }
  return false;
};

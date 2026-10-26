const SHAPES = [
  [[1]],
  [[1, 1]],
  [[1, 1, 1]],
  [[1, 1, 1, 1]],
  [[1], [1], [1]],
  [[1, 1], [1, 1]],
  [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
  [[1, 0], [1, 0], [1, 0]],
  [[1, 0], [1, 0], [1, 1]],
  [[0, 1], [0, 1], [1, 1]],
  [[1, 1, 1], [1, 0, 0]],
  [[1, 1, 1], [0, 0, 1]],
  [[1, 1, 1], [0, 1, 0]],
  [[0, 1, 0], [1, 1, 1]]
];

const getRandomShape = () => {
  const index = Math.floor(Math.random() * SHAPES.length);
  return JSON.parse(JSON.stringify(SHAPES[index]));
};

const generateThreeShapes = () => [
  getRandomShape(),
  getRandomShape(),
  getRandomShape()
];

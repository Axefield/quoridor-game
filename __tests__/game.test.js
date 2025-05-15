const Game = require('../quoridor.js');

describe('Game movement', () => {
  let game;

  beforeEach(() => {
    game = new Game();
  });

  test('Should allow white pawn to move forward when no obstacles are present', () => {
    const origin = [0, 8];
    const destination = [2, 8];
    const result = game.movePawn(destination);
    expect(result.success).toBe(true);
    expect(game.board[origin[0]][origin[1]].occupiedBy).toBe(null);
    expect(game.board[destination[0]][destination[1]].occupiedBy).toBe('white');
    expect(game.whitePos).toEqual(destination);
    expect(game.turn).toBe('black');
  });

  test('Should allow wall placement when no obstacles are present, and player has walls remaining', () => {
    const destinationSlotVertical = [0, 3];
    const destinationSlotHorizontal = [1,0];
    const resultVertical = game.placeWall(...destinationSlotVertical);
    const resultHorizontal = game.placeWall(...destinationSlotHorizontal);
    expect(resultVertical.success).toBe(true);
    expect(resultHorizontal.success).toBe(true);
    expect(game.board[destinationSlotVertical[0]][destinationSlotVertical[1]].occupiedBy).toBe('wall');
    expect(game.board[destinationSlotHorizontal[0]][destinationSlotHorizontal[1]].occupiedBy).toBe('wall');
    expect(game.whiteWalls).toBe(9);
    expect(game.blackWalls).toBe(9);
    expect(game.turn).toBe('white');
  });

  test('Should not allow wall placement if player has no walls remaining', () => {
    const wallLocation = [0, 3];
    game.whiteWalls = 0;
    const result = game.placeWall(...wallLocation);
    expect(result.success).toBe(false);
    expect(game.whiteWalls).toBe(0);
    expect(game.turn).toBe('white');
  });

  test('Should not allow placement of walls in pawn cells', () => {
    const pawnCellLocation = [0,0];
    const result = game.placeWall(...pawnCellLocation);
    expect(result.success).toBe(false);
    expect(game.turn).toBe('white');
    expect(game.whiteWalls).toBe(10);
  });

  test('Should not allow placement of walls outside the boundary of the board', () => {
    const tooFarTop = [16, 0]
    const tooFarBottom = [0, 0];
    const tooFarLeft = [0, 0];
    const tooFarRight = [0, 16];
    const resultTop = game.placeWall(...tooFarTop);
    expect(game.turn).toBe('white');
    const resultBottom = game.placeWall(...tooFarBottom);
    expect(game.turn).toBe('white');
    const resultLeft = game.placeWall(...tooFarLeft);
    expect(game.turn).toBe('white');
    const resultRight = game.placeWall(...tooFarRight);
    expect(game.turn).toBe('white');
    expect(resultTop.success).toBe(false);
    expect(resultBottom.success).toBe(false);
    expect(resultLeft.success).toBe(false);
    expect(resultRight.success).toBe(false);
    expect(game.whiteWalls).toBe(10);
    expect(game.blackWalls).toBe(10);
  });

  test('Should not allow placement of walls when obstacles are present', () => {
    game.placeWall(0, 1);
    const result = game.placeWall(0,1);
    expect(result.success).toBe(false);
    expect(game.turn).toBe('black');
    expect(game.whiteWalls).toBe(9);
  });

  test('Should jump over unblocked pawns if enough space is available', () => {
    game.whitePos = [6,8];
    game.blackPos = [8, 8];
    game.board[6][8].occupiedBy = 'white';
    game.board[0][8].occupiedBy = null;
    game.board[8][8].occupiedBy ='black';
    game.board[16][8].occupiedBy = null;

    const result = game.movePawn([8,8]);
    expect(result.success).toBe(true);
    expect(game.whitePos).toEqual([10,8]);
    expect(game.turn).toBe('black');
    const moveBlackUpResult = game.movePawn([10,8]);
    expect(moveBlackUpResult.success).toBe(true);
    expect(game.turn).toBe('white');
    expect(game.blackPos).toEqual([12,8]);

  });
});
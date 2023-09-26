export type GameStatus = {
  screenWidth: number;
  screenHeight: number;
  ballRadius: number;
  ball: {
    x: number;
    y: number;
  };
  playerLeft: {
    x: number;
    y: number;
  };
  playerRight: {
    x: number;
    y: number;
  };
  playerHeight: number;
  playerWidth: number;
};

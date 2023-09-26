export type MatchStatus = 'LEFT_WON' | 'RIGHT_WON' | 'RUNNING';

export type GameStatus = {
    screenWidth: number;
    screenHeight: number;
    ballRadius: number;
    ball: {
        x: number;
        y: number;
    };
    playerLeft: {
        y: number;
    };
    playerRight: {
        y: number;
    };
    playerHeight: number;
    playerWidth: number;
    status: MatchStatus;
};

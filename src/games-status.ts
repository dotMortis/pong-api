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
        id?: string;
        name?: string;
        y: number;
    };
    playerRight: {
        id?: string;
        name?: string;
        y: number;
    };
    playerHeight: number;
    playerWidth: number;
    status: MatchStatus;
};

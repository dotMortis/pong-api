import express, { NextFunction, Request, Response } from 'express';
import { createServer } from 'http';
import WebSocket from 'ws';
import { gameEventHandler } from './game-event';
import { mainRouter } from './router';

const callers = new Map<string, 'LEFT' | 'RIGHT'>();

const app = express();
const server = createServer(app);

app.use(
    express.json({
        type: 'application/json'
    })
);

app.use(mainRouter);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    res.status(500).json(err);
});

server.listen(8080, '0.0.0.0', () => {
    console.log('Server started on port 8080');
});

app.post('/start', (req, res, next) => {
    const { CallerID }: { CallerID: string } = req.body;
    if (CallerID == null) return next(new Error('Where CallerID?'));
    if (callers.size < 2) {
        const firstCaller = Array.from(callers)[0];
        if (firstCaller != null) {
            if (firstCaller[1] === 'LEFT') callers.set(String(CallerID), 'RIGHT');
            else callers.set(String(CallerID), 'LEFT');
        } else {
            callers.set(String(CallerID), 'RIGHT');
        }
    }
    return res.status(200).json({ status: 'OGOG' });
});

app.post('/stop', (req, res, next) => {
    const { CallerID }: { CallerID: string } = req.body;
    if (CallerID == null) return next(new Error('Where CallerID?'));
    const caller = callers.get(String(CallerID));
    if (!caller) return next(new Error('You are not a player Huh'));
    callers.delete(String(CallerID));
    return res.status(200).json({ status: 'Bye' });
});

app.post('/input', (req, res) => {
    return res.send('Received a POST HTTP method');
});

let clients: WebSocket[] = [];

const wss = new WebSocket.Server({ port: 8090, host: '0.0.0.0' });
console.log('Websocket started on port 8090');

wss.on('connection', (ws: WebSocket) => {
    console.log('New client connected');
    clients.push(ws);

    ws.on('message', (message: string) => {
        console.log(`Received message: ${message}`);
        ws.send(`Server received your message: ${message}`);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        clients = clients.filter(function (el) {
            return el != ws;
        });
    });
});

const screenWidth = 1000;
const screenHeight = 750;
const ballRadius = 2;
const playerWidth = 5;
const fps = 10;
const dt = 1 / fps; //delta time
//new ball = ballSpeed * dt
const ballSpeed = {
    x: Math.random(),
    y: 2 * Math.random() - 1,
    base: 1000
};
const ballPos = {
    x: screenWidth / 2,
    y: screenHeight / 2
};
let currentDir: 'LEFT' | 'RIGHT' = 'LEFT';

const playerHeight = 250;
const playerStep = 50;
const maxPlayerY = screenHeight - playerHeight;
const minPlayerY = 0;
let playerLeftY = -playerHeight / 2;
let playerRightY = -playerHeight / 2;

const playerLeftMove = (dir: 'up' | 'down') => {
    if (dir === 'up' && playerLeftY < maxPlayerY) {
        playerLeftY += playerStep;
        if (playerLeftY > maxPlayerY) playerLeftY = maxPlayerY;
    } else if (playerLeftY > minPlayerY) {
        playerLeftY -= playerStep;
        if (playerLeftY < minPlayerY) playerLeftY = minPlayerY;
    }
};

const playerRightMove = (dir: 'up' | 'down') => {
    if (dir === 'up' && playerRightY < maxPlayerY) {
        playerRightY += playerStep;
        if (playerRightY > maxPlayerY) playerRightY = maxPlayerY;
    } else if (playerRightY > minPlayerY) {
        playerRightY -= playerStep;
        if (playerRightY < minPlayerY) playerRightY = minPlayerY;
    }
};

const isSaveSaveY = (ballPosY: number, playerPosY: number): boolean => {
    if (
        ballPosY - ballRadius >= playerPosY + playerHeight &&
        playerPosY + playerHeight < maxPlayerY
    ) {
        return false;
    } else if (ballPosY + ballRadius <= playerPosY && playerPosY > minPlayerY) {
        return false;
    }
    return true;
};
let running = false;
const startGame = async (): Promise<void> => {
    if (running) return;
    running = true;
    while (running) {
        running = tick();
        await new Promise<void>(res => setTimeout(() => res(), 1000 / fps));
    }
};
const stopGame = (): void => {
    running = false;
};
const tick = (): boolean => {
    ballPos.y += ballSpeed.base * ballSpeed.y * dt;
    if (ballPos.y + ballRadius >= screenHeight || ballPos.y <= 0) {
        ballSpeed.y *= -1;
    }
    if (currentDir === 'LEFT') {
        ballPos.x -= dt * (ballSpeed.base * ballSpeed.x);
        if (ballPos.x <= 0) {
            if (isSaveSaveY(ballPos.y, playerLeftY)) {
                ballPos.x = playerWidth;
                currentDir = 'RIGHT';
            } else {
                gameEventHandler.sendStatus({
                    ball: {
                        x: ballPos.x,
                        y: ballPos.y
                    },
                    ballRadius,
                    playerHeight,
                    playerLeft: {
                        y: playerLeftY
                    },
                    playerRight: {
                        y: playerRightY
                    },
                    playerWidth,
                    screenHeight,
                    screenWidth,
                    status: 'RIGHT_WON'
                });
                return false;
            }
        }
    } else {
        ballPos.x += dt * (ballSpeed.base * ballSpeed.x);
        if (ballPos.x >= screenWidth) {
            if (isSaveSaveY(ballPos.y, playerRightY)) {
                ballPos.x = screenWidth - playerWidth;
                currentDir = 'LEFT';
            } else {
                gameEventHandler.sendStatus({
                    ball: {
                        x: ballPos.x,
                        y: ballPos.y
                    },
                    ballRadius,
                    playerHeight,
                    playerLeft: {
                        y: playerLeftY
                    },
                    playerRight: {
                        y: playerRightY
                    },
                    playerWidth,
                    screenHeight,
                    screenWidth,
                    status: 'LEFT_WON'
                });
                return false;
            }
        }
    }
    gameEventHandler.sendStatus({
        ball: {
            x: ballPos.x,
            y: ballPos.y
        },
        ballRadius,
        playerHeight,
        playerLeft: {
            y: playerLeftY
        },
        playerRight: {
            y: playerRightY
        },
        playerWidth,
        screenHeight,
        screenWidth,
        status: 'RUNNING'
    });
    return true;
};

gameEventHandler.onStatus(s => {
    console.log(s);
    //send to socket clients
});

startGame();

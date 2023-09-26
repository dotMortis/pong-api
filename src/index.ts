import express, { NextFunction, Request, Response } from 'express';
import { createServer } from 'http';
import WebSocket from 'ws';
import { gameEventHandler } from './game-event';
import { InputFromStarfacePbx } from './input';
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

// POST ->
app.post('/input', (req, res) => {
    console.log('POST input ', req.query);
    const untyped: any = req.query;
    const input: InputFromStarfacePbx = untyped;
    input.action = 'input';
    didReceiveInputFromPbx(input);
    return res.send('Received a POST HTTP method');
});

// POST <-

// GET ->

app.get('/start', (req, res) => {
    console.log('GET start ', req.query);
    const untyped: any = req.query;
    const input: InputFromStarfacePbx = untyped;
    input.action = 'start';
    didReceiveInputFromPbx(input);
    return res.send('Received a GET HTTP method' + JSON.stringify(input));
});

app.get('/stop', (req, res) => {
    console.log('GET stop ', req.query);
    const untyped: any = req.query;
    const input: InputFromStarfacePbx = untyped;
    input.action = 'stop';
    didReceiveInputFromPbx(input);
    return res.send('Received a GET HTTP method' + JSON.stringify(input));
});

app.get('/input', (req, res) => {
    console.log('GET input ', req.query);
    const untyped: any = req.query;
    const input: InputFromStarfacePbx = untyped;
    input.action = 'input';
    didReceiveInputFromPbx(input);
    return res.send('Received a GET HTTP method' + JSON.stringify(input));
});

// GET <-

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
const screenHeight = 600;
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
    setTimeout(
        () => {
            ballPos.x = screenWidth / 2;
            ballPos.y = screenHeight / 2;
            ballSpeed.x = Math.random();
            ballSpeed.y = 2 * Math.random() - 1;
            playerLeftY = -playerHeight / 2;
            playerRightY = -playerHeight / 2;
            currentDir = 'LEFT';
        },
        (1000 / fps) * 4
    );
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
    //console.log(s);
    //send to socket clients
    clients.forEach(ws => {
        ws.send(JSON.stringify(s));
    });
});

startGame();

function didReceiveInputFromPbx(input: InputFromStarfacePbx) {
    if (input.action === 'start') addCaller(input);
    else if (input.action === 'stop') deleteCaller(input);
    else if (input.action === 'input') moveSomething(input);
    else throw new Error('Unkonw action ' + input.action);
}

const addCaller = (input: InputFromStarfacePbx) => {
    const { CallerID } = input;
    if (CallerID == null) throw new Error('Where CallerID?');
    if (callers.size < 2) {
        const firstCaller = Array.from(callers)[0];
        if (firstCaller != null) {
            if (firstCaller[0] === String(CallerID)) throw new Error('You are already a player');
            if (firstCaller[1] === 'LEFT') callers.set(String(CallerID), 'RIGHT');
            else callers.set(String(CallerID), 'LEFT');
            startGame();
        } else {
            callers.set(String(CallerID), 'RIGHT');
        }
    }
};

const deleteCaller = (input: InputFromStarfacePbx) => {
    const { CallerID } = input;
    if (CallerID == null) throw new Error('Where CallerID?');
    const caller = callers.get(String(CallerID));
    if (!caller) throw new Error('You are not a player Huh');
    callers.delete(String(CallerID));
    stopGame();
};

const moveSomething = (input: InputFromStarfacePbx) => {
    const { CallerID, DTMF } = input;
    const caller = callers.get(CallerID);
    if (!caller) throw new Error('Dont know you Mr ' + CallerID);
    const moveAction = caller === 'LEFT' ? playerLeftMove : playerRightMove;
    switch (DTMF) {
        case '1':
        case '2':
        case '3': {
            moveAction('up');
            break;
        }
        case '7':
        case '8':
        case '9': {
            moveAction('down');
            break;
        }
        default:
            throw new Error('Unkown DTMF ' + DTMF);
    }
};

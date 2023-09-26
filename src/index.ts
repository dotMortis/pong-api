import express, { NextFunction, Request, Response } from 'express';
import { createServer } from 'http';
import WebSocket from 'ws';
import { gameEventHandler } from './game-event';
import { InputFromStarfacePbx } from './input';
import { mainRouter } from './router';

const callers = new Map<string, 'LEFT' | 'RIGHT'>();
const callersDir = new Map<'LEFT' | 'RIGHT', { id: string; name: string }>();

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
    const untyped: any = req.query;
    const input: InputFromStarfacePbx = untyped;
    input.action = 'input';
    didReceiveInputFromPbx(input);
    return res.send('Received a POST HTTP method');
});

// POST <-

// GET ->

app.get('/debug', (req, res) => {
    startGame();
    return res.send('Received a GET HTTP metho DEBUG');
});

app.get('/start', (req, res) => {
    const untyped: any = req.query;
    const input: InputFromStarfacePbx = untyped;
    input.action = 'start';
    didReceiveInputFromPbx(input);
    return res.send('Received a GET HTTP method' + JSON.stringify(input));
});

app.get('/stop', (req, res) => {
    const untyped: any = req.query;
    const input: InputFromStarfacePbx = untyped;
    input.action = 'stop';
    didReceiveInputFromPbx(input);
    return res.send('Received a GET HTTP method' + JSON.stringify(input));
});

app.get('/input', (req, res) => {
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
const screenHeight = 750;
const ballRadius = 15;
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
let playerLeftY = screenHeight / 2 - playerHeight / 2;
let playerRightY = screenHeight / 2 - playerHeight / 2;

const playerLeftMove = (dir: 'up' | 'down') => {
    console.log('player left move', dir, playerLeftY);
    if (dir === 'up' && playerLeftY < maxPlayerY) {
        playerLeftY += playerStep;
        if (playerLeftY > maxPlayerY) playerLeftY = maxPlayerY;
    } else if (playerLeftY > minPlayerY) {
        playerLeftY -= playerStep;
        if (playerLeftY < minPlayerY) playerLeftY = minPlayerY;
    }
    console.log('player left pos new', playerLeftY);
};

const playerRightMove = (dir: 'up' | 'down') => {
    console.log('player right move', dir, playerRightY);
    if (dir === 'up' && playerRightY < maxPlayerY) {
        playerRightY += playerStep;
        if (playerRightY > maxPlayerY) playerRightY = maxPlayerY;
    } else if (playerRightY > minPlayerY) {
        playerRightY -= playerStep;
        if (playerRightY < minPlayerY) playerRightY = minPlayerY;
    }
    console.log('player right pos new', playerRightY);
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
    stopGame();
};
const stopGame = (): void => {
    running = false;
    setTimeout(
        () => {
            ballPos.x = screenWidth / 2;
            ballPos.y = screenHeight / 2;
            ballSpeed.x = Math.random();
            ballSpeed.y = 2 * Math.random() - 1;
            playerLeftY = screenHeight / 2 - playerHeight / 2;
            playerRightY = screenHeight / 2 - playerHeight / 2;
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
                        y: playerLeftY,
                        id: callersDir.get('LEFT')?.id,
                        name: callersDir.get('LEFT')?.name
                    },
                    playerRight: {
                        y: playerRightY,
                        id: callersDir.get('RIGHT')?.id,
                        name: callersDir.get('RIGHT')?.name
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
                        y: playerLeftY,
                        id: callersDir.get('LEFT')?.id,
                        name: callersDir.get('LEFT')?.name
                    },
                    playerRight: {
                        y: playerRightY,
                        id: callersDir.get('RIGHT')?.id,
                        name: callersDir.get('RIGHT')?.name
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
            y: playerLeftY,
            id: callersDir.get('LEFT')?.id,
            name: callersDir.get('LEFT')?.name
        },
        playerRight: {
            y: playerRightY,
            id: callersDir.get('RIGHT')?.id,
            name: callersDir.get('RIGHT')?.name
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

function didReceiveInputFromPbx(input: InputFromStarfacePbx) {
    if (input.action === 'start') addCaller(input);
    else if (input.action === 'stop') deleteCaller(input);
    else if (input.action === 'input') moveSomething(input);
    else throw new Error('Unkonw action ' + input.action);
}

const addCaller = (input: InputFromStarfacePbx) => {
    const { CallerID } = input;
    if (CallerID == null) throw new Error('Where CallerID?');
    console.log('addCaller', input, callers);
    if (callers.size < 2) {
        const firstCaller = Array.from(callers)[0];
        if (firstCaller != null) {
            if (firstCaller[0] === String(CallerID)) throw new Error('You are already a player');
            if (firstCaller[1] === 'LEFT') {
                callersDir.set('RIGHT', { id: String(CallerID), name: input.CallerName });
                callers.set(String(CallerID), 'RIGHT');
            } else {
                callersDir.set('LEFT', { id: String(CallerID), name: input.CallerName });
                callers.set(String(CallerID), 'LEFT');
            }
            startGame();
        } else {
            callersDir.set('RIGHT', { id: String(CallerID), name: input.CallerName });
            callers.set(String(CallerID), 'RIGHT');
        }
    }
};

const deleteCaller = (input: InputFromStarfacePbx) => {
    console.log('delete caller', input, callers);
    const { CallerID } = input;
    if (CallerID == null) throw new Error('Where CallerID?');
    const caller = callers.get(String(CallerID));
    if (!caller) throw new Error('You are not a player Huh');
    callers.delete(String(CallerID));
    callersDir.delete(caller);
    stopGame();
};

const moveSomething = (input: InputFromStarfacePbx) => {
    console.log('move', input);
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
            console.log('Unkown DTMF ' + DTMF);
    }
};

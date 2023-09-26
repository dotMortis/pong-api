import express, { NextFunction, Request, Response } from "express";
import { createServer } from "http";
import { mainRouter } from "./router";

const app = express();
const server = createServer(app);

app.use(
  express.json({
    type: "application/json",
  }),
);

app.use(mainRouter);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json(err);
});

server.listen(8080, () => {
  console.log("Server started on port 8080");
});

const screenWidth = 1000;
const screenHeight = 750;
const ballRadius = 2;
const playerWidth = 5;
const fps = 10;
const dt = 1 / fps; //delta time
//new ball = ballSpeed * dt
const ballSpeed = {
  x: 1,
  y: 1,
  base: 100,
};
const ballPos = {
  x: screenWidth / 2,
  y: screenHeight / 2,
};
let currentDir: "LEFT" | "RIGHT" = "LEFT";

const playerHeight = 250;
const playerStep = 50;
const maxPlayerY = screenHeight - playerHeight;
const minPlayerY = 0;
let playerLeftY = -playerHeight / 2;
let playerRightY = -playerHeight / 2;

const playerLeftMove = (dir: "up" | "down") => {
  if (dir === "up" && playerLeftY < maxPlayerY) {
    playerLeftY += playerStep;
    if (playerLeftY > maxPlayerY) playerLeftY = maxPlayerY;
  } else if (playerLeftY > minPlayerY) {
    playerLeftY -= playerStep;
    if (playerLeftY < minPlayerY) playerLeftY = minPlayerY;
  }
};

const playerRightMove = (dir: "up" | "down") => {
  if (dir === "up" && playerRightY < maxPlayerY) {
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

setInterval(() => {
  ballPos.y += ballSpeed.base * ballSpeed.y * dt;
  if (ballPos.y + ballRadius >= screenHeight || ballPos.y <= 0) {
    ballSpeed.y *= -1;
  }
  if (currentDir === "LEFT") {
    ballPos.x -= dt * (ballSpeed.base * ballSpeed.x);
    if (ballPos.x <= 0) {
      if (isSaveSaveY(ballPos.y, playerLeftY)) {
        ballPos.x += playerWidth;
        currentDir = "RIGHT";
      } else {
        //PLAYER LEFT LOSE
      }
    }
  } else {
    ballPos.x += dt * (ballSpeed.base * ballSpeed.x);
    if (ballPos.x >= screenWidth) {
      if (isSaveSaveY(ballPos.y, playerRightY)) {
        ballPos.x -= playerWidth;
        currentDir = "LEFT";
      } else {
        //PLAY RIGHT LOSE
      }
    }
  }
}, 1000 / fps);

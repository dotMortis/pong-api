import express, { NextFunction, Request, Response } from "express";
import { createServer } from "http";

const app = express();
const server = createServer(app);

app.use(
  express.json({
    type: "application/json",
  }),
);

app.use();

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json(err);
});

server.listen(8080, () => {
  console.log("Server started on port 8080");
});

import { NextFunction, Request, Response, Router } from "express";

export const mainRouter = Router();
mainRouter
  .route("/test")
  .get((req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({ status: "NOICE" });
  });

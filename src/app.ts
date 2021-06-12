import express, { Application, Request, Response } from "express";
import { DEFAULT_MESSAGE } from "./config/constants";
class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.bootstrap();
  }

  bootstrap() {
    this.app.get("/", (_: Request, res: Response) => {
      res.send(DEFAULT_MESSAGE);
    });
  }
}

export default new App().app;

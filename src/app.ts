import express, { Application, Request, Response, Router } from "express";
import { DEFAULT_MESSAGE } from "./config/constants";
class App {
  public app: Application;
  public router: Router;

  constructor() {
    this.app = express();
    this.router = express.Router();
    this.bootstrap();
  }

  bootstrap() {
    this.app.get("/", (req: Request, res: Response) => {
      res.send(DEFAULT_MESSAGE);
    });
  }
}

export default new App().app;

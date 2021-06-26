import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";

export default class ExpressMiddleWares {
  public app: Application;

  constructor(app: Application) {
    this.app = app;
    app.use(cors());
    app.use(helmet());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
  }
}

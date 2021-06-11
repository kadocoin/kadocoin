import express, { Application } from "express";
import cors from "cors";

export class MiddleWare {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
    app.use(cors());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
  }
}

import session from "express-session";
import MongoStore from "connect-mongo";
import { Application, Request, Response, NextFunction } from "express";

export class Session {
  private app: Application;
  constructor(app: Application) {
    this.app = app;
    this.app.use(this.sessionMiddleware);
  }

  sessionMiddleware = (req: Request, res: Response, next: NextFunction) => {
    return session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        client: req.dbClient,
        stringify: false,
      }),
      cookie: { maxAge: 1000 * 60 * 60 * 24 * 14, httpOnly: true }, // COOKIES EXPIRE IN 14 DAYS
    })(req, res, next);
  };
}

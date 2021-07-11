/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { SESSION_SECRET } from '../config/secret';
import { Application, Request, Response, NextFunction } from 'express';

export class Session {
  private app: Application;
  constructor(app: Application) {
    this.app = app;
    this.app.use(this.sessionMiddleware);
  }

  sessionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    return session({
      secret: SESSION_SECRET,
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

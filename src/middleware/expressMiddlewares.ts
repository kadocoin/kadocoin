/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import express, { Application } from 'express';
import helmet from 'helmet';
// import cors from 'cors';

export default class ExpressMiddleWares {
  public app: Application;

  constructor(app: Application) {
    this.app = app;
    // app.use(cors());
    app.use(function (_, res, next) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });
    app.use(helmet());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
  }
}

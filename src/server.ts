import app from './app';
const expressSwagger = require('express-swagger-generator')(app);
import { PORT } from './config/constants';
import 'dotenv/config';
import { Request, Response, NextFunction } from 'express';
import { UserRouter } from './routes/userRouter.router';
import { ExpressMiddleWares } from './middleware/expressMiddlewares';
import { TransactionRouter } from './routes/transactionRouter.router';
import { Database } from './middleware/database';
import { Session } from './middleware/session';
import passportEmailPassword from './middleware/passportEmailPassword';

let options = {
  swaggerDefinition: {
    info: {
      description: 'Kadocoin',
      title: 'Kadocoin',
      version: '1.0.0',
    },
    host: 'localhost:3000',
    basePath: '',
    produces: ['application/json', 'application/xml'],
    schemes: ['http', 'https'],
    securityDefinitions: {
      JWT: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: '',
      },
      value: 'Bearer <JWT>',
    },
  },
  basedir: __dirname, //app absolute path
  files: ['../src/routes/*.*.ts'], //Path to the API handle folder
};

expressSwagger(options);

let initializeRoute = (_: Request, __: Response, next: NextFunction) => {
  new UserRouter(app);
  new TransactionRouter(app);
  next();
};

let initializeMiddleWare = (_: Request, __: Response, next: NextFunction) => {
  new ExpressMiddleWares(app);
  new Database(app);
  new Session(app);
  app.use(passportEmailPassword.initialize());
  app.use(passportEmailPassword.session());
  next();
};

app.use(initializeMiddleWare);
app.use(initializeRoute);


app.listen(process.env.PORT || PORT, () => {
  console.log(`Application is running on ${process.env.PORT || PORT}`);
});

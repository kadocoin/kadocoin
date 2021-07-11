/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import passportEmailPassword from 'passport';
import bcrypt from 'bcryptjs';
import { Strategy as LocalStrategy } from 'passport-local';
import CommonModel from '../models/common.model';
import { Request } from 'express';

const { findById, findByEmail } = new CommonModel();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
passportEmailPassword.serializeUser((user: any, done) => {
  done(null, user._id);
});

passportEmailPassword.deserializeUser((req: Request, id: string, done: any) => {
  try {
    findById(req.db, id)
      .then(user => {
        return done(null, user);
      })
      .catch(err => done(err));
  } catch (error) {
    return done(error);
  }
});

passportEmailPassword.use(
  new LocalStrategy(
    { usernameField: 'email', passReqToCallback: true },
    async (req, email, password, done) => {
      const user = await findByEmail(req.db, email);

      if (!user) return done(null, false, { message: 'Email or password is incorrect' });

      if (user.password) {
        if (await bcrypt.compare(password, user.password)) done(null, user);
        else done(null, false, { message: 'Email or password is incorrect' });
      } else {
        const regMethod = user.registrationMethod;
        return done(null, false, {
          message: `Whoops! Looks like you registered using your ${regMethod}`,
        });
      }
    }
  )
);

export default passportEmailPassword;

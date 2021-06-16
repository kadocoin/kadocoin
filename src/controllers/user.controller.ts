import { CommonModel } from '../models/common.model';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { emailValidation, registerValidation } from '../validation/user.validation';
import { INTERNAL_SERVER_ERROR, ALREADY_EXISTS, CREATED, NOT_FOUND, SUCCESS, TOKEN_SECRET } from '../statusCode/statusCode';
import { UserModel } from '../models/user.model';
import jwt from 'jsonwebtoken';
import passportEmailPassword from '../middleware/passportEmailPassword';
import { JWTSECRET } from '../util/secret';

const tokenLasts = '30d';

export class UserController {
  private commonModel: CommonModel;
  private userService: UserModel;

  constructor() {
    this.commonModel = new CommonModel();
    this.userService = new UserModel();
  }

  register = async (req: Request, res: Response) => {
    const { email, password, userCreationDate } = req.body;

    const { error } = registerValidation(req.body);

    if (error) return res.status(INTERNAL_SERVER_ERROR).json({ error: error.details[0].message });

    let emailExist = await this.commonModel.findByEmail(req.db, email);

    if (emailExist) return res.status(ALREADY_EXISTS).json({ message: 'Email already exists' });

    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user = await this.userService.save(req.db, {
      email,
      hashedPassword,
      userCreationDate,
    });

    // ADD SIGNED TOKEN TO USER OBJECT
    user.token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        userCreationDate: user.userCreationDate,
      },
      JWTSECRET,
      {
        expiresIn: tokenLasts,
      }
    );

    res.status(CREATED).json({
      user,
    });
  };

  doesEmailExists = async (req: Request, res: Response) => {
    const { email } = req.body;

    const { error } = emailValidation(email);
    if (error) return res.status(INTERNAL_SERVER_ERROR).json({ error: error.details[0].message });

    const emailExist = await this.commonModel.findByEmail(req.db, email);

    if (emailExist) return res.status(SUCCESS).json({ message: 'email exists' });

    res.status(SUCCESS).json({ message: 'unique email' });
  };

  // login = async (req: Request, res: Response) => {
  //   const { error } = loginValidation(req.body);
  //   if (error) {
  //     res.status(INTERNAL_SERVER_ERROR).json({
  //       error: error.details[0].message,
  //     });
  //   }

  //   let user = await this.commonModel.findByEmail(req.body.email);
  //   if (!user)
  //     res.status(NOT_FOUND).json({
  //       message: "Email or password doesn't exits",
  //     });

  //   // password check

  //   const validPassword = await bcrypt.compare(req.body.password, user?.password as string);
  //   if (!validPassword)
  //     return res.status(ALREADY_EXISTS).json({
  //       message: 'Invalid password',
  //     });

  //   const token = jwt.sign({ _id: user?._id, exp: Math.floor(Date.now() / 1000) + 60 * 60 }, TOKEN_SECRET);
  //   res.header('x-header-token', token).status(SUCCESS).json({
  //     message: 'Successfully loggedin',
  //     token: token,
  //   });
  // };
}

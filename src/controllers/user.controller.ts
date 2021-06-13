import { CommonModel } from '../models/common.model';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { loginValidation, registerValidation } from '../validation/user.validation';
import { INTERNAL_SERVER_ERROR, ALREADY_EXISTS, CREATED, NOT_FOUND, SUCCESS, TOKEN_SECRET } from '../statusCode/statusCode';
import { UserModel } from '../models/user.model';

export class UserController {
  private loginService: CommonModel;
  private userService: UserModel;

  constructor() {
    this.loginService = new CommonModel();
    this.userService = new UserModel();
  }

  register = async (req: Request, res: Response) => {
    const { email, password, userCreationDate } = req.body;

    const { error } = registerValidation(req.body);

    console.log('register', req.body);

    if (error) return res.status(INTERNAL_SERVER_ERROR).json({ error: error.details[0].message });

    let emailExist = await this.loginService.findByEmail(req.db, email);

    if (emailExist) return res.status(ALREADY_EXISTS).json({ message: 'Email already exists' });

    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await this.userService.save(req.db, {
      email,
      userCreationDate,
      hashedPassword,
    });

    return res.status(CREATED).json({
      user: user,
    });
  };

  // login = async (req: Request, res: Response) => {
  //   const { error } = loginValidation(req.body);
  //   if (error) {
  //     res.status(INTERNAL_SERVER_ERROR).json({
  //       error: error.details[0].message,
  //     });
  //   }

  //   let user = await this.loginService.findByEmail(req.body.email);
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

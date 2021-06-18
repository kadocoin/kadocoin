import { CommonModel } from '../models/common.model';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { emailValidation, registerValidation, loginValidation, walletInfoValidation } from '../validation/user.validation';
import { INTERNAL_SERVER_ERROR, ALREADY_EXISTS, CREATED, NOT_FOUND, SUCCESS, TOKEN_SECRET } from '../statusCode/statusCode';
import { UserModel } from '../models/user.model';
import jwt from 'jsonwebtoken';
import { JWTSECRET } from '../util/secret';
import Wallet from '../wallet';
import pubKeyToAddress from '../util/pubKeyToAddress';
import { removeSensitiveProps } from '../util/removeSensitiveProps';

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
    const wallet = new Wallet();

    const address = pubKeyToAddress(wallet.publicKey);

    const { error } = registerValidation(req.body);

    if (error) return res.status(INTERNAL_SERVER_ERROR).json({ error: error.details[0].message });

    let emailExist = await this.commonModel.findByEmail(req.db, email);

    if (emailExist) return res.status(ALREADY_EXISTS).json({ message: 'Email already exists' });

    // HASH PASSWORD
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user = await this.userService.save(req.db, {
      email,
      hashedPassword,
      userCreationDate,
      publicKey: wallet.publicKey,
      address,
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

    user = removeSensitiveProps(user);

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

  login = async (req: Request, res: Response) => {
    const { error } = loginValidation(req.body);

    if (error) return res.status(INTERNAL_SERVER_ERROR).json({ error: error.details[0].message });

    let user = await this.commonModel.findByEmail(req.db, req.body.email);

    if (!user) return res.status(NOT_FOUND).json({ message: 'Incorrect email or password' });

    // CHECK PASSWORD
    const validPassword = await bcrypt.compare(req.body.password, user.password);

    if (!validPassword) return res.status(ALREADY_EXISTS).json({ message: 'Invalid password' });

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

    res.status(SUCCESS).json({ user });
  };

  walletInfo = async (req: Request, res: Response) => {
    const { error } = walletInfoValidation(req.body.address);

    if (error) return res.status(INTERNAL_SERVER_ERROR).json({ error: error.details[0].message });


    res.status(SUCCESS).json({ balance: Wallet.calculateBalance({ chain: req.blockchain.chain, address: req.body.address }) });
  };
}

/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import CommonModel from '../models/common.model';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
  emailValidation,
  registerValidation,
  loginValidation,
  walletInfoValidation,
  editProfileInfoValidation,
} from '../validation/user.validation';
import {
  INTERNAL_SERVER_ERROR,
  ALREADY_EXISTS,
  CREATED,
  UPDATED,
  NOT_FOUND,
  SUCCESS,
} from '../statusCode/statusCode';
import UserModel from '../models/user.model';
import jwt from 'jsonwebtoken';
import { JWTSECRET } from '../config/secret';
import Wallet from '../wallet';
import { removeSensitiveProps } from '../util/removeSensitiveProps';
import { v2 as cloudinary } from 'cloudinary';
import getCloudinaryImagePublicId from '../util/getCloudinaryImagePublicId';
import sanitizeHTML from 'sanitize-html';

const tokenLasts = '30d';

export default class UserController {
  private commonModel: CommonModel;
  private userModel: UserModel;

  constructor() {
    this.commonModel = new CommonModel();
    this.userModel = new UserModel();
  }

  register = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email, password, userCreationDate } = req.body;
      const { error } = registerValidation(req.body);

      const wallet = new Wallet();

      if (error) return res.status(INTERNAL_SERVER_ERROR).json({ error: error.details[0].message });

      const emailExist = await this.commonModel.findByEmail(req.db, email);
      if (emailExist) return res.status(ALREADY_EXISTS).json({ message: 'Email already exists' });

      // HASH PASSWORD
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      let user = await this.userModel.register(req.db, {
        email,
        hashedPassword,
        userCreationDate,
        address: wallet.address,
        publicKey: wallet.publicKey,
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

      return res.status(CREATED).json({
        user,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
      throw new Error(error.message);
    }
  };

  doesEmailExists = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email } = req.body;

      const { error } = emailValidation(email);
      if (error) return res.status(INTERNAL_SERVER_ERROR).json({ error: error.details[0].message });

      const emailExist = await this.commonModel.findByEmail(req.db, email);

      if (emailExist) return res.status(SUCCESS).json({ message: 'email exists' });

      return res.status(SUCCESS).json({ message: 'unique email' });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
      throw new Error(error.message);
    }
  };

  login = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { error } = loginValidation(req.body);

      if (error) return res.status(INTERNAL_SERVER_ERROR).json({ error: error.details[0].message });

      const user = await this.commonModel.findByEmail(req.db, req.body.email);

      if (!user) return res.status(NOT_FOUND).json({ message: 'Incorrect email or password' });

      // CHECK PASSWORD
      const validPassword = await bcrypt.compare(req.body.password, user.password as string);

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

      return res.status(SUCCESS).json({ user });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
      throw new Error(error.message);
    }
  };

  walletInfo = (req: Request, res: Response): Response => {
    try {
      const { error } = walletInfoValidation(req.body);
      if (error) return res.status(INTERNAL_SERVER_ERROR).json({ error: error.details[0].message });

      return res.status(SUCCESS).json({
        balance: Wallet.calculateBalance({
          chain: req.blockchain.chain,
          address: req.body.address,
        }),
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
      throw new Error(error.message);
    }
  };

  editProfileInfo = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { error } = editProfileInfoValidation(req.body);

      if (error) return res.status(INTERNAL_SERVER_ERROR).json({ error: error.details[0].message });

      const {
        hostname: cloud_name,
        username: api_key,
        password: api_secret,
      } = new URL(process.env.CLOUDINARY_URL);

      cloudinary.config({ cloud_name, api_key, api_secret });

      let profilePicture;
      if (req.file) {
        const image = await cloudinary.uploader.upload(req.file.path, {
          folder: 'kadocoin/profilePictures',
          width: 512,
          height: 512,
          crop: 'fill',
        });

        profilePicture = image.secure_url;
      }

      let { name, bio, email } = req.body;
      const { currentProfilePicture, userId } = req.body;

      // SANITIZE - REMOVE SCRIPTS/HTML TAGS
      name &&
        (name = sanitizeHTML(name, {
          allowedTags: [],
          allowedAttributes: {},
        }));
      bio &&
        (bio = sanitizeHTML(bio, {
          allowedTags: [],
          allowedAttributes: {},
        }));
      email &&
        (email = sanitizeHTML(email, {
          allowedTags: [],
          allowedAttributes: {},
        }));

      const user = await this.userModel.updateUserById(req.db, userId, {
        ...(name && { name }),
        ...(bio && { bio }),
        ...(email && { email }),
        ...(profilePicture && { profilePicture }),
      });

      // DELETE OLD PROFILE PICTURE(currentProfilePicture)
      if (
        req.file &&
        currentProfilePicture != 'NotSet' &&
        currentProfilePicture.split('res.cloudinary.com/dankoresoftware').length > 1
      ) {
        const imagePublicId = getCloudinaryImagePublicId(currentProfilePicture, 'profilePictures'); // returns e.g 'dankoresoft/profilePictures/rjzuxzicrcszoqjjowln'
        await cloudinary.uploader.destroy(imagePublicId, {
          invalidate: true,
          resource_type: 'image',
        });
      }

      return res.status(UPDATED).json({ user });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
      throw new Error(error.message);
    }
  };
}

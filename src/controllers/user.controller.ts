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
  change_password_validation,
  delete_account_validation,
} from '../validation/user.validation';
import {
  INTERNAL_SERVER_ERROR,
  ALREADY_EXISTS,
  CREATED,
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
import uploadToCloudinary from '../util/upload-to-cloudinary';
import { sendMailNodemailer } from '../util/mail';
import { RegistrationWelcomeEmailPreVerification } from '../emailTemplates/registrationWelcomeEmailPreVerification';
import { generate_verification_token, token_expiry_ms } from '../util/generate_verification_token';

export default class UserController {
  private commonModel: CommonModel;
  private userModel: UserModel;
  tokenLasts: string;

  constructor() {
    this.commonModel = new CommonModel();
    this.userModel = new UserModel();
    this.tokenLasts = '30d';
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

      const verification_token = await generate_verification_token();
      const token_expiry = token_expiry_ms();

      let user = await this.userModel.register(
        req.db,
        {
          email,
          hashedPassword,
          userCreationDate,
          address: wallet.address,
          publicKey: wallet.publicKey,
        },
        {
          verification_token,
          token_expiry,
        }
      );

      // EMAIL OPTIONS
      const msg = {
        to: email,
        from: `Kadocoin <${process.env.EMAIL_FROM}>`,
        subject: '[One More Step] Verify Your Registration Email',
        html: RegistrationWelcomeEmailPreVerification(verification_token, email),
      };

      // SEND EMAIL
      await sendMailNodemailer(msg);

      // ADD SIGNED TOKEN TO USER OBJECT
      user.token = jwt.sign(
        {
          id: user._id,
          name: user.name,
          bio: user.bio,
          email: user.email,
          userCreationDate: user.userCreationDate,
        },
        JWTSECRET,
        {
          expiresIn: this.tokenLasts,
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
          name: user.name,
          bio: user.bio,
          email: user.email,
          userCreationDate: user.userCreationDate,
        },
        JWTSECRET,
        {
          expiresIn: this.tokenLasts,
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

      let profilePicture: string;
      if (req.file) profilePicture = await uploadToCloudinary(req.file);

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

      const update = {
        ...(name && { name }),
        ...(bio && { bio }),
        ...(email && { email }),
        ...(profilePicture && { profilePicture }),
      };

      let user =
        Object.keys(update).length &&
        (await this.userModel.updateUserById(req.db, userId, {
          ...(name && { name }),
          ...(bio && { bio }),
          ...(email && { email }),
          ...(profilePicture && { profilePicture }),
        }));

      // DELETE OLD PROFILE PICTURE(currentProfilePicture)
      if (
        req.file &&
        currentProfilePicture != 'NotSet' &&
        currentProfilePicture.split('res.cloudinary.com/dankoresoftware').length > 1
      ) {
        const imagePublicId = getCloudinaryImagePublicId(currentProfilePicture, 'profilePictures'); // returns e.g 'kadocoin/profilePictures/rjzuxzicrcszoqjjowln'

        await cloudinary.uploader.destroy(imagePublicId, {
          invalidate: true,
          resource_type: 'image',
        });
      }

      // ADD SIGNED TOKEN TO USER OBJECT
      user.token = jwt.sign(
        {
          id: user._id,
          name: user.name,
          bio: user.bio,
          email: user.email,
          userCreationDate: user.userCreationDate,
        },
        JWTSECRET,
        {
          expiresIn: this.tokenLasts,
        }
      );

      user = removeSensitiveProps(user);

      return res.status(SUCCESS).json({ user });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
      throw new Error(error.message);
    }
  };

  change_password = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { error } = change_password_validation(req.body);

      if (error) return res.status(INTERNAL_SERVER_ERROR).json({ error: error.details[0].message });

      const { current_password, new_password, userId } = req.body;

      // GET USER DOCUMENT
      const user = await this.commonModel.findById(req.db, userId);

      if (user) {
        // CHECK PASSWORD
        if (!(await bcrypt.compare(current_password, user.password)))
          return res.status(NOT_FOUND).json({ message: 'Incorrect email or password' });

        // HASH PASSWORD
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);

        await this.userModel.updateUserById(req.db, user._id, {
          password: hashedPassword,
        });

        return res.status(SUCCESS).json({ message: 'success' });
      }

      return res.status(NOT_FOUND).json({ message: 'No user exists with this user ID' });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
      throw new Error(error.message);
    }
  };

  delete_account = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { error } = delete_account_validation(req.body);

      if (error) return res.status(INTERNAL_SERVER_ERROR).json({ error: error.details[0].message });

      const { user_id } = req.body;

      // GET USER DOCUMENT
      const userAccountToDelete = await this.userModel.delete_account(req.db, user_id);

      // DELETE PROFILE PICTURE IF IT EXISTS
      if (
        userAccountToDelete.profilePicture &&
        userAccountToDelete.profilePicture.split('res.cloudinary.com/dankoresoftware').length > 1
      ) {
        const imagePublicId = getCloudinaryImagePublicId(
          userAccountToDelete.profilePicture,
          'profilePictures'
        );

        // returns e.g 'kadocoin/profilePictures/rjzuxzicrcszoqjjowln'
        await cloudinary.uploader.destroy(imagePublicId, {
          invalidate: true,
          resource_type: 'image',
        });
      }

      return res.status(SUCCESS).json({ message: 'success' });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
      throw new Error(error.message);
    }
  };
}

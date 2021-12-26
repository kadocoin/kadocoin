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
  editProfileInfoValidation,
  change_password_validation,
  delete_account_validation,
  verify_token_validation,
  userId_email_token_validation,
  tokenValidation,
  forgot_password_step_2_validation,
  addressValidation,
  subscribeToNewsletterValidation,
  contactUsValidation,
} from '../validation/user.validation';
import {
  INTERNAL_SERVER_ERROR,
  ALREADY_EXISTS,
  CREATED,
  NOT_FOUND,
  SUCCESS,
  INCORRECT_VALIDATION,
} from '../statusCode/statusCode';
import UserModel from '../models/user.model';
import jwt from 'jsonwebtoken';
import { JWTSECRET } from '../config/secret';
import Wallet from '../wallet';
import { removeSensitiveProps } from '../util/remove-sensitive-props';
import { v2 as cloudinary } from 'cloudinary';
import getCloudinaryImagePublicId from '../util/get-cloudinary-image-publicId';
import sanitizeHTML from 'sanitize-html';
import uploadToCloudinary from '../util/upload-to-cloudinary';
import { sendMailNodemailer } from '../util/mail';
import { RegistrationWelcomeEmailPreVerification } from '../emailTemplates/registrationWelcomeEmailPreVerification';
import {
  generate_verification_token,
  generate_token_expiry,
} from '../util/generate-verification-token';
import { ResetPasswordEmail } from '../emailTemplates/resetPasswordEmail';
import { ResetPasswordEmailSuccess } from '../emailTemplates/resetPasswordEmailSuccess';
import { isValidChecksumAddress } from '../util/pubkey-to-address';

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
      const { error } = registerValidation(req.body);
      if (error)
        return res
          .status(INCORRECT_VALIDATION)
          .json({ type: 'error', message: error.details[0].message });

      const { email, password, userCreationDate } = req.body;

      const wallet = new Wallet();

      const emailExist = await this.commonModel.findByEmail(req.app.locals.db, email);
      if (emailExist) return res.status(ALREADY_EXISTS).json({ message: 'Email already exists' });

      // HASH PASSWORD
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const verification_token = await generate_verification_token();
      const token_expiry = generate_token_expiry();

      let user = await this.userModel.register(
        req.app.locals.db,
        {
          email,
          hashedPassword,
          userCreationDate,
          address: wallet.address,
          publicKey: wallet.publicKey,
          keyPairHex: wallet.keyPairHex,
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
        message: user,
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
      if (error)
        return res
          .status(INCORRECT_VALIDATION)
          .json({ type: 'error', message: error.details[0].message });

      const emailExist = await this.commonModel.findByEmail(req.app.locals.db, email);

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

      if (error)
        return res
          .status(INCORRECT_VALIDATION)
          .json({ type: 'error', message: error.details[0].message });

      let user = await this.commonModel.findByEmail(req.app.locals.db, req.body.email);

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

      user = removeSensitiveProps(user);

      return res.status(SUCCESS).json({ user });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
      throw new Error(error.message);
    }
  };

  addressInfo = (req: Request, res: Response): Response => {
    try {
      const { error } = addressValidation(req.params.address);
      if (error)
        return res
          .status(INCORRECT_VALIDATION)
          .json({ type: 'error', message: error.details[0].message });

      // CHECK THE VALIDITY OF ADDRESS
      if (!isValidChecksumAddress(req.params.address.trim()))
        return res.status(INCORRECT_VALIDATION).json({
          type: 'error',
          message: 'Invalid address.',
        });

      return res.status(SUCCESS).json({
        type: 'success',
        message: Wallet.calculateTotalSentAndReceived({
          chain: req.blockchain.chain,
          address: req.params.address,
        }),
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
      throw new Error(error.message);
    }
  };

  balance = (req: Request, res: Response): Response => {
    try {
      const { error } = addressValidation(req.body.address);
      if (error)
        return res
          .status(INCORRECT_VALIDATION)
          .json({ type: 'error', message: error.details[0].message });

      // CHECK THE VALIDITY OF ADDRESS
      if (!isValidChecksumAddress(req.body.address.trim()))
        return res.status(INCORRECT_VALIDATION).json({
          type: 'error',
          message: 'Invalid address.',
        });

      // GRAB NECESSARY MIDDLEWARE(S)
      const { leveldb } = req;

      leveldb.getBalance(req.body.address, ({ type, message }) => {
        console.log('balance route', { message });
        if (type == 'error') return res.status(NOT_FOUND).json({ type: 'error', message });

        return res.status(SUCCESS).json({
          balance: message,
        });
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

      if (error)
        return res
          .status(INCORRECT_VALIDATION)
          .json({ type: 'error', message: error.details[0].message });

      let profilePicture: string;
      if (req.file) profilePicture = await uploadToCloudinary(req.file);

      let { name, bio, email } = req.body;
      const { currentProfilePicture, user_id } = req.body;

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
        (await this.userModel.updateUserById(req.app.locals.db, user_id, {
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

      return res.status(SUCCESS).json({ type: 'success', user });
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

      if (error)
        return res
          .status(INCORRECT_VALIDATION)
          .json({ type: 'error', message: error.details[0].message });

      const { current_password, new_password, user_id } = req.body;

      // GET USER DOCUMENT
      const user = await this.commonModel.findById(req.app.locals.db, user_id);

      if (user) {
        // CHECK PASSWORD
        if (!(await bcrypt.compare(current_password, user.password)))
          return res.status(NOT_FOUND).json({ message: 'Incorrect email or password' });

        // HASH PASSWORD
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);

        await this.userModel.updateUserById(req.app.locals.db, user._id, {
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

      if (error)
        return res
          .status(INCORRECT_VALIDATION)
          .json({ type: 'error', message: error.details[0].message });

      const { user_id } = req.body;

      // GET USER DOCUMENT
      const userAccountToDelete = await this.userModel.delete_account(req.app.locals.db, user_id);

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

  send_verification_email = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { error } = userId_email_token_validation(req.body);

      if (error)
        return res
          .status(INCORRECT_VALIDATION)
          .json({ type: 'error', message: error.details[0].message });

      const { email, user_id } = req.body;

      // GET USER DOCUMENT
      const user = await this.commonModel.findById(req.app.locals.db, user_id);

      if (user.emailVerified)
        return res
          .status(NOT_FOUND)
          .json({ type: 'error', message: 'Email already verified. Logout and login back again.' });

      const verification_token_registration_email = await generate_verification_token();
      const token_expiry_registration_email = generate_token_expiry();

      // ADD TO DB
      await this.userModel.updateUserById(req.app.locals.db, user_id, {
        verification_token_registration_email,
        token_expiry_registration_email,
      });

      // EMAIL OPTIONS
      const msg = {
        to: email,
        from: `Kadocoin <${process.env.EMAIL_FROM}>`,
        subject: '[One More Step] Verify Your Registration Email',
        html: RegistrationWelcomeEmailPreVerification(
          verification_token_registration_email,
          email,
          'USER_REQUESTED_THIS_EMAIL'
        ),
      };

      // SEND EMAIL
      await sendMailNodemailer(msg);

      return res.status(SUCCESS).json({ message: 'success' });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
      throw new Error(error.message);
    }
  };

  verify_registration_email = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { error } = verify_token_validation(req.body);

      if (error)
        return res
          .status(INCORRECT_VALIDATION)
          .json({ type: 'error', message: error.details[0].message });

      const { verification_token } = req.body;

      const user = await this.userModel.find_by_verification_token(
        req.app.locals.db,
        verification_token,
        'registration_email'
      );

      if (!user)
        return res.status(NOT_FOUND).json({
          error: 'Email verification token is invalid or has expired',
        });

      // SET RESET TOKEN AND EXPIRY TO UNDEFINED
      await this.userModel.updateUserById(req.app.locals.db, user._id, {
        verification_token_registration_email: null,
        token_expiry_registration_email: null,
        emailVerified: true,
      });

      return res.status(SUCCESS).json({ message: 'success' });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
      throw new Error(error.message);
    }
  };

  forgot_password_step_1 = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { error } = emailValidation(req.body.email);

      if (error)
        return res
          .status(INCORRECT_VALIDATION)
          .json({ type: 'error', message: error.details[0].message });

      const { email } = req.body;

      const verification_token_reset_password = await generate_verification_token();
      const token_expiry__reset_password = generate_token_expiry();

      // GET THE USER DOCUMENT TO USE THE ID
      // TODO: CACHING?
      const userDoc = await this.commonModel.findByEmail(req.app.locals.db, email);

      // ADD TO DB
      const user = await this.userModel.updateUserById(req.app.locals.db, userDoc._id, {
        verification_token_reset_password,
        token_expiry__reset_password,
      });

      // EMAIL OPTIONS
      const msg = {
        to: email,
        from: `Kadocoin <${process.env.EMAIL_FROM}>`,
        subject: '[Next Step] Reset Your Password',
        html: ResetPasswordEmail(verification_token_reset_password, email, user._id, user.name),
      };

      // SEND EMAIL
      await sendMailNodemailer(msg);

      return res.status(SUCCESS).json({ message: 'success' });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
      throw new Error(error.message);
    }
  };

  check_reset_password_token = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { error } = tokenValidation(req.body.verification_token_reset_password);

      if (error)
        return res
          .status(INCORRECT_VALIDATION)
          .json({ type: 'error', message: error.details[0].message });

      const { verification_token_reset_password } = req.body;

      const user = await this.userModel.find_by_verification_token(
        req.app.locals.db,
        verification_token_reset_password,
        'reset_password'
      );

      if (!user)
        return res.status(NOT_FOUND).json({
          error: 'verification token is invalid or has expired',
        });

      // SET RESET TOKEN AND EXPIRY TO UNDEFINED
      await this.userModel.updateUserById(req.app.locals.db, user._id, {
        verification_token_reset_password: null,
        token_expiry__reset_password: null,
      });

      return res.status(SUCCESS).json({ message: 'success' });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
      throw new Error(error.message);
    }
  };

  forgot_password_step_2 = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { error } = forgot_password_step_2_validation(req.body);

      if (error)
        return res
          .status(INCORRECT_VALIDATION)
          .json({ type: 'error', message: error.details[0].message });

      const { user_id, new_password } = req.body;

      // GET USER DOCUMENT
      const user = await this.commonModel.findById(req.app.locals.db, user_id);

      if (!user)
        return res
          .status(NOT_FOUND)
          .json({ message: 'Your account was not found. Did you recently deleted it?' });

      // HASH PASSWORD
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(new_password, salt);

      await this.userModel.updateUserById(req.app.locals.db, user._id, {
        password: hashedPassword,
      });

      // EMAIL OPTIONS
      const msg = {
        to: user.email,
        from: `Kadocoin <${process.env.EMAIL_FROM}>`,
        subject: '[Success] Reset Password Success',
        html: ResetPasswordEmailSuccess(user.name, user.email),
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

      return res.status(SUCCESS).json({ message: user });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
      throw new Error(error.message);
    }
  };

  subscribe_to_newsletter = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { error } = subscribeToNewsletterValidation(req.body);

      if (error)
        return res
          .status(INCORRECT_VALIDATION)
          .json({ type: 'error', message: error.details[0].message });

      const { email, date } = req.body;

      // CHECK IF ALREADY SUBSCRIBED
      let subscriberDoc = await this.userModel.find_subscriber(req.app.locals.db, email);

      if (subscriberDoc)
        return res.status(SUCCESS).json({ type: 'found', message: 'Already a subscriber' });

      // THEY ARE NOT SUBSCRIBED. SUBSCRIBE THEM
      subscriberDoc = await this.userModel.save_subscriber(req.app.locals.db, email, date);

      return res.status(CREATED).json({ type: 'success', message: 'success' });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
      throw new Error(error.message);
    }
  };

  contact_us = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { error } = contactUsValidation(req.body);

      if (error)
        return res
          .status(INCORRECT_VALIDATION)
          .json({ type: 'error', message: error.details[0].message });

      // SAVE INTO DB
      const contactDoc = await this.userModel.contact_us(req.app.locals.db, req.body);

      if (!contactDoc)
        return res.status(INTERNAL_SERVER_ERROR).json({
          type: 'error',
          message: 'Sorry, we are unable to save your message. Please try again.',
        });

      return res.status(CREATED).json({ type: 'success', message: 'success' });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(INTERNAL_SERVER_ERROR).json({ type: 'error', message: error.message });
      }
      throw new Error(error.message);
    }
  };
}

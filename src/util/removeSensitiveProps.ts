import { IUserModel } from '../types';

export function removeSensitiveProps(user: IUserModel) {
  return (user = {
    _id: user._id!,
    emailVerified: user.emailVerified as boolean,
    profilePicture: user.profilePicture as null,
    userCreationDate: user.userCreationDate!,
    publicKey: user.publicKey!,
    address: user.address!,
    name: user.name!,
    bio: user.bio!,
    scope: user.scope!,
    registrationMethod: user.registrationMethod!,
    token: user.token!,
  });
}

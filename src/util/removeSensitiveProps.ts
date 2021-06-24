import { IUserModel } from '../types';

export function removeSensitiveProps(user: IUserModel) {
  return (user = {
    _id: user._id!,
    emailVerified: user.emailVerified!,
    profilePicture: user.profilePicture!,
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

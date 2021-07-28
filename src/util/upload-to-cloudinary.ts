import { v2 as cloudinary } from 'cloudinary';

export default async function uploadToCloudinary(
  file: Express.Multer.File
): Promise<string | undefined> {
  if (!file) return undefined;

  const {
    hostname: cloud_name,
    username: api_key,
    password: api_secret,
  } = new URL(process.env.CLOUDINARY_URL);

  cloudinary.config({ cloud_name, api_key, api_secret });

  const image = await cloudinary.uploader.upload(file.path, {
    folder: 'kadocoin/profilePictures',
    width: 200,
    height: 200,
    crop: 'fill',
  });

  return image.secure_url;
}

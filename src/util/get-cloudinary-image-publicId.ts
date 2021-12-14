export default function getCloudinaryImagePublicId(imageUrl: string, folder: string): string {
  const nameWithExtension = imageUrl.split(folder)[1];
  return `kadocoin/${folder}${nameWithExtension.split('.')[0]}`;
}

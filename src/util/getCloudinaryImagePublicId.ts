export default function getCloudinaryImagePublicId(imageUrl: string, folder: string): string {
  const nameWithExtension = imageUrl.split(folder)[1];
  return `dankoresoft/${folder}${nameWithExtension.split('.')[0]}`;
}

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (
  file: Buffer,
  folder: string = "profile-photos"
): Promise<{ url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "auto",
          folder: folder,
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
            { quality: "auto", fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
            });
          }
        }
      )
      .end(file);
  });
};

export const deleteFromCloudinary = async (
  public_id: string
): Promise<void> => {
  await cloudinary.uploader.destroy(public_id);
};

export default cloudinary;

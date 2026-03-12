import { cloudinary } from "../config/cloudinary.js";
import { AppError } from "../utils/errors.js";

export async function uploadImageBuffer(input: { buffer: Buffer; folder: string; mimetype?: string }) {
  const mime = input.mimetype && input.mimetype.startsWith("image/") ? input.mimetype : "image/jpeg";

  const result = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: input.folder,
        resource_type: "image",
        overwrite: false
      },
      (err, res) => {
        if (err) return reject(err);
        resolve(res);
      }
    );
    stream.end(input.buffer);
  }).catch((err: any) => {
    const msg = err?.message || err?.error?.message || "Image upload failed";
    throw new AppError(msg, 502, "UPLOAD_FAILED");
  });

  if (!result?.secure_url || !result?.public_id) throw new AppError("Upload failed", 502, "UPLOAD_FAILED");
  return { url: result.secure_url as string, publicId: result.public_id as string, width: result.width as number, height: result.height as number, mimetype: mime };
}

export async function deleteImageByPublicId(publicId: string) {
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}

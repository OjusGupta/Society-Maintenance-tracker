import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== "placeholder" &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== "placeholder";

/**
 * Upload a base64-encoded image string (data URI) to Cloudinary.
 * Returns the secure URL of the uploaded image, or null if Cloudinary is not configured.
 */
export async function uploadImage(base64DataUri: string): Promise<string | null> {
  if (!isConfigured) {
    console.warn("[Cloudinary] Not configured — storing photo as base64 data URI");
    return base64DataUri;
  }

  try {
    const result = await cloudinary.uploader.upload(base64DataUri, {
      folder: "society-maintenance-tracker",
      transformation: [{ width: 1200, quality: "auto", fetch_format: "auto" }],
    });
    return result.secure_url;
  } catch (err) {
    console.error("[Cloudinary] Upload failed:", err);
    // Fallback: store base64 directly so the complaint still gets created
    return base64DataUri;
  }
}

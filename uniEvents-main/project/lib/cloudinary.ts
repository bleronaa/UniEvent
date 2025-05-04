import { v2 as cloudinary } from "cloudinary";

// Konfiguro Cloudinary me kredencialet nga variablat e mjedisit
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Funksion për ngarkimin e një imazhi në Cloudinary nga një File
export async function uploadImage(file: File): Promise<string> {
  try {
    // Valido llojin e skedarit
    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      throw new Error("Lloji i skedarit nuk suportohet. Përdorni JPEG, PNG ose GIF.");
    }

    // Konverto File në Buffer
    const buffer = await file.arrayBuffer();
    const bytes = Buffer.from(buffer);

    // Ngarko imazhin në Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "uni-events", // Dosja ku do të ruhen imazhet
          public_id: `event_${Date.now()}_${file.name.replace(/\s+/g, "_")}`, // Emër unik
          resource_type: "image",
          transformation: [
            { width: 800, height: 600, crop: "limit" }, // Optimizim i imazhit
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(bytes);
    });

    // Kthe URL-në e imazhit të ngarkuar
    return (result as any).secure_url;
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    throw new Error(
      error instanceof Error ? error.message : "Dështoi ngarkimi i imazhit"
    );
  }
}
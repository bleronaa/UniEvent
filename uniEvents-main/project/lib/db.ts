import mongoose from "mongoose";
import User from "@/app/api/models/User"; // import default

const MONGODB_URI = process.env.MONGODB_URI;

let cached = (global as any).mongoose || { conn: null, promise: null };

async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing");
  }

  console.log("Connecting to MongoDB...");

  cached.promise =
    cached.promise ||
    mongoose.connect(MONGODB_URI, {
      dbName: "umibEvents",
      bufferCommands: false,
    });

  cached.conn = await cached.promise;

  console.log("Database connected!");

  try {
    // Këtu është pjesa që jepte error – tash po e trajtojmë saktë
    await (User as any).createAdmins(); // ose përdor cast
    // Alternativë më e mirë nëse don siguri:
    // import { IUserModel } from "@/app/api/models/User";
    // await (User as IUserModel).createAdmins();
    console.log("Admin users created or updated!");
  } catch (error) {
    console.error("Error creating admin users:", error);
  }

  return cached.conn;
}

export default dbConnect;

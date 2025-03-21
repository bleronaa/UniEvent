import mongoose from 'mongoose';

// Get the MongoDB URI from the environment variable
const MONGODB_URI = process.env.MONGODB_URI;

// Initialize the cache for database connection
let cached = (global as any).mongoose || { conn: null, promise: null };

// Function to connect to the MongoDB database
async function dbConnect() {
  // If there's an active connection, return it
  if (cached.conn) return cached.conn;

  // Ensure the MongoDB URI is provided
  if (!MONGODB_URI) throw new Error('MONGODB_URI is missing');

  // Log the connection attempt
  console.log("Connecting to MongoDB...");

  // If there's no cached connection, start the connection
  cached.promise =
    cached.promise ||
    mongoose.connect(MONGODB_URI, {
      dbName: 'umibEvents', // Added dbName to specify the database
      bufferCommands: false, // Disable buffering of commands if connection fails
    });
    console.log('added db name')

  // Await the promise and store the resolved connection in the cache
  cached.conn = await cached.promise;

  // Log the successful connection
  console.log("Database connected!");

  return cached.conn;
}

export default dbConnect;

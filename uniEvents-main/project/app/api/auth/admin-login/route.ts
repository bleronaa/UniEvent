import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/app/api/models/User';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';

export async function OPTIONS() {
  return NextResponse.json({}, { 
    status: 200,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000", // Correct origin
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
  });
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email, password } = await request.json();

    console.log("Login Attempt:", email); // Debugging Log

    // Allowed admin emails
    const allowedAdmins = [
      "blerona.tmava@umib.net",
      // "habib.tmava@umib.net",
      "bleronatmava12@gmail.com"
    ];

    // Find user in the database
    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found"); // Debugging Log
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    if (!allowedAdmins.includes(user.email)) {
      console.log("Unauthorized admin email"); // Debugging Log
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Verify password
    const isValid = await compare(password, user.password);
    if (!isValid) {
      console.log("Invalid password"); // Debugging Log
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    console.log("Login successful!"); // Debugging Log

    // Generate JWT token
    const token = sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );
    return NextResponse.json(
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
      {
        headers: {
         "Access-Control-Allow-Origin": "http://localhost:3000", // Allow all origins (change this in production)
         "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/app/api/models/User";

// Handle CORS in a reusable way
const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// OPTIONS
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: corsHeaders,
  });
}

// GET all users
export async function GET(request: Request) {
  try {
    await dbConnect();
    const users = await User.find({}).sort({ date: 1 });

    return NextResponse.json(users, { headers: corsHeaders });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, {
      status: 500,
      headers: corsHeaders,
    });
  }
}

// POST new user
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const newUser = new User(body);
    await newUser.save();

    return NextResponse.json({ message: "User added successfully", user: newUser }, {
      status: 201,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "Failed to add user" }, {
      status: 500,
      headers: corsHeaders,
    });
  }
}

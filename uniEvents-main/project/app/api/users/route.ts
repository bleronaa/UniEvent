import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/app/api/models/User";

// Përcakto origin-in dinamikisht bazuar në mjedis
const allowedOrigin = process.env.NEXT_PUBLIC_ALLOWED_ORIGIN ||
  (process.env.NODE_ENV === "production" ? "https://uni-event.vercel.app" : "http://localhost:3001");

// Handle CORS in a reusable way
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 1. OPTIONS: Për kërkesat preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: corsHeaders,
  });
}

// 2. GET: Merr të gjithë përdoruesit
export async function GET(request: Request) {
  try {
    await dbConnect();
    const users = await User.find({}).sort({ date: 1 });

    return NextResponse.json(users, { headers: corsHeaders });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// 3. POST: Shto një përdorues të ri
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const newUser = new User(body);
    await newUser.save();

    return NextResponse.json(
      { message: "User added successfully", user: newUser },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      { error: "Failed to add user" },
      { status: 500, headers: corsHeaders }
    );
  }
}
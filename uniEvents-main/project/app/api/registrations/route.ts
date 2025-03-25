import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Registrations from "../models/Registrations"; // Make sure the path is correct
import User from "../models/User"; // If you need to use User model for more specific logic
import Events from "../models/Events"; // Assuming you have an Event model

// 1. OPTIONS (For preflight requests)
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000", // Correct origin
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}

// 2. GET: Fetch all registrations
export async function GET(request: Request) {
  try {
    await dbConnect();

    const registrations = await Registrations.find()
      .populate("user", "name email")
      .populate("event", "title description date location capacity category") // Populate all required fields
      .sort({ createdAt: -1 });

    return NextResponse.json(registrations, {
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000",
      },
    });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    );
  }
}

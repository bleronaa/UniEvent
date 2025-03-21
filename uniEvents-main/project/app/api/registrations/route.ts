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

    // DEBUG: Log the origin of the request
    console.log("Request origin:", request.headers.get("origin"));

    // Fetch all registrations, populating user and event details
    const registrations = await Registrations.find()
      .populate("user", "name email") // Populate user data (you can add more fields if needed)
      .populate("event", "title date") // Populate event data
      .sort({ createdAt: -1 }); // Sort registrations by creation date, latest first

    return NextResponse.json(registrations, {
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000", // Adjust origin if needed
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

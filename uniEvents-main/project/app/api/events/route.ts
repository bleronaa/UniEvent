import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Events from "../models/Events";

// 1. OPTIONS (Preflight request)
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

// 2. GET: Fetch all events
export async function GET(request: Request) {
  try {
    await dbConnect();

    // DEBUG: Log the origin coming from the browser
    console.log("Request origin:", request.headers.get("origin"));

    const events = await Events.find({}).sort({ date: 1 });

    return NextResponse.json(events, {
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// 3. POST: Create a new event
export async function POST(request: Request) {
  try {
    await dbConnect();
    const data = await request.json(); // Parse the incoming JSON data

    // Create a new event
    const newEvent = new Events(data);
    await newEvent.save();

    return NextResponse.json(newEvent, {
      status: 201,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}

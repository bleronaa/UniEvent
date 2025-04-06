import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Registrations from "../models/Registrations";
import User from "../models/User";
import Events from "../models/Events";
import { verify } from "jsonwebtoken";

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
      .populate("event", "title description date location capacity category")
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

// 3. POST: Create a new registration
export async function POST(request: Request) {
  try {
    await dbConnect();

    const { eventId } = await request.json();
    
    // Ensure the event exists
    const event = await Events.findById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Get user ID from the Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization token missing" },
        { status: 401 }
      );
    }

      // Check if the event is full before proceeding
      if (event.registrationCount >= event.capacity) {
        return NextResponse.json(
          { error: "Event is full" },
          { status: 400 }
        );
      }

    const token = authHeader.split(" ")[1]; // Extract the token from the "Bearer <token>" format
    const decoded: any = verify(token, process.env.JWT_SECRET as string);

    // Ensure the user exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Ensure the user is not already registered for the event
    const existingRegistration = await Registrations.findOne({ user: user._id, event: event._id });
    if (existingRegistration) {
      return NextResponse.json(
        { error: "You are already registered for this event" },
        { status: 400 }
      );
    }

    // Create new registration
    const registration = new Registrations({
      user: user._id,
      event: event._id,
    });

    await registration.save();

    // Increment the event's registration count
    event.registrationCount = event.registrationCount + 1;
    await event.save();

    return NextResponse.json({ message: "Registration successful", registration }, {
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000",
      },
    });

  } catch (error) {
    console.error("Error registering for event:", error);
    return NextResponse.json(
      { error: "Failed to register for event" },
      { status: 500 }
    );
  }
}

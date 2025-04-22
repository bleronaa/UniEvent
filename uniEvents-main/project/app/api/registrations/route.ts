import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Registrations from "../models/Registrations";
import User from "../models/User";
import Events from "../models/Events";
import { verify } from "jsonwebtoken";

// Helper: CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// OPTIONS: For preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// GET: Fetch registrations (for users and admins)
export async function GET(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      console.log("Authorization token missing");
      return NextResponse.json(
        { error: "Authorization token missing" },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;

    try {
      decoded = verify(token, process.env.JWT_SECRET as string);
      console.log("Decoded token:", decoded);
    } catch (err) {
      console.log("Invalid or expired token:", err);
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401, headers: corsHeaders }
      );
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log("User not found for ID:", decoded.userId);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    let registrations;

    // If user is admin, fetch all registrations; otherwise, fetch only user's registrations
    if (user.role === "admin") {
      registrations = await Registrations.find({})
        .populate("user", "name email")
        .populate("event", "title description date location capacity category")
        .sort({ createdAt: -1 });
      console.log(`Admin ${user.email} fetched ${registrations.length} registrations`);
    } else {
      registrations = await Registrations.find({ user: decoded.userId })
        .populate("user", "name email")
        .populate("event", "title description date location capacity category")
        .sort({ createdAt: -1 });
      console.log(`User ${user.email} fetched ${registrations.length} registrations`);
    }

    return NextResponse.json(registrations, { headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST: Register user to event
export async function POST(request: Request) {
  try {
    await dbConnect();

    const { eventId } = await request.json();
    if (!eventId) {
      console.log("Event ID missing");
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      console.log("Authorization token missing");
      return NextResponse.json(
        { error: "Authorization token missing" },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;

    try {
      decoded = verify(token, process.env.JWT_SECRET as string);
      console.log("Decoded token:", decoded);
    } catch (err) {
      console.log("Invalid or expired token:", err);
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401, headers: corsHeaders }
      );
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log("User not found for ID:", decoded.userId);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const event = await Events.findById(eventId);
    if (!event) {
      console.log("Event not found for ID:", eventId);
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    if (event.registrationCount >= event.capacity) {
      console.log("Event is full:", eventId);
      return NextResponse.json(
        { error: "Event is full" },
        { status: 400, headers: corsHeaders }
      );
    }

    const alreadyRegistered = await Registrations.findOne({
      user: user._id,
      event: event._id,
    });

    if (alreadyRegistered) {
      console.log(`User ${user.email} already registered for event ${eventId}`);
      return NextResponse.json(
        { error: "You are already registered for this event" },
        { status: 400, headers: corsHeaders }
      );
    }

    const newRegistration = new Registrations({
      user: user._id,
      event: event._id,
      status: "pending", // Ensure status is set to pending
    });

    await newRegistration.save();

    event.registrationCount += 1;
    await event.save();

    console.log(`User ${user.email} registered for event ${eventId}`);

    return NextResponse.json(
      {
        message: "Registration successful",
        registration: newRegistration,
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error registering for event:", error);
    return NextResponse.json(
      { error: "Failed to register for event" },
      { status: 500, headers: corsHeaders }
    );
  }
}
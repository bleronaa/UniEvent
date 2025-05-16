import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Registrations from "../../models/Registrations";
import User from "../../models/User";
import Events from "../../models/Events";
import { verify } from "jsonwebtoken";

// Përcakto origin-in dinamikisht bazuar në mjedis
const allowedOrigin = "*";

// Helper: CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 1. OPTIONS: Për kërkesat preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// 2. PUT: Përditëso statusin e regjistrimit
export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    const registration = await Registrations.findById(params.id);
    if (!registration) {
      console.log("Registration not found for ID:", params.id);
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const event = await Events.findById(registration.event);
    if (!event) {
      console.log("Event not found for ID:", registration.event);
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Kontrollo nëse përdoruesi është admin ose organizatori i eventit
    const isAdmin = user.role === "admin";
    const isEventOrganizer = event.organizer && event.organizer.toString() === user._id.toString();

    if (!isAdmin && !isEventOrganizer) {
      console.log(`User ${user.email} is not authorized to update registrations for event ${event._id}`);
      return NextResponse.json(
        { error: "Unauthorized: Only admins or event organizers can update registrations" },
        { status: 403, headers: corsHeaders }
      );
    }

    const { status } = await request.json();
    if (!["pending", "confirmed", "cancelled"].includes(status)) {
      console.log("Invalid status:", status);
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Kontrollo kapacitetin e eventit nëse statusi ndryshon në "confirmed"
    if (status === "confirmed" && registration.status !== "confirmed") {
      if (event.capacity) {
        const confirmedRegistrations = await Registrations.countDocuments({
          event: event._id,
          status: "confirmed",
        });
        if (confirmedRegistrations >= event.capacity) {
          console.log("Event is full, cannot confirm registration");
          return NextResponse.json(
            { error: "Event is full" },
            { status: 400, headers: corsHeaders }
          );
        }
      }
    }

    registration.status = status;
    await registration.save();

    // Popullo fushat user dhe event në përgjigje
    const updatedRegistration = await Registrations.findById(params.id)
      .populate("user", "name email")
      .populate("event", "title description date location capacity category");

    console.log(`Updated registration ${params.id} to status ${status} by user ${user.email}`);

    return NextResponse.json(updatedRegistration, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error updating registration:", error);
    return NextResponse.json(
      { error: "Failed to update registration" },
      { status: 500, headers: corsHeaders }
    );
  }
}
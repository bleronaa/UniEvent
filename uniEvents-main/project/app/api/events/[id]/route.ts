import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Event from "../../models/Events";
import mongoose from "mongoose";
import type { IEvent } from "@/types/event";
import User from "../../models/User";

// Përcakto origin-in dinamikisht bazuar në mjedis
const allowedOrigin = process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || 
  (process.env.NODE_ENV === "production" ? "https://uni-event.vercel.app" : "http://localhost:3001");

// Headers të përbashkët për CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 1. Metoda OPTIONS (për preflight requests)
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

// 2. GET: Merr një event sipas ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid event ID" },
        { status: 400, headers: corsHeaders }
      );
    }

    const event = await Event.findById(params.id).populate("organizer");
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(event, { headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// 3. PUT: Përditëson një event sipas ID
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const data: Partial<IEvent> = await request.json();
    const userId = request.headers.get("x-user-id");

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid event ID" },
        { status: 400, headers: corsHeaders }
      );
    }

    const event = await Event.findById(params.id);
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Kontrollo autorizimin (nëse nevojitet)
    // if (event.organizer.toString() !== userId) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 403, headers: corsHeaders });
    // }

    // Përditëso eventin me të dhënat e reja
    const updatedEvent = await Event.findByIdAndUpdate(params.id, data, {
      new: true,
    }).populate("organizer", "name");

    return NextResponse.json(updatedEvent, { headers: corsHeaders });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// 4. DELETE: Fshin një event sipas ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const userId = request.headers.get("x-user-id");

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid event ID" },
        { status: 400, headers: corsHeaders }
      );
    }

    const event = await Event.findById(params.id);
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Kontrollo autorizimin (nëse nevojitet)
    // if (event.organizer.toString() !== userId) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 403, headers: corsHeaders });
    // }

    await Event.findByIdAndDelete(params.id);

    return NextResponse.json(
      { message: "Event deleted successfully" },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500, headers: corsHeaders }
    );
  }
}
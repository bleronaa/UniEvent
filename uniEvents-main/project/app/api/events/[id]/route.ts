import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Event from "../../models/Events";
import mongoose from "mongoose";
import type {IEvent} from "@/types/event";
import User from "../../models/User";

// 1. Metoda OPTIONS (për preflight requests)
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
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
        { status: 400 }
      );
    }

    const event = await Event.findById(params.id).populate("organizer");
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(event, {
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000",
      },
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
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
    const data: Partial<IEvent> = await request.json(); // Deklarim i qartë i tipit
    const userId = request.headers.get("x-user-id");

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid event ID" },
        { status: 400 }
      );
    }

    const event = await Event.findById(params.id);
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // if (event.organizer.toString() !== userId) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    // }

    // Përditëso eventin me të dhënat e reja
    const updatedEvent = await Event.findByIdAndUpdate(params.id, data, {
      new: true,
    }).populate("organizer", "name");

    return NextResponse.json(updatedEvent, {
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000",
      },
    });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
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
    const eventId = request.headers.get("x-user-id");

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid event ID" },
        { status: 400 }
      );
    }

    const event = await Event.findById(params.id);
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // if (event.organizer.toString() !== userId) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    // }

    await Event.findByIdAndDelete(params.id);

    return NextResponse.json(
      { message: "Event deleted successfully" },
      {
        headers: {
          "Access-Control-Allow-Origin": "http://localhost:3000",
        },
      }
    );
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}

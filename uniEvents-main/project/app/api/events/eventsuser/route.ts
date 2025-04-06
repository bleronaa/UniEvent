import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Events from "../../models/Events";

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



export async function GET(request: Request) {
  try {
    const userId = new URL(request.url).searchParams.get("user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();
    const events = await Events.find({ organizer: userId }).sort({ date: 1 });

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


export async function DELETE(request: Request) {
    try {
      const { eventId } = await request.json(); // Shtimi i ID-së së eventi që do të fshihet
  
      await dbConnect();
      const result = await Events.findByIdAndDelete(eventId);  // Fshirja e eventit nga databaza
  
      if (!result) {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }
  
      return NextResponse.json({ message: "Event deleted successfully" }, { status: 200 });
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to delete event" },
        { status: 500 }
      );
    }
  }
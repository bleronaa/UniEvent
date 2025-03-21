import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Events from "../models/Events";

// 1. OPTIONS (Për preflight requests)
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000", // Saktëso pa "/"
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}

// 2. GET: Merr të gjitha eventet
export async function GET(request: Request) {
  try {
    await dbConnect();

    // DEBUG: Kontrollo origin-in që vjen nga shfletuesi
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

import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Events from "../models/Events";

// Përcakto origin-in dinamikisht bazuar në mjedis
const allowedOrigin = process.env.NEXT_PUBLIC_ALLOWED_ORIGIN ||
  (process.env.NODE_ENV === "production" ? "https://uni-event.vercel.app" : "http://localhost:3000");

// Headers të përbashkët për CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 1. OPTIONS: Për preflight requests
export async function OPTIONS(request: Request) {
  // DEBUG: Shiko çfarë origin-i po vjen nga klienti
  console.log("OPTIONS origin:", request.headers.get("origin"));

  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

// 2. GET: Kthen numrin total të eventeve
export async function GET(request: Request) {
  try {
    await dbConnect();

    // DEBUG: Log origin-in e kërkesës
    const incomingOrigin = request.headers.get("origin");
    console.log("GET origin:", incomingOrigin);

    const totalEvents = await Events.countDocuments();

    return NextResponse.json(
      { totalEvents },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching total events:", error);
    return NextResponse.json(
      { error: "Failed to fetch total events" },
      { status: 500, headers: corsHeaders }
    );
  }
}
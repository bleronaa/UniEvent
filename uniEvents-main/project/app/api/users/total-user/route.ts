import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "../../models/User";

// Përcakto origin-in dinamikisht bazuar në mjedis
const allowedOrigin = "*"
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

// 2. GET: Kthen numrin total të përdoruesve
export async function GET(request: Request) {
  try {
    await dbConnect();

    // DEBUG: Log origin-in e kërkesës
    const incomingOrigin = request.headers.get("origin");
    console.log("GET origin:", incomingOrigin);

    const totalUsers = await User.countDocuments();

    return NextResponse.json(
      { totalUsers },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching total users:", error);
    return NextResponse.json(
      { error: "Failed to fetch total users" },
      { status: 500, headers: corsHeaders }
    );
  }
}
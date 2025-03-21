import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "../../models/User";

// 1. OPTIONS: për preflight requests
export async function OPTIONS(request: Request) {
  // DEBUG: Shiko çfarë origin-i po vjen nga klienti
  console.log("OPTIONS origin:", request.headers.get("origin"));

  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        // Hiq “/” në fund
        "Access-Control-Allow-Origin": "http://localhost:3000/",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}

// 2. GET: Kthen numrin total të eventeve
export async function GET(request: Request) {
  try {
    await dbConnect();

    // DEBUG: Log origin-in e kërkesës
    const incomingOrigin = request.headers.get("origin");
    console.log("GET origin:", incomingOrigin);

    const totalUsers = await User.countDocuments();

    return NextResponse.json(
      { totalUsers },
      {
        headers: {
          // Hiq “/” këtu gjithashtu
          "Access-Control-Allow-Origin": "http://localhost:3000",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch total users" },
      { status: 500 }
    );
  }
}
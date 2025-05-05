import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Events from "../../models/Events";
import User from "../../models/User";
import { verify } from "jsonwebtoken";

// Përcakto origin-in dinamikisht bazuar në mjedis
const allowedOrigin = process.env.NEXT_PUBLIC_ALLOWED_ORIGIN ||
  (process.env.NODE_ENV === "production" ? "https://uni-event.vercel.app" : "http://localhost:3001");

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 1. OPTIONS: Për kërkesat preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// 2. GET: Merr eventet e një përdoruesi
export async function GET(request: Request) {
  try {
    const userId = new URL(request.url).searchParams.get("user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "ID e përdoruesit është e nevojshme" },
        { status: 400, headers: corsHeaders }
      );
    }

    await dbConnect();
    const events = await Events.find({ organizer: userId }).sort({ date: 1 });

    return NextResponse.json(events, { headers: corsHeaders });
  } catch (error) {
    console.error("Gabim gjatë marrjes së eventeve:", error);
    return NextResponse.json(
      { error: "Nuk u morën dot eventet" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// 3. DELETE: Fshi një event
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const eventId = url.searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "ID e eventit është e nevojshme" },
        { status: 400, headers: corsHeaders }
      );
    }

    await dbConnect();
    const result = await Events.findByIdAndDelete(eventId);

    if (!result) {
      return NextResponse.json(
        { error: "Eventi nuk u gjet" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(result, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Gabim gjatë fshirjes së eventit:", error);
    return NextResponse.json(
      { error: "Nuk u fshi dot eventi" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// 4. PUT: Përditëso një event
export async function PUT(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Mungon token-i i autorizimit" },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;
    try {
      decoded = verify(token, process.env.JWT_SECRET as string);
    } catch (err) {
      return NextResponse.json(
        { error: "Token i pavlefshëm ose i skaduar" },
        { status: 401, headers: corsHeaders }
      );
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: "Përdoruesi nuk u gjet" },
        { status: 404, headers: corsHeaders }
      );
    }

    const url = new URL(request.url);
    const eventId = url.searchParams.get("eventId");
    if (!eventId) {
      return NextResponse.json(
        { error: "ID e eventit është e nevojshme" },
        { status: 400, headers: corsHeaders }
      );
    }

    const event = await Events.findById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: "Eventi nuk u gjet" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Kontrollo nëse përdoruesi është organizatori ose admin
    if (event.organizer.toString() !== decoded.userId && user.role !== "admin") {
      return NextResponse.json(
        { error: "Nuk ke autorizim për të edituar këtë event" },
        { status: 403, headers: corsHeaders }
      );
    }

    const {
      title,
      description,
      date,
      location,
      capacity,
      category,
      image,
      status,
    } = await request.json();

    // Valido fushat e detyrueshme
    if (!title || !date || !category) {
      return NextResponse.json(
        { error: "Titulli, data dhe kategoria janë të detyrueshme" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Përditëso fushat e eventit
    event.title = title;
    event.description = description || event.description;
    event.date = new Date(date);
    event.location = location || event.location;
    event.capacity = capacity !== undefined ? capacity : event.capacity;
    event.category = category;
    event.image = image || event.image;
    event.status = status || event.status;

    await event.save();

    return NextResponse.json(event, { headers: corsHeaders });
  } catch (error) {
    console.error("Gabim gjatë përditësimit të eventit:", error);
    return NextResponse.json(
      { error: "Nuk u përditësua dot eventi" },
      { status: 500, headers: corsHeaders }
    );
  }
}
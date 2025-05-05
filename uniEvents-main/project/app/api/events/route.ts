import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Events from "../models/Events";
import path from "path";
import { writeFile } from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import User from "../models/User";

// Përcakto origin-in dinamikisht bazuar në mjedis
const allowedOrigin ="*"
// Headers të përbashkët për CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};


 // ✅ Konfigurimi modern për App Router
 export const dynamic = 'force-dynamic'; // siguron që API-ja të mos përdorë cache

// 1. Metoda OPTIONS (për preflight requests)
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

// 2. POST: Krijo një event të ri
export async function POST(req: Request) {
  try {
    await dbConnect();

    const formData = await req.formData();
    const file = formData.get("image") as File;

    let imageUrl = "";
    if (file) {
      const buffer = await file.arrayBuffer();
      const fileName = uuidv4() + path.extname(file.name);
      const filePath = path.join(process.cwd(), "public", "uploads", fileName);
      await writeFile(filePath, new Uint8Array(buffer));
      imageUrl = `/uploads/${fileName}`;
    }

    const newEvent = new Events({
      title: formData.get("title"),
      description: formData.get("description"),
      date: formData.get("date"),
      location: formData.get("location"),
      capacity: formData.get("capacity")
        ? Number(formData.get("capacity"))
        : null,
      category: formData.get("category"),
      organizer: formData.get("organizer"), // userId
      image: imageUrl,
    });

    await newEvent.save();

    // Populate organizer after saving
    const populatedEvent = await Events.findById(newEvent._id).populate("organizer", "name");

    return NextResponse.json(populatedEvent, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// 3. GET: Merr të gjitha eventet
export async function GET(request: Request) {
  try {
    await dbConnect();

    const events = await Events.find({})
      .sort({ date: 1 })
      .populate("organizer", "name");

    const eventsWithImageUrls = events.map((event) => {
      return {
        ...event.toObject(),
        imageUrl: event.image ? `/uploads/${path.basename(event.image)}` : null,
      };
    });

    return NextResponse.json(eventsWithImageUrls, { headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500, headers: corsHeaders }
    );
  }
}
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Events from "../models/Events";
import path from "path";
import { writeFile } from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import User from "../models/User";

export const config = {
  api: {
    bodyParser: false,
  },
};

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
      imageUrl = `/uploads/${fileName}`; // për t'u përdorur në frontend
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
      organizer: formData.get("organizer"),
      image: imageUrl,
    });

    await newEvent.save();

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}

// 2. GET: Fetch all events
export async function GET(request: Request) {
  try {
    await dbConnect();

    // Fetch all events from the database
    const events = await Events.find({}).sort({ date: 1 })
      .populate("organizer", "name");

    // Map the events to include the full image URL
    const eventsWithImageUrls = events.map((event) => {
      return {
        ...event.toObject(),
        imageUrl: event.image ? `/uploads/${path.basename(event.image)}` : null,
      };
    });

    // Send the events with image URLs back to the client
    return NextResponse.json(eventsWithImageUrls, {
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000", // Allow requests from your frontend
      },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

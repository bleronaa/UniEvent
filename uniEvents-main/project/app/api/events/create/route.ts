import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Event from "../../models/Events";
import User from "../../models/User";
import { sendEmail } from "@/lib/sendEmail";
import mongoose from "mongoose";

// Përcakto origin-in dinamikisht bazuar në mjedis
const allowedOrigin = "*"
// Headers të përbashkët për CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-user-id",
};

// 1. Metoda OPTIONS (për preflight requests)
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

// 2. POST: Krijo një event të ri
export async function POST(request: Request) {
  try {
    await dbConnect();
    console.log("Database connected for event creation");

    // Merr të dhënat nga FormData
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const date = formData.get("date") as string;
    const location = formData.get("location") as string;
    const capacity = formData.get("capacity") as string;
    const category = formData.get("category") as string;
    const image = formData.get("image") as string; // Supozohet si string (URL)
    const userId = request.headers.get("x-user-id");

    console.log("FormData received:", {
      title,
      description,
      date,
      location,
      capacity,
      category,
      image,
      userId,
    });

    // Kontrollo nëse userId është i vlefshëm
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.error("Invalid userId:", userId);
      return NextResponse.json(
        { error: "ID e përdoruesit e pavlefshme" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Kontrollo nëse përdoruesi ekziston
    const organizerUser = await User.findById(userId);
    if (!organizerUser) {
      console.error("Organizer not found for userId:", userId);
      return NextResponse.json(
        { error: "Organizatori nuk u gjet" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Kontrollo nëse kategoria është e vlefshme
    const validCategories = ["Inxh.Kompjuterike", "Inxh.Mekanike"];
    if (!validCategories.includes(category)) {
      console.error("Invalid category:", category);
      return NextResponse.json(
        { error: "Kategoria e pavlefshme" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Kontrollo nëse të dhënat e nevojshme janë të pranishme
    if (!title || !date || !location || !category) {
      console.error("Missing required fields:", { title, date, location, category });
      return NextResponse.json(
        { error: "Plotësoni të gjitha fushat e nevojshme" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Krijo eventin e ri
    const event = await Event.create({
      title,
      description,
      date: new Date(date),
      organizer: userId,
      location,
      capacity: parseInt(capacity) || 0,
      category,
      image: image || "",
      status: "pending",
    });
    console.log("Event created with ID:", event._id);

    // Merr të gjithë përdoruesit
    const users = await User.find({});
    console.log("Users found for notification:", users.map(u => u.email));
    console.log("Number of users to notify:", users.length);

    if (users.length === 0) {
      console.warn("No users found to notify. Email sending skipped.");
    } else {
      // Dërgo email njoftues te të gjithë përdoruesit
      for (const user of users) {
        try {
          await sendEmail({
            to: user.email,
            subject: `Event i Ri: ${title}`,
            text: `Përshëndetje ${user.name},\n\nKemi një event të ri në UniEvents!\n\nTitulli: ${title}\nPërshkrimi: ${description || 'Nuk ka përshkrim'}\nData: ${new Date(date).toLocaleString()}\nVendndodhja: ${location || 'Nuk është specifikuar'}\nKategoria: ${category}\nOrganizatori: ${organizerUser.name}\n\nShpresojmë të shihemi atje!\nEkipi UniEvents`,
            html: `<h1>Event i Ri: ${title}</h1><p>Përshëndetje ${user.name},</p><p>Kemi një event të ri në UniEvents!</p><p><strong>Titulli:</strong> ${title}<br><strong>Përshkrimi:</strong> ${description || 'Nuk ka përshkrim'}<br><strong>Data:</strong> ${new Date(date).toLocaleString()}<br><strong>Vendndodhja:</strong> ${location || 'Nuk është specifikuar'}<br><strong>Kategoria:</strong> ${category}<br><strong>Organizatori:</strong> ${organizerUser.name}</p><p>Shpresojmë të shihemi atje!</p><p>Ekipi UniEvents</p>`,
          });
          console.log(`Email sent successfully to: ${user.email}`);
        } catch (emailError) {
          console.error(`Failed to send email to ${user.email}:`, emailError);
        }
      }
      console.log("All email sending attempts completed");
    }

    // Popullo organizatorin për përgjigjen
    const populatedEvent = await Event.findById(event._id).populate("organizer", "name");

    return NextResponse.json(
      {
        event: {
          id: populatedEvent._id,
          title: populatedEvent.title,
          description: populatedEvent.description,
          date: populatedEvent.date,
          organizer: populatedEvent.organizer,
          location: populatedEvent.location,
          capacity: populatedEvent.capacity,
          category: populatedEvent.category,
          image: populatedEvent.image,
          status: populatedEvent.status,
        },
      },
      {
        status: 201,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("Gabim gjatë krijimit të eventit:", error);
    return NextResponse.json(
      { error: "Dështoi krijimi i eventit" },
      { status: 500, headers: corsHeaders }
    );
  }
}
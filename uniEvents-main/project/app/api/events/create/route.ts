import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Event from "../../models/Events"
import User from "../../models/User";
import { sendEmail } from "@/lib/sendEmail";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    await dbConnect();

    const { title, description, date, location, capacity, category, image } = await request.json();
    const userId = request.headers.get("x-user-id");

    // Kontrollo nëse userId është i vlefshëm
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "ID e përdoruesit e pavlefshme" },
        { status: 400 }
      );
    }

    // Kontrollo nëse përdoruesi ekziston
    const organizerUser = await User.findById(userId);
    if (!organizerUser) {
      return NextResponse.json(
        { error: "Organizatori nuk u gjet" },
        { status: 400 }
      );
    }

    // Kontrollo nëse kategoria është e vlefshme
    const validCategories = ["Inxh.Kompjuterike", "Inxh.Mekanike"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Kategoria e pavlefshme" },
        { status: 400 }
      );
    }

    // Krijo eventin e ri
    const event = await Event.create({
      title,
      description,
      date,
      organizer: userId,
      location,
      capacity,
      category,
      image: image || "",
      status: "pending", // Statusi i parazgjedhur sipas modelit
    });

    // Merr të gjithë përdoruesit
    const users = await User.find({});

    // Dërgo email njoftues te të gjithë përdoruesit
    const emailPromises = users.map((user) =>
      sendEmail({
        to: user.email,
        subject: `Event i Ri: ${title}`,
        text: `Përshëndetje ${user.name},\n\nKemi një event të ri në UniEvents!\n\nTitulli: ${title}\nPërshkrimi: ${description || 'Nuk ka përshkrim'}\nData: ${new Date(date).toLocaleString()}\nVendndodhja: ${location || 'Nuk është specifikuar'}\nKategoria: ${category}\nOrganizatori: ${organizerUser.name}\n\nShpresojmë të shihemi atje!\nEkipi UniEvents`,
        html: `<h1>Event i Ri: ${title}</h1><p>Përshëndetje ${user.name},</p><p>Kemi një event të ri në UniEvents!</p><p><strong>Titulli:</strong> ${title}<br><strong>Përshkrimi:</strong> ${description || 'Nuk ka përshkrim'}<br><strong>Data:</strong> ${new Date(date).toLocaleString()}<br><strong>Vendndodhja:</strong> ${location || 'Nuk është specifikuar'}<br><strong>Kategoria:</strong> ${category}<br><strong>Organizatori:</strong> ${organizerUser.name}</p><p>Shpresojmë të shihemi atje!</p><p>Ekipi UniEvents</p>`,
      })
    );

    await Promise.all(emailPromises);

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
        headers: {
          "Access-Control-Allow-Origin": "http://localhost:3000",
        },
      }
    );
  } catch (error) {
    console.error("Gabim gjatë krijimit të eventit:", error);
    return NextResponse.json(
      { error: "Dështoi krijimi i eventit" },
      { status: 500 }
    );
  }
}
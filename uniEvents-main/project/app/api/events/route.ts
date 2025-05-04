import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Events from "../models/Events";
import User from "../models/User";
import { sendEmail } from "@/lib/sendEmail";
import path from "path";
import { writeFile } from "fs/promises";
import { v4 as uuidv4 } from "uuid";

export const config = {
  api: {
    bodyParser: false,
  },
};

// POST: Create new event
export async function POST(req: Request) {
  try {
    await dbConnect();
    console.log("Database connected for event creation");

    const formData = await req.formData();
    const file = formData.get("image") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const date = formData.get("date") as string;
    const location = formData.get("location") as string;
    const capacity = formData.get("capacity") as string;
    const category = formData.get("category") as string;
    const organizer = formData.get("organizer") as string;

    console.log("FormData received:", {
      title,
      description,
      date,
      location,
      capacity,
      category,
      organizer,
    });

    // Kontrollo nëse të dhënat e nevojshme janë të pranishme
    if (!title || !date || !location || !category || !organizer) {
      console.error("Missing required fields:", { title, date, location, category, organizer });
      return NextResponse.json(
        { error: "Plotësoni të gjitha fushat e nevojshme" },
        { status: 400 }
      );
    }

    // Kontrollo nëse organizatori ekziston
    const organizerUser = await User.findById(organizer);
    if (!organizerUser) {
      console.error("Organizer not found for userId:", organizer);
      return NextResponse.json(
        { error: "Organizatori nuk u gjet" },
        { status: 400 }
      );
    }

    // Kontrollo nëse kategoria është e vlefshme
    const validCategories = ["Inxh.Kompjuterike", "Inxh.Mekanike"];
    if (!validCategories.includes(category)) {
      console.error("Invalid category:", category);
      return NextResponse.json(
        { error: "Kategoria e pavlefshme" },
        { status: 400 }
      );
    }

    // Trajto ngarkimin e imazhit
    let imageUrl = "";
    if (file) {
      const buffer = await file.arrayBuffer();
      const fileName = uuidv4() + path.extname(file.name);
      const filePath = path.join(process.cwd(), "public", "uploads", fileName);
      await writeFile(filePath, new Uint8Array(buffer));
      imageUrl = `/uploads/${fileName}`;
    }

    // Krijo eventin e ri
    const newEvent = new Events({
      title,
      description,
      date: new Date(date),
      location,
      capacity: capacity ? Number(capacity) : null,
      category,
      organizer,
      image: imageUrl,
      status: "pending",
    });

    await newEvent.save();
    console.log("Event created with ID:", newEvent._id);

    // Merr të gjithë përdoruesit për njoftim
    const users = await User.find({});
    console.log("Users found for notification:", users.map((u) => u.email));
    console.log("Number of users to notify:", users.length);

    if (users.length === 0) {
      console.warn("No users found to notify. Email sending skipped.");
    } else {
      // Dërgo email njoftues te të gjithë përdoruesit paralelisht
      const emailPromises = users.map((user) =>
        sendEmail({
          to: user.email,
          subject: `Event i Ri: ${title}`,
          text: `Përshëndetje ${user.name},\n\nKemi një event të ri në UniEvents!\n\nTitulli: ${title}\nPërshkrimi: ${description || "Nuk ka përshkrim"}\nData: ${new Date(date).toLocaleString()}\nVendndodhja: ${location || "Nuk është specifikuar"}\nKategoria: ${category}\nOrganizatori: ${organizerUser.name}\n\nShpresojmë të shihemi atje!\nEkipi UniEvents`,
          html: `<h1>Event i Ri: ${title}</h1><p>Përshëndetje ${user.name},</p><p>Kemi një event të ri në UniEvents!</p><p><strong>Titulli:</strong> ${title}<br><strong>Përshkrimi:</strong> ${description || "Nuk ka përshkrim"}<br><strong>Data:</strong> ${new Date(date).toLocaleString()}<br><strong>Vendndodhja:</strong> ${location || "Nuk është specifikuar"}<br><strong>Kategoria:</strong> ${category}<br><strong>Organizatori:</strong> ${organizerUser.name}</p><p>Shpresojmë të shihemi atje!</p><p>Ekipi UniEvents</p>`,
        })
          .then(() => ({ email: user.email, status: "success" }))
          .catch((emailError) => ({
            email: user.email,
            status: "failed",
            error: emailError.message,
          }))
      );

      const emailResults = await Promise.all(emailPromises);
      console.log("Email sending results:", emailResults);

      const failedEmails = emailResults.filter((result) => result.status === "failed");
      if (failedEmails.length > 0) {
        console.warn("Some emails failed to send:", failedEmails);
      } else {
        console.log("All emails sent successfully");
      }
    }

    // Popullo organizatorin për përgjigjen
    const populatedEvent = await Events.findById(newEvent._id).populate("organizer", "name");

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
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}

// GET: Fetch all events
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

    return NextResponse.json(eventsWithImageUrls, {
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000",
      },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
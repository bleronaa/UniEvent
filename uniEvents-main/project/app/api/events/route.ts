import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Events from "../models/Events";
import User from "../models/User";
import cloudinary from "cloudinary";
import { sendEmail } from "@/lib/sendEmail";
import { format } from "date-fns";
import { sq } from "date-fns/locale";

// Konfiguro Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Përcakto origin-in për CORS
const allowedOrigin = "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-user-id",
};

// Konfigurimi për App Router
export const dynamic = "force-dynamic";

// Metoda OPTIONS (për preflight requests)
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

// POST: Krijo një event të ri
export async function POST(req: Request) {
  try {
    await dbConnect();

    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    const imageUrl = formData.get("imageUrl") as string | null;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const date = formData.get("date") as string;
    const location = formData.get("location") as string;
    const capacity = formData.get("capacity") as string;
    const category = formData.get("category") as string;
    const organizer = formData.get("organizer") as string;

    // Validimi i fushave të detyrueshme
    if (!title || !date || !location || !category || !organizer) {
      return NextResponse.json(
        { error: "Fusha të detyrueshme mungojnë" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Normalizo datën në UTC
    const normalizedDate = new Date(date).toISOString();

    let finalImageUrl = "";

    // Trajto ngarkimin e skedarit ose URL-në
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Ngarko në Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          { folder: "uni-events", resource_type: "image" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });

      finalImageUrl = (result as any).secure_url;
      console.log("Imazhi u ngarkua në Cloudinary:", finalImageUrl);
    } else if (imageUrl) {
      // Përdor URL-në e dhënë
      finalImageUrl = imageUrl;
      console.log("URL imazhi i dhënë:", finalImageUrl);
    } else {
      // As skedar as URL nuk është dhënë
      return NextResponse.json(
        { error: "Ju lutem ngarkoni një imazh ose jepni një URL imazhi" },
        { status: 400, headers: corsHeaders }
      );
    }

    const newEvent = new Events({
      title,
      description,
      date: normalizedDate, // Ruaj datën në UTC
      location,
      capacity: capacity ? Number(capacity) : null,
      category,
      organizer,
      image: finalImageUrl,
    });

    await newEvent.save();

    // Dërgo email njoftues te të gjithë përdoruesit
    const users = await User.find({});
    if (users.length > 0) {
      for (const user of users) {
        try {
          await sendEmail({
            to: user.email,
            subject: `Event i Ri: ${title}`,
            text: `Përshëndetje ${user.name},\n\nKemi një event të ri në UniEvents!\n\nTitulli: ${title}\nPërshkrimi: ${description || "Nuk ka përshkrim"}\nData: ${format(new Date(normalizedDate), "d MMMM yyyy, HH:mm", { locale: sq })}\nVendndodhja: ${location || "Nuk është specifikuar"}\nKategoria: ${category}\n\nShpresojmë të shihemi atje!\nEkipi UniEvents`,
            html: `<h1>Event i Ri: ${title}</h1><p>Përshëndetje ${user.name},</p><p>Kemi një event të ri në UniEvents!</p><p><strong>Titulli:</strong> ${title}<br><strong>Përshkrimi:</strong> ${description || "Nuk ka përshkrim"}<br><strong>Data:</strong> ${format(new Date(normalizedDate), "d MMMM yyyy, HH:mm", { locale: sq })}<br><strong>Vendndodhja:</strong> ${location || "Nuk është specifikuar"}<br><strong>Kategoria:</strong> ${category}</p><p>Shpresojmë të shihemi atje!</p><p>Ekipi UniEvents</p>`,
          });
          console.log(`Email u dërgua me sukses te: ${user.email}`);
        } catch (emailError) {
          console.error(`Dështoi dërgimi i emailit te ${user.email}:`, emailError);
        }
      }
    } else {
      console.warn("Nuk u gjetën përdorues për njoftim.");
    }

    // Popullo organizatorin për përgjigjen
    const populatedEvent = await Events.findById(newEvent._id).populate("organizer", "name");

    // Kthe datën në UTC
    const responseEvent = {
      ...populatedEvent.toObject(),
      date: populatedEvent.date.toISOString(),
      imageUrl: populatedEvent.image || null,
    };

    return NextResponse.json(responseEvent, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error("Gabim gjatë krijimit të eventit:", error);
    return NextResponse.json(
      { error: "Dështoi krijimi i eventit" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// GET: Merr të gjitha eventet
export async function GET(request: Request) {
  try {
    await dbConnect();

    const events = await Events.find({})
      .sort({ date: 1 })
      .populate("organizer", "name");

    const eventsWithImageUrls = events.map((event) => {
      return {
        ...event.toObject(),
        imageUrl: event.image || null,
        date: event.date.toISOString(), // Kthe datën në UTC
      };
    });

    return NextResponse.json(eventsWithImageUrls, { headers: corsHeaders });
  } catch (error) {
    console.error("Gabim gjatë marrjes së eventeve:", error);
    return NextResponse.json(
      { error: "Dështoi marrja e eventeve" },
      { status: 500, headers: corsHeaders }
    );
  }
}
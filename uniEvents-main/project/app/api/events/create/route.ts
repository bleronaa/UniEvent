import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Event from "../../models/Events";
import User from "../../models/User";
import { sendEmail } from "@/lib/sendEmail";
import mongoose from "mongoose";
import cloudinary from "cloudinary";
import { format } from "date-fns";
import { sq } from "date-fns/locale";

// Konfiguro Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const allowedOrigin = "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-user-id",
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    console.log("Database connected for event creation");

    // Merr të dhënat nga FormData
    const formData = await request.formData();
    const title = formData.get("title")?.toString().trim();
    const description = formData.get("description")?.toString();
    const date = formData.get("date")?.toString(); // Mund të jetë undefined
    const location = formData.get("location")?.toString().trim();
    const capacity = formData.get("capacity")?.toString();
    const category = formData.get("category")?.toString().trim();
    const imageFile = formData.get("image") as File | null;
    const imageUrl = formData.get("imageUrl")?.toString().trim();
    const userId = request.headers.get("x-user-id");

    console.log("FormData received:", {
      title,
      description,
      date,
      location,
      capacity,
      category,
      imageFile: imageFile ? imageFile.name : null,
      imageUrl,
      userId,
    });

    // Validimi i userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.error("Invalid userId:", userId);
      return NextResponse.json(
        { error: "ID e përdoruesit e pavlefshme" },
        { status: 400, headers: corsHeaders }
      );
    }

    const organizerUser = await User.findById(userId);
    if (!organizerUser) {
      console.error("Organizer not found for userId:", userId);
      return NextResponse.json(
        { error: "Organizatori nuk u gjet" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validimi i kategorisë
    const validCategories = ["Inxh.Kompjuterike", "Inxh.Mekanike"];
    if (!category || !validCategories.includes(category)) {
      console.error("Invalid or missing category:", category);
      return NextResponse.json(
        { error: "Ju lutem zgjidhni një kategori të vlefshme", errors: { category: "Ju lutem zgjidhni një kategori të vlefshme" } },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validimi i fushave të detyrueshme
    const errors: { [key: string]: string } = {};
    if (!title) errors.title = "Ju lutem plotësoni titullin";
    if (!date) {
      errors.date = "Ju lutem zgjidhni datën dhe kohën";
    } else {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        errors.date = "Ju lutem vendosni një datë dhe kohë të vlefshme";
      }
    }
    if (!location) errors.location = "Ju lutem plotësoni lokacionin";

    // Validimi dhe trajtimi i imazhit
    let finalImageUrl = "";
    if (imageFile && imageFile.size > 0) {
      try {
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
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
      } catch (uploadError) {
        console.error("Error uploading image to Cloudinary:", uploadError);
        errors.image = "Dështoi ngarkimi i imazhit";
      }
    } else if (imageUrl) {
      try {
        new URL(imageUrl);
        finalImageUrl = imageUrl;
        console.log("URL imazhi i dhënë:", finalImageUrl);
      } catch {
        errors.image = "Ju lutem jepni një URL të vlefshme për imazhin";
      }
    } else {
      errors.image = "Ju lutem ngarkoni një foto ose jepni URL-në e fotos";
    }

    // Kthe gabimet nëse ka
    if (Object.keys(errors).length > 0) {
      console.error("Validation errors:", errors);
      return NextResponse.json(
        { error: "Plotësoni të gjitha fushat e nevojshme", errors },
        { status: 400, headers: corsHeaders }
      );
    }

    // Krijo eventin e ri
    const event = await Event.create({
      title,
      description,
      date: new Date(date!), // Shto `!` për të treguar që `date` nuk është `undefined` pas validimit
      organizer: userId,
      location,
      capacity: capacity ? parseInt(capacity) : undefined,
      category,
      image: finalImageUrl,
      status: "pending",
    });
    console.log("Event created with ID:", event._id);

    // Dërgo email njoftues
    const users = await User.find({});
    console.log("Users found for notification:", users.length);
    if (users.length > 0) {
      for (const user of users) {
        try {
          await sendEmail({
            to: user.email,
            subject: `Event i Ri: ${title}`,
            text: `Përshëndetje ${user.name},\n\nKemi një event të ri në UniEvents!\n\nTitulli: ${title}\nPërshkrimi: ${description || "Nuk ka përshkrim"}\nData: ${format(new Date(date!), "d MMMM yyyy, H:mm", { locale: sq })}\nVendndodhja: ${location || "Nuk është specifikuar"}\nKategoria: ${category}\nOrganizatori: ${organizerUser.name}\n\nShpresojmë të shihemi atje!\nEkipi UniEvents`,
            html: `<h1>Event i Ri: ${title}</h1><p>Përshëndetje ${user.name},</p><p>Kemi një event të ri në UniEvents!</p><p><strong>Titulli:</strong> ${title}<br><strong>Përshkrimi:</strong> ${description || "Nuk ka përshkrim"}<br><strong>Data:</strong> ${format(new Date(date!), "d MMMM yyyy, H:mm", { locale: sq })}<br><strong>Vendndodhja:</strong> ${location || "Nuk është specifikuar"}<br><strong>Kategoria:</strong> ${category}<br><strong>Organizatori:</strong> ${organizerUser.name}</p><p>Shpresojmë të shihemi atje!</p><p>Ekipi UniEvents</p>`,
          });
          console.log(`Email sent successfully to: ${user.email}`);
        } catch (emailError) {
          console.error(`Failed to send email to ${user.email}:`, emailError);
        }
      }
    } else {
      console.warn("No users found to notify. Email sending skipped.");
    }

    // Popullo organizatorin për përgjigjen
    const populatedEvent = await Event.findById(event._id).populate("organizer", "name");

    // Transformo `image` në `imageUrl` për konsistencë
    const eventResponse = {
      id: populatedEvent._id,
      title: populatedEvent.title,
      description: populatedEvent.description,
      date: populatedEvent.date,
      organizer: populatedEvent.organizer,
      location: populatedEvent.location,
      capacity: populatedEvent.capacity,
      category: populatedEvent.category,
      imageUrl: populatedEvent.image, // Kthe `image` si `imageUrl`
      status: populatedEvent.status,
    };

    return NextResponse.json(
      { event: eventResponse },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Gabim gjatë krijimit të eventit:", error);
    return NextResponse.json(
      { error: "Dështoi krijimi i eventit" },
      { status: 500, headers: corsHeaders }
    );
  }
}
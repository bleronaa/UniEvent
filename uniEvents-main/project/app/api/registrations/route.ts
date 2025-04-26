import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Registrations from "../models/Registrations";
import User from "../models/User";
import Events from "../models/Events";
import { verify } from "jsonwebtoken";

// Helper: CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// OPTIONS: Për kërkesat preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// GET: Merr regjistrimet (për përdorues, admin, ose për një event specifik)
export async function GET(request: Request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      console.log("Mungon token-i i autorizimit");
      return NextResponse.json(
        { error: "Mungon token-i i autorizimit" },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;

    try {
      decoded = verify(token, process.env.JWT_SECRET as string);
      console.log("Token i dekoduar:", decoded);
    } catch (err) {
      console.log("Token i pavlefshëm ose i skaduar:", err);
      return NextResponse.json(
        { error: "Token i pavlefshëm ose i skaduar" },
        { status: 401, headers: corsHeaders }
      );
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log("Përdoruesi nuk u gjet për ID:", decoded.userId);
      return NextResponse.json(
        { error: "Përdoruesi nuk u gjet" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Kontrollo për eventId në query
    const url = new URL(request.url);
    const eventId = url.searchParams.get("eventId");

    let registrations;

    if (eventId) {
      // Kontrollo nëse përdoruesi është organizatori i eventit ose admin
      const event = await Events.findById(eventId);
      if (!event) {
        console.log("Eventi nuk u gjet për ID:", eventId);
        return NextResponse.json(
          { error: "Eventi nuk u gjet" },
          { status: 404, headers: corsHeaders }
        );
      }
      if (event.organizer.toString() !== decoded.userId && user.role !== "admin") {
        console.log(`Përdoruesi ${user.email} nuk është i autorizuar për të parë regjistrimet e eventit ${eventId}`);
        return NextResponse.json(
          { error: "Nuk ke autorizim për të parë regjistrimet e këtij eventi" },
          { status: 403, headers: corsHeaders }
        );
      }

      // Merr të gjitha regjistrimet për eventin
      registrations = await Registrations.find({ event: eventId })
        .populate("user", "name email")
        .populate("event", "title description date location capacity category")
        .sort({ createdAt: -1 });

      console.log(`U morën ${registrations.length} regjistrime për eventin ${eventId}`);
      return NextResponse.json(registrations, { headers: corsHeaders });
    }

    // Logjika për marrjen e regjistrimeve të përdoruesit ose të gjitha (për admin)
    if (user.role === "admin") {
      registrations = await Registrations.find({})
        .populate("user", "name email")
        .populate("event", "title description date location capacity category")
        .sort({ createdAt: -1 });
      console.log(`Admini ${user.email} mori ${registrations.length} regjistrime`);
    } else {
      registrations = await Registrations.find({ user: decoded.userId })
        .populate("user", "name email")
        .populate("event", "title description date location capacity category")
        .sort({ createdAt: -1 });
      console.log(`Përdoruesi ${user.email} mori ${registrations.length} regjistrime`);
    }

    return NextResponse.json(registrations, { headers: corsHeaders });
  } catch (error) {
    console.error("Gabim gjatë marrjes së regjistrimeve:", error);
    return NextResponse.json(
      { error: "Nuk u morën dot regjistrimet" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST: Regjistro përdoruesin në një event
export async function POST(request: Request) {
  try {
    await dbConnect();

    const { eventId } = await request.json();
    if (!eventId) {
      console.log("Mungon ID e eventit");
      return NextResponse.json(
        { error: "ID e eventit është e nevojshme" },
        { status: 400, headers: corsHeaders }
      );
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      console.log("Mungon token-i i autorizimit");
      return NextResponse.json(
        { error: "Mungon token-i i autorizimit" },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;

    try {
      decoded = verify(token, process.env.JWT_SECRET as string);
      console.log("Token i dekoduar:", decoded);
    } catch (err) {
      console.log("Token i pavlefshëm ose i skaduar:", err);
      return NextResponse.json(
        { error: "Token i pavlefshëm ose i skaduar" },
        { status: 401, headers: corsHeaders }
      );
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log("Përdoruesi nuk u gjet për ID:", decoded.userId);
      return NextResponse.json(
        { error: "Përdoruesi nuk u gjet" },
        { status: 404, headers: corsHeaders }
      );
    }

    const event = await Events.findById(eventId);
    if (!event) {
      console.log("Eventi nuk u gjet për ID:", eventId);
      return NextResponse.json(
        { error: "Eventi nuk u gjet" },
        { status: 404, headers: corsHeaders }
      );
    }

    if (event.registrationCount >= event.capacity) {
      console.log("Eventi është i plotë:", eventId);
      return NextResponse.json(
        { error: "Eventi është i plotë" },
        { status: 400, headers: corsHeaders }
      );
    }

    const alreadyRegistered = await Registrations.findOne({
      user: user._id,
      event: event._id,
    });

    if (alreadyRegistered) {
      console.log(`Përdoruesi ${user.email} është regjistruar tashmë për eventin ${eventId}`);
      return NextResponse.json(
        { error: "Je regjistruar tashmë për këtë event" },
        { status: 400, headers: corsHeaders }
      );
    }

    const newRegistration = new Registrations({
      user: user._id,
      event: event._id,
      status: "pending",
    });

    await newRegistration.save();

    event.registrationCount += 1;
    await event.save();

    console.log(`Përdoruesi ${user.email} u regjistrua për eventin ${eventId}`);

    return NextResponse.json(
      {
        message: "Regjistrimi u krye me sukses",
        registration: newRegistration,
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Gabim gjatë regjistrimit për eventin:", error);
    return NextResponse.json(
      { error: "Nuk u krye dot regjistrimi për eventin" },
      { status: 500, headers: corsHeaders }
    );
  }
}
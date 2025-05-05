import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Registrations from "../models/Registrations";
import User from "../models/User";
import Events from "../models/Events";
import { verify } from "jsonwebtoken";
import { cors, runMiddleware } from "@/lib/cors"; // Importo middleware-in e CORS

export async function OPTIONS() {
  // Middleware-i trajton preflight request-et
  return NextResponse.json({}, { status: 204 });
}

export async function GET(request: Request) {
  try {
    // Ekzekuto middleware-in e CORS
    await runMiddleware(request, NextResponse.next(), cors);

    await dbConnect();

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      console.log("Mungon token-i i autorizimit");
      return NextResponse.json(
        { error: "Mungon token-i i autorizimit" },
        { status: 401 }
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
        { status: 401 }
      );
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log("Përdoruesi nuk u gjet për ID:", decoded.userId);
      return NextResponse.json(
        { error: "Përdoruesi nuk u gjet" },
        { status: 404 }
      );
    }

    const url = new URL(request.url);
    const eventId = url.searchParams.get("eventId");

    if (eventId) {
      const event = await Events.findById(eventId);
      if (!event) {
        console.log("Eventi nuk u gjet për ID:", eventId);
        return NextResponse.json(
          { error: "Eventi nuk u gjet" },
          { status: 404 }
        );
      }

      if (event.organizer.toString() === decoded.userId || user.role === "admin") {
        const registrations = await Registrations.find({ event: eventId })
          .populate("user", "name email")
          .populate("event", "title description date location capacity category")
          .sort({ createdAt: -1 });

        console.log(`U morën ${registrations.length} regjistrime për eventin ${eventId}`);
        return NextResponse.json(registrations);
      }

      const registration = await Registrations.findOne({
        user: decoded.userId,
        event: eventId,
      }).populate("event", "title");

      console.log(
        `Kontroll për regjistrim: user=${decoded.userId}, event=${eventId}, isRegistered=${
          !!registration
        }, status=${registration ? registration.status : "none"}`
      );

      return NextResponse.json({
        isRegistered: !!registration,
        registration: registration ? { status: registration.status } : null,
      });
    }

    let registrations;
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

      const validRegistrations = registrations.filter((r) => r.event !== null);
      await Registrations.deleteMany({ user: decoded.userId, event: null });
      console.log(`Përdoruesi ${user.email} mori ${validRegistrations.length} regjistrime`);
      registrations = validRegistrations;
    }

    return NextResponse.json(registrations);
  } catch (error) {
    console.error("Gabim gjatë marrjes së regjistrimeve:", error);
    return NextResponse.json(
      { error: "Nuk u morën dot regjistrimet" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Ekzekuto middleware-in e CORS
    await runMiddleware(request, NextResponse.next(), cors);

    await dbConnect();

    const { eventId } = await request.json();
    if (!eventId) {
      console.log("Mungon ID e eventit");
      return NextResponse.json(
        { error: "ID e eventit është e nevojshme" },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      console.log("Mungon token-i i autorizimit");
      return NextResponse.json(
        { error: "Mungon token-i i autorizimit" },
        { status: 401 }
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
        { status: 401 }
      );
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log("Përdoruesi nuk u gjet për ID:", decoded.userId);
      return NextResponse.json(
        { error: "Përdoruesi nuk u gjet" },
        { status: 404 }
      );
    }

    const event = await Events.findById(eventId);
    if (!event) {
      console.log("Eventi nuk u gjet për ID:", eventId);
      return NextResponse.json(
        { error: "Eventi nuk u gjet" },
        { status: 404 }
      );
    }

    if (event.registrationCount >= event.capacity) {
      console.log("Eventi është i plotë:", eventId);
      return NextResponse.json(
        { error: "Eventi është i plotë" },
        { status: 400 }
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
        { status: 400 }
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
      { status: 201 }
    );
  } catch (error) {
    console.error("Gabim gjatë regjistrimit për eventin:", error);
    return NextResponse.json(
      { error: "Nuk u krye dot regjistrimi për eventin" },
      { status: 500 }
    );
  }
}
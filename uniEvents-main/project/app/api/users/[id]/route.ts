import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "../../models/User";
import mongoose from "mongoose";

// Përcakto origin-in dinamikisht bazuar në mjedis
const allowedOrigin = process.env.NEXT_PUBLIC_ALLOWED_ORIGIN ||
  (process.env.NODE_ENV === "production" ? "https://uni-event.vercel.app" : "http://localhost:3000");

// Headers të përbashkët për CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-user-id",
};

// 1. Metoda OPTIONS (për kërkesa Preflight)
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

// 2. GET: Merr një përdorues sipas ID-së
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "ID e përdoruesit është e pavlefshme" },
        { status: 400, headers: corsHeaders }
      );
    }

    const user = await User.findById(params.id).populate("organizer");
    if (!user) {
      return NextResponse.json(
        { error: "Përdoruesi nuk u gjet" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(user, { headers: corsHeaders });
  } catch (error) {
    console.error("Gabim gjatë marrjes së përdoruesit:", error);
    return NextResponse.json(
      { error: "Dështoi marrja e përdoruesit" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// 3. PUT: Përditëson një përdorues sipas ID-së
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const data = await request.json();
    const userId = request.headers.get("x-user-id");

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "ID e përdoruesit është e pavlefshme" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "ID e përdoruesit në header është e pavlefshme" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verifikoni që të dhënat janë të plota dhe të sakta
    if (!data.name || !data.email) {
      return NextResponse.json(
        { error: "Emri dhe email janë të nevojshme" },
        { status: 400, headers: corsHeaders }
      );
    }

    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json(
        { error: "Përdoruesi nuk u gjet" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Kontrollo nëse përdoruesi ka autorizim (vetëm përdoruesi vetë mund të përditësojë profilin e tij)
    if (userId !== params.id) {
      return NextResponse.json(
        { error: "Nuk ke autorizim për të përditësuar këtë përdorues" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Përditësoni përdoruesin me të dhënat e reja
    const updatedUser = await User.findByIdAndUpdate(params.id, data, {
      new: true,
      strictPopulate: false,
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Dështoi përditësimi i përdoruesit" },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(updatedUser, { headers: corsHeaders });
  } catch (error) {
    console.error("Gabim gjatë përditësimit të përdoruesit:", error);
    return NextResponse.json(
      { error: "Dështoi përditësimi i përdoruesit" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// 4. DELETE: Fshin një përdorues sipas ID-së
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const userId = request.headers.get("x-user-id");

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "ID e përdoruesit është e pavlefshme" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "ID e përdoruesit në header është e pavlefshme" },
        { status: 400, headers: corsHeaders }
      );
    }

    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json(
        { error: "Përdoruesi nuk u gjet" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Kontrollo nëse përdoruesi ka autorizim (vetëm përdoruesi vetë mund të fshijë profilin e tij)
    if (userId !== params.id) {
      return NextResponse.json(
        { error: "Nuk ke autorizim për të fshirë këtë përdorues" },
        { status: 403, headers: corsHeaders }
      );
    }

    await User.findByIdAndDelete(params.id);

    return NextResponse.json(
      { message: "Përdoruesi u fshi me sukses" },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Gabim gjatë fshirjes së përdoruesit:", error);
    return NextResponse.json(
      { error: "Dështoi fshirja e përdoruesit" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// 5. POST: Shton një përdorues të ri
export async function POST(request: Request) {
  try {
    await dbConnect();
    const data = await request.json();

    if (!data.name || !data.email || !data.role) {
      return NextResponse.json(
        { error: "Emri, email dhe roli janë të nevojshme" },
        { status: 400, headers: corsHeaders }
      );
    }

    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Përdoruesi me këtë email ekziston tashmë" },
        { status: 409, headers: corsHeaders }
      );
    }

    const newUser = await User.create(data);

    return NextResponse.json(newUser, {
      status: 201,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Gabim gjatë krijimit të përdoruesit:", error);
    return NextResponse.json(
      { error: "Dështoi krijimi i përdoruesit" },
      { status: 500, headers: corsHeaders }
    );
  }
}
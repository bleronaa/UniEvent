import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "../../models/User";
import mongoose from "mongoose";

// 1. Metoda OPTIONS (për kërkesa Preflight)
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
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
        { status: 400 }
      );
    }

    const user = await User.findById(params.id).populate("organizer");
    if (!user) {
      return NextResponse.json(
        { error: "Përdoruesi nuk u gjet" },
        { status: 404 }
      );
    }

    return NextResponse.json(user, {
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000",
      },
    });
  } catch (error) {
    console.error("Gabim gjatë marrjes së përdoruesit:", error);
    return NextResponse.json(
      { error: "Dështoi marrja e përdoruesit" },
      { status: 500 }
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
        { status: 400 }
      );
    }

    // Verifikoni që të dhënat janë të plota dhe të sakta
    if (!data.name || !data.email) {
      return NextResponse.json(
        { error: "Emri dhe email janë të nevojshme" },
        { status: 400 }
      );
    }

    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json(
        { error: "Përdoruesi nuk u gjet" },
        { status: 404 }
      );
    }

    // Përditësoni përdoruesin me të dhënat e reja
    const updatedUser = await User.findByIdAndUpdate(params.id, data, {
      new: true,
      strictPopulate: false,
    })

    return NextResponse.json(updatedUser, {
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000",
      },
    });
  } catch (error) {
    console.error("Gabim gjatë përditësimit të përdoruesit:", error);
    return NextResponse.json(
      { error: "Dështoi përditësimi i përdoruesit" },
      { status: 500 }
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
        { status: 400 }
      );
    }

    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json(
        { error: "Përdoruesi nuk u gjet" },
        { status: 404 }
      );
    }

    await User.findByIdAndDelete(params.id);

    return NextResponse.json(
      { message: "Përdoruesi u fshi me sukses" },
      {
        headers: {
          "Access-Control-Allow-Origin": "http://localhost:3000",
        },
      }
    );
  } catch (error) {
    console.error("Gabim gjatë fshirjes së përdoruesit:", error);
    return NextResponse.json(
      { error: "Dështoi fshirja e përdoruesit" },
      { status: 500 }
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
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Përdoruesi me këtë email ekziston tashmë" },
        { status: 409 }
      );
    }

    const newUser = await User.create(data);

    return NextResponse.json(newUser, {
      status: 201,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000",
      },
    });
  } catch (error) {
    console.error("Gabim gjatë krijimit të përdoruesit:", error);
    return NextResponse.json(
      { error: "Dështoi krijimi i përdoruesit" },
      { status: 500 }
    );
  }
}

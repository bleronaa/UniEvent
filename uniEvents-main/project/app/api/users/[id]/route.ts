import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "../../models/User";
import mongoose from "mongoose";

// 1. Metoda OPTIONS (për preflight requests)
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

// 2. GET: Merr një user sipas ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const user = await User.findById(params.id).populate("organizer");
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user, {
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000",
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// 3. PUT: Përditëson një user sipas ID
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
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Shembull check: A është userId organizatori?
    if (user.organizer.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updatedUser = await User.findByIdAndUpdate(params.id, data, {
      new: true,
    }).populate("organizer", "name email");

    return NextResponse.json(updatedUser, {
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000",
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// 4. DELETE: Fshin një user sipas ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const userId = request.headers.get("x-user-id");

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.organizer.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await User.findByIdAndDelete(params.id);

    return NextResponse.json(
      { message: "User deleted successfully" },
      {
        headers: {
          "Access-Control-Allow-Origin": "http://localhost:3000",
        },
      }
    );
  } catch (error) {
    console.error("Error deleting User:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

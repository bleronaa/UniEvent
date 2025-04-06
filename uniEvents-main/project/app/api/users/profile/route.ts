import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "../../models/User"; // Adjust path if needed

export async function PUT(request: Request) {
  try {
    await dbConnect();

    const userId = request.headers.get("x-user-id"); // 👈 You need to set this in your frontend request
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email } = await request.json();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

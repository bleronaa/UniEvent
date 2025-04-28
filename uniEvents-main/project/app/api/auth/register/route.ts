
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "../../models/User";
import { sign } from "jsonwebtoken";

export async function POST(request: Request) {
  try {
    await dbConnect();

    const { name, email, password, role } = await request.json();

    // Kontrollo nëse email-i është i vlefshëm për përdoruesit jo-admin
    if (role !== "admin" && !email.endsWith("@umib.net")) {
      return NextResponse.json(
        { error: "Vetëm email-et me @umib.net lejohen për regjistrim." },
        { status: 400 }
      );
    }

    // Kontrollo nëse përdoruesi ekziston tashmë
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Përdoruesi ekziston tashmë" },
        { status: 400 }
      );
    }

    // Krijo përdoruesin e ri
    const user = await User.create({
      name,
      email,
      password, // Password-i do të hashohet nga pre-save hook në User model
      role: role || "student",
    });

    // Gjenero JWT token
    const token = sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return NextResponse.json(
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Dështoi regjistrimi i përdoruesit" },
      { status: 500 }
    );
  }
}
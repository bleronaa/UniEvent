import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "../../models/User";
import { sign } from "jsonwebtoken";
import { sendEmail } from "@/lib/sendEmail";

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

    // Dërgo email falenderues
    await sendEmail({
      to: email,
      subject: "Mirë se vini në UniEvents!",
      text: `Përshëndetje ${name},\n\nFaleminderit që u regjistruat në UniEvents! Tani mund të hyni dhe të merrni pjesë në eventet tona.\n\nMe respekt,\nEkipi UniEvents`,
      html: `<h1>Mirë se vini në UniEvents!</h1><p>Përshëndetje ${name},</p><p>Faleminderit që u regjistruat në UniEvents! Tani mund të hyni dhe të merrni pjesë në eventet tona.</p><p>Me respekt,<br>Ekipi UniEvents</p>`,
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
    console.error("Gabim gjatë regjistrimit:", error);
    return NextResponse.json(
      { error: "Dështoi regjistrimi i përdoruesit" },
      { status: 500 }
    );
  }
}
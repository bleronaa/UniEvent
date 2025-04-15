import { NextResponse } from "next/server";
import Registrations from "../../models/Registrations";

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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
      const { status } = await request.json();
      const registration = await Registrations.findById(params.id);
  
      if (!registration) {
        return NextResponse.json({ error: "Registration not found" }, { status: 404 });
      }
  
      registration.status = status;
      await registration.save();
  
    
  return NextResponse.json(registration, {
    headers: {
      "Access-Control-Allow-Origin": "http://localhost:3000",
    },
  });
} catch (error) {
  console.error("Error updating event:", error);
  return NextResponse.json(
    { error: "Failed to update event" },
    { status: 500 }
  );
}
}
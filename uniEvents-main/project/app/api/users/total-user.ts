import dbConnect from "@/lib/db"; 
import User from "../models/User"; 
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbConnect();
    const totalUsers = await User.countDocuments();
    return NextResponse.json({ totalUsers }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch total users' }, { status: 500 });
  }
}

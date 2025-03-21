import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import Event from '../models/Events';
import Registration from '../models/Registrations';

const SECRET_KEY = process.env.JWT_SECRET!; 

// Function to extract user ID from JWT
function getUserIdFromToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1]; // Extract token after 'Bearer'
  try {
    const decoded = jwt.verify(token, SECRET_KEY) as { userId: string };
    return decoded.userId;
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    // Extract user ID from the token
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await request.json();

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
     // Check if the user has already registered for this event
     const existingRegistration = await Registration.findOne({ user: userId, event: eventId });
     if (existingRegistration) {
       return NextResponse.json({ error: 'You have already applied for this event.' }, { status: 400 });
     }

    // Check capacity
    const registrationCount = await Registration.countDocuments({ event: eventId });
    if (event.capacity && registrationCount >= event.capacity) {
      return NextResponse.json({ error: 'Event is full' }, { status: 400 });
    }

    // Create registration
    const registration = await Registration.create({
      user: userId,
      event: eventId,
      status: 'confirmed'
    });

    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to register for event' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect();

    // Extract user ID from the token
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's registrations
    const registrations = await Registration.find({ user: userId })
      .populate('event')
      .sort({ createdAt: -1 });

    return NextResponse.json(registrations);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
  }
}

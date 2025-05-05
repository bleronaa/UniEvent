import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/app/api/models/User';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { cors, runMiddleware } from '@/lib/cors'; // Importo middleware-in e CORS

export async function OPTIONS() {
// Middleware-i trajton request-et OPTIONS
return NextResponse.json({}, { status: 200 });
}

export async function POST(request: Request) {
try {
// Ekzekuto middleware-in e CORS
await runMiddleware(request, NextResponse.next(), cors);

await dbConnect();
const { email, password } = await request.json();

console.log("Login Attempt:", email); // Debugging Log

// Allowed admin emails
const allowedAdmins = [
"blerona.tmava@umib.net",
"habibtmava06@gmail.com"
];

// Find user in the database
const user = await User.findOne({ email });

if (!user) {
console.log("User not found"); // Debugging Log
return NextResponse.json({ error: "User not found" }, { status: 401 });
}

if (!allowedAdmins.includes(user.email)) {
console.log("Unauthorized admin email"); // Debugging Log
return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
}

// Verify password
const isValid = await compare(password, user.password);
if (!isValid) {
console.log("Invalid password"); // Debugging Log
return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}

console.log("Login successful!"); // Debugging Log

// Generate JWT token
const token = sign(
{ userId: user._id, email: user.email, role: user.role },
process.env.JWT_SECRET!,
{ expiresIn: "7d" }
);

return NextResponse.json({
token,
user: {
id: user._id,
name: user.name,
email: user.email,
role: user.role
}
});
} catch (error) {
console.error('Error in admin-login:', error);
return NextResponse.json(
{ error: 'Login failed' },
{ status: 500 }
);
}
}

export async function GET(request: Request) {
try {
// Ekzekuto middleware-in e CORS
await runMiddleware(request, NextResponse.next(), cors);

await dbConnect();

// Find all users with the 'admin' role
const admins = await User.find({ role: 'admin' });

if (!admins || admins.length === 0) {
return NextResponse.json({ error: 'No admins found' }, { status: 404 });
}

// Return the list of admins
return NextResponse.json(admins, { status: 200 });
} catch (error) {
console.error('Error retrieving admins:', error);
return NextResponse.json({ error: 'Failed to retrieve admins' }, { status: 500 });
}
}
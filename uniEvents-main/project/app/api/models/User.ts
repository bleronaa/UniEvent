import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

// User Schema with Role-based Admin and Student
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['student', 'staff', 'computer_engineering', 'mechanical_engineering', 'admin'], 
        default: 'student' 
    }
});

// Hash the password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Create the 3 admin users if they don't exist already
UserSchema.statics.createAdmins = async function() {
    const admins = [
        { name: 'Admin ', email: 'blerona.tmava@umib.net', password: 'Umib.2025', role: 'admin' },
        { name: 'Admin ', email: 'habib.tmava@umib.net', password: 'Umib.2025', role: 'admin' },
        { name: 'SuperAdmin', email: 'bleronatmava12@gmail.com', password: 'Umib.2025', role: 'staff' }
    ];

    for (const admin of admins) {
        // Check if admin already exists
        const existingAdmin = await this.findOne({ email: admin.email });
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash(admin.password, 10);
            await this.create({
                name: admin.name,
                email: admin.email,
                password: hashedPassword,
                role: admin.role
            });
        }
    }
};

export default mongoose.models.User || mongoose.model('User', UserSchema);

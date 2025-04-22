import mongoose, { Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

// Define interface for User document
interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  role: "student" | "staff" | "computer_engineering" | "mechanical_engineering" | "admin";
  googleId?:string;
}

// Define interface for static methods
interface IUserModel extends Model<IUser> {
  createAdmins: () => Promise<void>;
}

// User Schema with Role-based Admin and Student
const UserSchema: Schema<IUser> = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["student", "staff", "computer_engineering", "mechanical_engineering", "admin"],
    default: "student",
    googleId:{type:String, unique:true, sparse: true}
  },
});

// Hash the password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Create admin users if they don't exist already
UserSchema.statics.createAdmins = async function () {
  const admins = [
    { name: "Blerona", email: "blerona.tmava@umib.net", password: "12345678", role: "admin" },
    { name: "Blerona", email: "bleronatmava12@gmail.com", password: "12345678", role: "admin" },
    { name: "Habib ", email: "habibtmava06@gmail.com", password: "12345678", role: "admin" },
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
        role: admin.role,
      });
      console.log(`Created admin: ${admin.email}`);
    } else {
      // Update existing admin with new password and role
      const hashedPassword = await bcrypt.hash(admin.password, 10);
      await this.updateOne(
        { email: admin.email },
        {
          $set: {
            name: admin.name,
            password: hashedPassword,
            role: admin.role,
          },
        }
      );
      console.log(`Updated admin: ${admin.email}`);
    }
  }
};

// Create the User model with the specified interfaces
export default mongoose.models.User || mongoose.model<IUser, IUserModel>("User", UserSchema);
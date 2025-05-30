import mongoose from "mongoose";
import User from "./User";


const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  date: { type: Date, required: true },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  location: { type: String, required: true },
  capacity: Number,
  category: {
    type: String,
    required: true,
    enum: ["Inxh.Kompjuterike", "Inxh.Mekanike"], // Restricting category to these values
  },
  image:{ type: String, required: true }, // Add the image field
  createdAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
});

export default mongoose.models.Event || mongoose.model("Event", EventSchema);

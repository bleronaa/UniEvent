import mongoose from "mongoose";
import User from "./User";


const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  descriptions: String,
  date: { type: Date, required: true },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  location: String,
  capacity: Number,
  category: {
    type: String,
    required: true,
    enum: ["Inxh.Kompjuterike", "Inxh.Mekanike"], // Restricting category to these values
  },
  image: String, // Add the image field
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Event || mongoose.model("Event", EventSchema);

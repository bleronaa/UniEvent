import mongoose from "mongoose";

const RegistrationSchema= new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    event:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Event",
        required:true,
    },
    status:{
        type:String,
        enum:['pending','confirmed', 'cancelled'],
        default:'pending',
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
})

// Ensure one user can only register once for an event

RegistrationSchema.index({user:1, event:1},{unique:true})

export default mongoose.models.Registration || mongoose.model("Registration", RegistrationSchema)
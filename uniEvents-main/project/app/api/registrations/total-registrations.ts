// // /pages/api/registrations/total-registrations.ts në UniEvents
import dbConnect from "@/lib/db"; 
import Registration from "../models/Registrations"; 
import { NextApiRequest, NextApiResponse } from 'next';
import cors from '../../middleware'; 
import { runMiddleware } from '../../middleware'; 




export default async function handler (req: NextApiRequest, res: NextApiResponse) {
   await runMiddleware(req, res, cors); 
  if (req.method === "GET") {
    try {
      await dbConnect();
      const totalRegistrations = await Registration.countDocuments(); // Numëron regjistrimet
      res.status(200).json({ total: totalRegistrations });
    } catch (error) {
      res.status(500).json({ message: "Error on server", error });
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}

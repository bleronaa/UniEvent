import { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";

// 1. Krijojmë instancën e CORS me rregullat e dëshiruara
const cors = Cors({
  methods: ["GET", "POST", "PUT", "DELETE"],
  // Hiq shenjën "/" në fund
  origin: "http://localhost:3000/",
  // (opsionale) Nëse ke nevojë për credenitals (cookies, headers, etj.)
  // credentials: true,
  // (opsionale) Statusi i suksesshëm për preflight
  optionsSuccessStatus: 200,
});

// 2. Funksion ndihmës për të ekzekutuar middleware në stilin e Next.js
function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: any // fn mund të jetë çdo funksion middleware
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: unknown) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// 3. Kjo është “handler” i cili do të përdoret si endpoint
//    Nëse dëshiron ta përdorësh si /api/events, atëherë vendose këtë kod brenda pages/api/events.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Ekzekuto CORS middleware
    await runMiddleware(req, res, cors);

    // Kthe një përgjigje të thjeshtë për ta testuar
    // (ose kthe eventet nga databaza, etj.)
    res.status(200).json({ message: "CORS is enabled and it works!" });
  } catch (error) {
    console.error("Error enabling CORS:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
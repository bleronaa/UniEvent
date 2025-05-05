import { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";

// Përdorim true për të lejuar të gjitha originat
const cors = Cors({
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  origin: true, // Lejo të gjitha originat
  credentials: true,
});

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: unknown) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await runMiddleware(req, res, cors);
    res.status(200).json({ message: "CORS is enabled and it works!" });
  } catch (error) {
    console.error("Error enabling CORS:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

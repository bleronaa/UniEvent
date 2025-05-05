import Cors from "cors";
import { NextApiRequest, NextApiResponse } from "next";

// Përdorim true për të lejuar të gjitha originat
const cors = Cors({
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  origin: true, // Lejo të gjitha originat
  credentials: true,
});

export function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
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

export default cors;

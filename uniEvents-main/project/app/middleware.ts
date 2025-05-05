import { NextApiRequest, NextApiResponse } from 'next';
import { cors, runMiddleware } from '@/lib/cors'; // Importo nga cors.ts

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Ekzekuto middleware-in e CORS
    await runMiddleware(req, res, cors);
    res.status(200).json({ message: 'CORS is enabled and it works!' });
  } catch (error) {
    console.error('Error enabling CORS:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
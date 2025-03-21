// lib/cors.ts

import Cors from 'cors';

// Konfiguroni CORS
export const cors = Cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  origin: 'http://localhost:3000',  // Ky është frontend juaj, mund ta ndryshoni sipas nevojës
});

// Përdorni këtë helper për të drejtuar kërkesat përmes CORS middleware
export const runMiddleware = (
  req: any, 
  res: any, 
  fn: (req: any, res: any, next: (result: any) => void) => void
) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

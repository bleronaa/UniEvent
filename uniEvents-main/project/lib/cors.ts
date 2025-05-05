import Cors from 'cors';

// Përcakto origin-in dinamikisht bazuar në mjedis
const allowedOrigin = process.env.NEXT_PUBLIC_ALLOWED_ORIGIN ||
  (process.env.NODE_ENV === "production" ? "https://uni-event.vercel.app" : "http://localhost:3000");

// Konfiguroni CORS
export const cors = Cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  origin: allowedOrigin, // Përdor origin-in dinamik
  credentials: true, // Opsionale: nëse përdorni kredenciale (cookies, Authorization headers)
});

// Përdorni këtë helper për të drejtuar kërkesat përmes CORS middleware
export const runMiddleware = (
  req: any,
  res: any,
  fn: (req: any, res: any, next: (result?: any) => void) => void
): Promise<any> => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};
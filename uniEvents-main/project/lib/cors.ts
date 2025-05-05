import Cors from 'cors';

// Lista e origjinave të lejuara
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      process.env.NODE_ENV === 'production' ? 'https://uni-event.vercel.app' : 'http://localhost:3001',
      'https://adminevents.vercel.app', // Shto origjinën e frontend-it të adminit
      'http://localhost:3000', // Opsionale: për zhvillim lokal të adminit
    ];

// Konfiguroni CORS
export const cors = Cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  origin: (origin, callback) => {
    // Debugging: Shiko origjinën e request-it
    console.log('Request Origin:', origin);
    // Lejo origjina të specifikuara ose request-et pa origjinë (si Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Aktivizo për kredenciale (cookies, headers)
});

// Helper për të ekzekutuar middleware
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
import app from "../artifacts/api-server/src/app";

// The Express app does its own body parsing (express.json/urlencoded) —
// disable Vercel's automatic body parsing so the raw request stream reaches
// Express untouched.
export const config = {
  api: {
    bodyParser: false,
  },
};

export default app;

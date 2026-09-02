// @ts-ignore — dist-fn/app.cjs is a plain JS bundle produced by esbuild at
// build time, it has no .d.ts declaration file.
import app from "../artifacts/api-server/dist-fn/app.cjs";

// The Express app does its own body parsing (express.json/urlencoded) —
// disable Vercel's automatic body parsing so the raw request stream reaches
// Express untouched.
export const config = {
  api: {
    bodyParser: false,
  },
};

export default app;

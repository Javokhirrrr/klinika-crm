import app from '../src/app.js';
import { connectDB } from '../src/db/connect.js';

// Vercel serverless function entry point
export default async function handler(req, res) {
    // Connect to database (memoized internally by mongoose, so safe to call repeatedly)
    await connectDB();

    // Forward request to Express app
    return app(req, res);
}

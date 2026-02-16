// src/db/connect.js
import mongoose from 'mongoose';
import { env } from '../config/env.js';

export async function connectDB() {
    if (!env.mongoUri) throw new Error('MONGO_URI is not set');

    mongoose.set('strictQuery', true);

    // Force database name 'klinika_prod' regardless of connection string
    await mongoose.connect(env.mongoUri, {
        dbName: 'klinika_prod',
    });

    console.log('✅ MongoDB connected to klinika_prod');
}
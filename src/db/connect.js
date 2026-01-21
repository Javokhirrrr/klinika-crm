import mongoose from 'mongoose';
import { env } from '../config/env.js';


export async function connectDB() {
if (!env.mongoUri) throw new Error('MONGO_URI is not set');
mongoose.set('strictQuery', true);
await mongoose.connect(env.mongoUri);
console.log('MongoDB connected');
}



// Keyingi bosqich (Step 2) reja:

// Users & Patients CRUD (soft-delete + search),

// Swagger UI (OpenAPI) qo‘shish,

// authorize(['admin', ...]) bilan RBAC ni endpointlarga ulash.

// Agar hozir ishga tushirganda biror xato chiqsa, log’ni yuboring — darhol tuzataman. Step 2’ga o‘taylikmi?
import { Schema, model } from 'mongoose';


const tokenSchema = new Schema({
userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
tokenId: { type: String, required: true, unique: true, index: true },
isRevoked: { type: Boolean, default: false, index: true },
createdAt: { type: Date, default: Date.now, index: true },
});


export const Token = model('Token', tokenSchema);
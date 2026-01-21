import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middlewares/auth.js';
import { Patient } from '../models/Patient.js';
import { uploadBuffer } from '../services/storage/s3.js';
import { nanoid } from 'nanoid';


const r = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });


r.post('/:id/attachments', authenticate, authorize(['admin','reception','doctor']), upload.single('file'), async (req, res) => {
const p = await Patient.findById(req.params.id);
if (!p || p.isDeleted) return res.status(404).json({ message: 'Patient not found' });
if (!req.file) return res.status(400).json({ message: 'File is required' });


const ext = (req.file.originalname.split('.').pop() || '').toLowerCase();
const key = `patients/${p._id}/${Date.now()}-${nanoid(6)}.${ext || 'bin'}`;
const up = await uploadBuffer({
bucket: process.env.S3_BUCKET,
key,
buffer: req.file.buffer,
contentType: req.file.mimetype || 'application/octet-stream'
});


p.attachments.push({ url: up.url, type: req.file.mimetype || 'file', uploadedAt: new Date() });
await p.save();
res.status(201).json({ url: up.url });
});


export default r;
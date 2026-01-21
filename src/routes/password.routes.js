import { Router } from 'express';
import * as ctrl from '../controllers/password.controller.js';


const r = Router();


r.post('/forgot-password', ctrl.forgotPassword);
r.post('/reset-password', ctrl.resetPassword);


export default r;
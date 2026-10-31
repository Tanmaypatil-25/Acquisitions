import { signup } from '#controllers/auth.controller.js';
import express from 'express';

const authRoutes = express.Router();

authRoutes.post('/sign-up', signup);

authRoutes.post('/sign-in', (req, res) => {
  res.send('POST /api/auth/sign-in response');
});

authRoutes.post('/sign-out', (req, res) => {
  res.send('POST /api/auth/sign-out response');
});

export default authRoutes;
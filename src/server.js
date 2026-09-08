import 'dotenv/config';
import dns from 'dns';
import express from 'express';
import cors from 'cors';
import { errors } from 'celebrate';
import cookieParser from 'cookie-parser';

import { connectMongoDB } from './db/connectMongoDB.js';

import { logger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

import notesRoutes from './routes/notesRoutes.js';
import authRoutes from './routes/authRoutes.js';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();

const PORT = process.env.PORT || 3000;

app.use(logger);
app.use(express.json());
app.use(cookieParser());
app.use(cors());

app.use(authRoutes);
app.use(notesRoutes);

app.use(notFoundHandler);
app.use(errors());
app.use(errorHandler);

const startServer = async () => {
await connectMongoDB();

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
};



startServer();

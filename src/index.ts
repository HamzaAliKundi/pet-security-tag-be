import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import connectDB from './config';
import { env } from './config/env';

connectDB();

const app: Express = express();

app.use(cors({
  origin: [
    'http://localhost:5173', // Main frontend
    'http://localhost:5174', // User dashboard
    'http://localhost:5175', // Admin panel (if different port)
    'https://admin.digitaltails.com', 
    'https://user.digitaltails.com', 
    'https://digitaltails.com'
  ],
  credentials: true
}));

app.use(helmet());
app.use(morgan('dev'));

// Stripe webhook needs raw body for signature verification
// This must be BEFORE express.json() middleware
app.use('/api/v1/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/ping', (req, res) => res.json({ message: 'server is running.' }));
app.use('/api/v1', routes);

app.use(errorHandler);

app.listen(env.PORT, () => console.log(`Server is running on port ${env.PORT}`));

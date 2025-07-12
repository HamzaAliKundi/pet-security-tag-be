import express, { Express } from 'express';
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
  origin: ['http://localhost:5173', 'https://pet-security-tag-dashboard.vercel.app', 'https://pet-security-admin.vercel.app'],
  credentials: true
}));

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/ping', (req, res) => res.json({ message: 'server is running' }));
app.use('/api/v1', routes);

app.use(errorHandler);

app.listen(env.PORT, () => console.log(`Server is running on port ${env.PORT}`));

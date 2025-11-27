import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { env } from '../config/env';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as unknown as { _id: string };
    const user = await User.findById(decoded._id).select('-password');
        
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Invalid token' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

// Optional auth middleware - sets req.user if token is valid, but doesn't fail if token is missing
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      // No token provided - continue without authentication (public route)
      next();
      return;
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as unknown as { _id: string };
      const user = await User.findById(decoded._id).select('-password');
      
      if (user) {
        req.user = user;
      }
    } catch (tokenError) {
      // Invalid token - continue without authentication (don't fail, just proceed without req.user)
      console.log('Optional auth: Invalid token, proceeding without authentication');
    }

    next();
  } catch (error) {
    // Any other error - continue without authentication
    next();
  }
};
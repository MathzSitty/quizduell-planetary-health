// backend/src/utils/jwt.util.ts
import jwt, { SignOptions, JwtPayload as VerifiedJwtPayload } from 'jsonwebtoken';
import config from '../config';
import crypto from 'crypto';

// Definiere den Typ für unser Payload-Objekt klarer
interface CustomJwtPayload {
  userId: string;
  role: string; // Oder dein spezifischer Rollen-Enum-Typ von Prisma
}

export const generateToken = (payload: CustomJwtPayload): string => {
  if (!config.jwtSecret) {
    console.error('FATAL ERROR: JWT_SECRET is not defined. Cannot sign token.');
    throw new Error('JWT_SECRET is not configured, unable to sign token.');
  }

  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  };

  return jwt.sign(payload, config.jwtSecret, options);
};

export const verifyToken = (token: string): CustomJwtPayload & VerifiedJwtPayload | null => {
  if (!config.jwtSecret) {
    console.error('FATAL ERROR: JWT_SECRET is not defined. Cannot verify token.');
    return null;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as CustomJwtPayload & VerifiedJwtPayload;
    
    if (decoded && typeof decoded.userId === 'string' && typeof decoded.role === 'string') {
      return decoded;
    }
    console.warn('JWT verification: Decoded token is missing expected fields (userId, role).');
    return null;

  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      console.log('JWT Token expired.');
    } else if (error.name === 'JsonWebTokenError') {
      console.log('JWT Error:', error.message);
    } else {
      console.error('Unknown JWT error:', error);
    }
    return null;
  }
};

/**
 * Generiert einen CSRF-Token mit hoher Entropie
 * @returns String mit 64 Hex-Zeichen (32 Bytes)
 */
export const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Validiert einen CSRF-Token gegen einen gespeicherten Token
 * Verwendet einen zeitkonstanten Vergleich zum Schutz vor Timing-Angriffen
 * 
 * @param token Der vom Client gesendete Token
 * @param storedToken Der im Server gespeicherte Token
 * @returns Boolean, der angibt, ob die Tokens übereinstimmen
 */
export const validateCsrfToken = (token: string, storedToken: string): boolean => {
  try {
    // Konvertiere Strings in Buffer für den zeitkonstanten Vergleich
    const tokenBuffer = Buffer.from(token, 'hex');
    const storedTokenBuffer = Buffer.from(storedToken, 'hex');
    
    // Stelle sicher, dass beide Buffer die gleiche Länge haben
    if (tokenBuffer.length !== storedTokenBuffer.length) {
      return false;
    }
    
    // Führe einen zeitkonstanten Vergleich durch, um Timing-Angriffe zu verhindern
    return crypto.timingSafeEqual(tokenBuffer, storedTokenBuffer);
  } catch (error) {
    console.error('Error validating CSRF token:', error);
    return false;
  }
};

/**
 * Erstellt einen JWT-Token, der zusätzlich einen CSRF-Token enthält
 * Dies ermöglicht Double-Submit-Cookie CSRF-Schutz
 * 
 * @param payload Die Nutzdaten für den JWT
 * @param csrfToken Der zu inkludierende CSRF-Token
 * @returns String mit dem JWT
 */
export const generateTokenWithCsrf = (payload: CustomJwtPayload, csrfToken: string): string => {
  if (!config.jwtSecret) {
    console.error('FATAL ERROR: JWT_SECRET is not defined. Cannot sign token.');
    throw new Error('JWT_SECRET is not configured, unable to sign token.');
  }

  const payloadWithCsrf = {
    ...payload,
    csrf: csrfToken
  };

  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  };

  return jwt.sign(payloadWithCsrf, config.jwtSecret, options);
};
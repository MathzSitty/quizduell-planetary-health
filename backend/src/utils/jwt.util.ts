// backend/src/utils/jwt.util.ts
import jwt, { SignOptions, JwtPayload as VerifiedJwtPayload } from 'jsonwebtoken'; // JwtPayload umbenannt, um Konflikt zu vermeiden
import config from '../config'; // Stelle sicher, dass config.jwtSecret hier als string ankommt

// Definiere den Typ für unser Payload-Objekt klarer
interface CustomJwtPayload {
  userId: string;
  role: string; // Oder dein spezifischer Rollen-Enum-Typ von Prisma
}

export const generateToken = (payload: CustomJwtPayload): string => {
  // Stelle sicher, dass jwtSecret ein String ist.
  // In config/index.ts sollte dies bereits sichergestellt sein,
  // aber eine zusätzliche Prüfung hier schadet nicht oder wir verlassen uns auf die Config.
  if (!config.jwtSecret) {
    // Dieser Fall sollte idealerweise nie eintreten, wenn die Config richtig geladen wird
    // und das Programm bei fehlendem Secret abbricht.
    console.error('FATAL ERROR: JWT_SECRET is not defined. Cannot sign token.');
    throw new Error('JWT_SECRET is not configured, unable to sign token.');
  }

  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    // algorithm: 'HS256' // Standardmäßig HS256, wenn Secret ein String ist. Kann explizit gesetzt werden.
  };

  // jwt.sign erwartet, dass das Payload ein Objekt ist, das in JSON umgewandelt werden kann.
  // Unser CustomJwtPayload ist bereits so ein Objekt.
  return jwt.sign(payload, config.jwtSecret, options);
};

// Wir benennen VerifiedJwtPayload, um klarzustellen, dass es von jwt.verify kommt
// und potenziell mehr Felder enthalten kann als unser CustomJwtPayload.
export const verifyToken = (token: string): CustomJwtPayload & VerifiedJwtPayload | null => {
  if (!config.jwtSecret) {
    console.error('FATAL ERROR: JWT_SECRET is not defined. Cannot verify token.');
    return null; // Oder wirf einen Fehler
  }

  try {
    // TypeScript muss wissen, dass das Ergebnis unserem Payload-Typ entspricht (oder ein Teil davon ist).
    // Wir verwenden eine Typ-Assertion, aber sei vorsichtig damit.
    // Besser wäre eine Validierung des dekodierten Objekts.
    const decoded = jwt.verify(token, config.jwtSecret) as CustomJwtPayload & VerifiedJwtPayload;
    
    // Zusätzliche Prüfung, ob die erwarteten Felder vorhanden sind
    if (decoded && typeof decoded.userId === 'string' && typeof decoded.role === 'string') {
        return decoded;
    }
    console.warn('JWT verification: Decoded token is missing expected fields (userId, role).');
    return null;

  } catch (error: any) {
    // console.error('JWT Verification Error:', error.message); // Für Debugging
    if (error.name === 'TokenExpiredError') {
      console.log('JWT Token expired.');
    } else if (error.name === 'JsonWebTokenError') {
      console.log('JWT Error:', error.message);
    } else {
      console.error('JWT Unknown Verification Error:', error);
    }
    return null;
  }
};
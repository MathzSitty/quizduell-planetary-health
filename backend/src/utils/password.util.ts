// backend/src/utils/password.util.ts
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
    plainTextPassword: string,
    hashedPassword: string,
): Promise<boolean> => {
    return bcrypt.compare(plainTextPassword, hashedPassword);
};
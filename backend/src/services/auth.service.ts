import { PrismaClient, User } from '@prisma/client';
import { Role } from '../types/enums';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateToken } from '../utils/jwt.util';
import { AppError } from '../utils/AppError'; // Eine Custom Error Klasse wäre gut

const prisma = new PrismaClient();

interface RegisterInput {
    name: string;
    email: string;
    password: string;
    uniHandle?: string;
}

interface LoginInput {
    email: string;
    password: string;
}

interface AuthResponse {
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
        uniHandle?: string | null;
        role: Role;
        score: number;
    };
}

export const registerUserService = async (input: RegisterInput): Promise<AuthResponse> => {
    const { name, email, password, uniHandle } = input;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new AppError('Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.', 409);
    }

    if (password.length < 6) {
        throw new AppError('Das Passwort muss mindestens 6 Zeichen lang sein.', 400);
    }

    const hashedPassword = await hashPassword(password);

    // Der erste registrierte Benutzer wird Admin (einfache Logik für den Start)
    // In einer echten Anwendung würde man dies anders handhaben (z.B. manuell oder über Invite)
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? Role.ADMIN : Role.USER;

    const newUser = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            uniHandle: uniHandle || null,
            role,
        },
    });

    const tokenPayload = { userId: newUser.id, role: newUser.role };
    const token = generateToken(tokenPayload);

    return {
        token,
        user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            uniHandle: newUser.uniHandle,
            role: newUser.role as Role,
            score: newUser.score,
        },
    };
};

export const loginUserService = async (input: LoginInput): Promise<AuthResponse> => {
    const { email, password } = input;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new AppError('Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort.', 401);
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
        throw new AppError('Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort.', 401);
    }

    const tokenPayload = { userId: user.id, role: user.role };
    const token = generateToken(tokenPayload);

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            uniHandle: user.uniHandle,
            role: user.role as Role,
            score: user.score,
        },
    };
};
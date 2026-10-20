import jwt from 'jsonwebtoken';
import { Request } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'hagah_jwt_secret_key_2026';

export interface AuthUserPayload {
  id: number;
  email: string;
  name: string;
}

export function generateToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): AuthUserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUserPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Extrai o identificador do usuário a partir dos headers de autenticação
 * Se não houver token válido ou for modo visitante, retorna 'guest' ou o userId autenticado
 */
export function getActiveUserIdentifier(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded?.id) {
      return String(decoded.id);
    }
  }

  // Header opcional x-user-id para requisições com 'guest'
  const customUserId = req.headers['x-user-id'];
  if (typeof customUserId === 'string' && customUserId.trim()) {
    return customUserId.trim();
  }

  return 'guest';
}

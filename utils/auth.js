import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

/**
 * Extracts the user payload from the auth_token cookie
 * Returns null if token is missing or invalid
 */
export const getUserFromCookie = () => {
  try {
    const token = cookies().get('auth_token')?.value;
    if (!token) return null;
    
    // In Edge middleware we use jose, but in standard Node APIs (like these route.js files)
    // we can safely use jsonwebtoken
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev_only');
    return decoded;
  } catch (error) {
    return null;
  }
};

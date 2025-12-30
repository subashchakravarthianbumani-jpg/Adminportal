import jwt from 'jsonwebtoken'

import db from '../apps/db'

import { getCache, setCache, deleteCache } from '../apps/cache';

const SECRET_KEY = process.env.SECRET_KEY

export const validateToken = async (req) => {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.split(' ')[1]

  if (!token) throw new Error('Unauthorized')

  const cacheKey = `token:${token}`;

  const cached = getCache(cacheKey);

  if (cached) {

    if (new Date(cached.ValidUntil) < new Date()) {

      deleteCache(cacheKey);
      throw new Error('Unauthorized');
    }

    return cached.decoded;
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] })

    const rows = await db.query(
      'SELECT ValidUntil FROM tokens WHERE Token = ? AND IsActive = 1 LIMIT 1',
      [token]
    );

    setCache(cacheKey, { decoded, ValidUntil: rows[0].ValidUntil });

    if (!rows || rows.length === 0) throw new Error('Unauthorized')

     const { ValidUntil } = rows[0];

     if (new Date(ValidUntil) < new Date()) {
      deleteCache(cacheKey);
      throw new Error('Unauthorized');
    }

    const ttlMs = new Date(ValidUntil).getTime() - Date.now();

    if (ttlMs > 0) {
      setCache(
        cacheKey,
        { decoded, ValidUntil },
        ttlMs
      );
    }

    return decoded
  } catch (err) {
    console.error('JWT Validation Error:', err.message)
    deleteCache(cacheKey);
    throw new Error('Unauthorized')
  }
}

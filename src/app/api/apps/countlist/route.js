export const dynamic = 'force-dynamic';

import db from '../db';
import { validateToken } from '../validateToken';
import { getCache, setCache, DEFAULT_TTL } from '../cache';

export async function GET(req) {
  try {
    // Validate token
    const user = await validateToken(req);

    const cacheKey = `countlist`;

    // Check Cache
    const cached = getCache(cacheKey);

    if (cached) {
      return new Response(JSON.stringify({
        status: true,
        ...cached
      }), { status: 200 });
    }

    // Queries
    const [Overall] = await db.query(`CALL Account_SP_GetDailyReportCounts()`);
    const [ExhibitorType] = await db.query(`CALL Account_SP_GetDailyReportExhibitorsTypeCounts()`);
    const [CheckIn] = await db.query(`CALL Account_SP_GetCheckInCounts()`);

    // Response Data
    const responseData = {
      Overall,
      ExhibitorType,
      CheckIn,
    };

    // Set Cache
    setCache(cacheKey, responseData, DEFAULT_TTL);

    // Return Live Result
    return new Response(JSON.stringify({
      status: true,
      ...responseData
    }), { status: 200 });

  } catch (err) {
    console.error('Error in GET API:', err.message);

    return new Response(JSON.stringify({
      status: false,
      message: err.message || 'Internal Server Error'
    }), { status: err.status || 500 });
  }
}

export const dynamic = 'force-dynamic';
import db from '../db'
import { getCache, setCache, DEFAULT_TTL } from '../cache';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function GET(req) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('intervalType')

    if (!type) {
      return new Response(
        JSON.stringify({
          status: false,
          message: 'Interval type is required'
        }),
        { status: 400, headers: corsHeaders }
      )
    }

    const cacheKey = `interval:${type}`;
    const cached = getCache(cacheKey);

    if (cached) {
      return new Response(JSON.stringify(cached), { status: 200, headers: corsHeaders });
    }

    // SQL query for the stored procedure
    const sql = 'CALL Settings_SP_GetLastIntervalsCount(?)'
    const results = await db.query(sql, [type])

    const responseData = {
      status: true,
      message: 'Intervals fetched successfully',
      data: results
    };

    // Set cache
    setCache(cacheKey, responseData, DEFAULT_TTL);

    // Return success response
    return new Response(
      JSON.stringify({
        status: true,
        message: 'Intervals fetched successfully',
        data: results
      }),
      { status: 200, headers: corsHeaders }
    )
  } catch (err) {
    console.error('Error fetching Intervals list:', err)

    return new Response(
      JSON.stringify({
        status: false,
        message: 'An error occurred while fetching the Intervals list',
        error: err.message
      }),
      { status: 500, headers: corsHeaders }
    )
  }
}

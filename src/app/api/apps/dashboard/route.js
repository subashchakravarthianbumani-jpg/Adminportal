export const dynamic = 'force-dynamic';
import jwt from 'jsonwebtoken' // Use jwt library for token validation

import db from '../db'

import { validateToken } from '../validateToken'

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
    // Validate token
    const user = await validateToken(req)

    const cacheKey = `dashboardcounts`;

     const cached = getCache(cacheKey);

    if (cached) {
      return new Response(JSON.stringify(cached), { status: 200, headers: corsHeaders });
    }

    // Initialize the SQL query
    let sql = `CALL Account_SP_GetDashboardCounts()`;

    // Execute the query
    const results = await db.query(sql)

    // Get total count of rows
    const countResult = await db.query('SELECT FOUND_ROWS() AS totalCount')
    const totalCount = countResult[0]?.totalCount || 0

    const responseData = {
      status: true,
      data: results,
      totalCount: totalCount
    };

    // Set cache
    setCache(cacheKey, responseData, DEFAULT_TTL);

    // Return response
    return new Response(
      JSON.stringify({
        status: true,
        data: results,
        totalCount: totalCount
      }),
      { status: 200, headers: corsHeaders }
    )
  } catch (err) {
    console.error('Error in GET API:', err.message)

    return new Response(
      JSON.stringify({
        status: false,
        message: err.message || 'Internal Server Error'
      }),
      { status: err.status || 500, headers: corsHeaders }
    )
  }
}

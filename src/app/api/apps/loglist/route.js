export const dynamic = 'force-dynamic';
import 'dotenv/config';
import jwt from 'jsonwebtoken'; // Use jwt library for token validation
import mysql from 'mysql2/promise';

import db from '../db';

import { validateToken } from '../validateToken';

import { getCache, setCache } from "../cache";


export const createCacheKey = (prefix, params = {}) => {
  return `${prefix}:${Buffer.from(JSON.stringify(params)).toString("base64")}`;
};

// API Route to handle the GET request
export async function GET(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ status: false, message: 'Method Not Allowed' }), { status: 405 })
  }

  try {
    // Validate token
    const user = await validateToken(req)

    // Base SQL query
    let sql = `SELECT SQL_CALC_FOUND_ROWS rm.* FROM tbl_log rm
    WHERE 1=1`

    const params = []

    // const filters = req.params || {}
    const filters = Object.fromEntries(req.nextUrl.searchParams.entries())

    const cacheKey = createCacheKey("loglist", filters);

    const cached = getCache(cacheKey);

    if (cached) {
      console.log("CACHE HIT:", cacheKey);

      return new Response(
        JSON.stringify({
          status: true,
          data: cached.data,
          totalCount: cached.totalCount,
          cached: true
        }),
        { status: 200 }
      );
    }

    // Dynamically build the query
    Object.keys(filters).forEach(key => {
      const value = filters[key]

      // if (value !== undefined && value !== '') {
      //   sql += ` AND rm.${key} = ?`
      //   params.push(value)
      // }
      if (value === 'NULL') {
        // Handle null values
        sql += ` AND rm.${key} IS NULL`
      } else if (value !== undefined && value !== '') {
        // Handle non-null values
        sql += ` AND rm.${key} = ?`
        params.push(value)
      }
    })

    // Debugging: Log the final SQL query and params to verify
    console.log('SQL Query:', sql)
    console.log('Query Params:', params)

    // Execute the query
    const results = await db.query(sql, params)

    // Get the total count
    const countResult = await db.query('SELECT FOUND_ROWS() AS totalCount')
    const totalCount = countResult[0]?.totalCount || 0

    // Set cache
    setCache(cacheKey, { data: results, totalCount });

    // If no results, return not found
    if (!results.length) {
      return new Response(JSON.stringify({ status: false, message: 'Data not found.', totalCount }), { status: 200 })
    }

    // Return the results
    return new Response(JSON.stringify({ status: true, data: results, totalCount }), { status: 200 })
  } catch (err) {
    console.error('Error executing query:', err)

    return new Response(JSON.stringify({ status: false, message: err.message || 'Internal Server Error' }), {
      status: 200
    })
  }
}

export default GET

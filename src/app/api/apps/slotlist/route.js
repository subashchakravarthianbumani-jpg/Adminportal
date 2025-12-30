export const dynamic = 'force-dynamic'
import jwt from 'jsonwebtoken' // Use jwt library for token validation

import db from '../db'

import { validateToken } from '../validateToken'

import { getCache, setCache, DEFAULT_TTL } from '../cache'

const createCacheKey = (prefix, params) => {
  const keyParams = JSON.stringify(params || {})

  return `${prefix}:${Buffer.from(keyParams).toString('base64')}`
}

export async function GET(req) {
  try {
    // Validate token
    const user = await validateToken(req)

    // Initialize the SQL query
    let sql = `SELECT SQL_CALC_FOUND_ROWS * FROM slotmaster WHERE 1=1`

    // Initialize parameters array for prepared statements
    const params = []

    // Extract filters from query parameters
    const filters = Object.fromEntries(req.nextUrl.searchParams.entries())

    const cacheKey = createCacheKey('slotlist', filters)

    // Check if data exists in cache
    const cachedData = getCache(cacheKey)

    if (cachedData) {
      console.log('Cache hit for', cacheKey)

      return new Response(JSON.stringify({ status: true, data: cachedData.data, totalCount: cachedData.totalCount }), {
        status: 200
      })
    }

    // Check if IsActive is provided, else default to 1
    // if (!filters.hasOwnProperty('IsActive') || filters['IsActive'] === '') {
    //   sql += ` AND IsActive = ?`
    //   params.push(1)
    // }

    if (filters.IsActive === undefined || filters.IsActive === '') {
      sql += ` AND IsActive = ?`
      params.push(1)
    } else {
      sql += ` AND IsActive = ?`
      params.push(filters.IsActive)
    }

    // Dynamically build the WHERE clause for other filters
    Object.keys(filters).forEach(key => {
      const value = filters[key]?.trim()

      if (value !== undefined && value !== '') {
        sql += ` AND ${key} = ?`
        params.push(value)
      }
    })

    sql += ` ORDER BY SlotName ASC`

    // Debugging: Log the final SQL query and params
    console.log('SQL Query:', sql)
    console.log('Query Params:', params)

    // Execute the query
    const results = await db.query(sql, params)

    // Get total count of rows
    const countResult = await db.query('SELECT FOUND_ROWS() AS totalCount')
    const totalCount = countResult[0]?.totalCount || 0

    const data = {
      status: true,
      data: results,
      totalCount: totalCount
    }

    setCache(cacheKey, data, DEFAULT_TTL)

    // Return response
    return new Response(
      JSON.stringify({
        status: true,
        data: results,
        totalCount: totalCount
      }),
      { status: 200 }
    )
  } catch (err) {
    console.error('Error in GET API:', err.message)

    return new Response(
      JSON.stringify({
        status: false,
        message: err.message || 'Internal Server Error'
      }),
      { status: err.status || 500 }
    )
  }
}

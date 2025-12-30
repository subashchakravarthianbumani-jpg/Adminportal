import db from '../db'
import { getCache, setCache, DEFAULT_TTL } from '../cache'

const createSettingsCacheKey = (filters) => {
  return `settingslist:${Buffer.from(JSON.stringify(filters)).toString('base64')}`
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function GET(req) {
  try {
    const filters = Object.fromEntries(req.nextUrl.searchParams.entries())
    const cacheKey = createSettingsCacheKey(filters)

    const cached = getCache(cacheKey)

    if (cached) {
      return new Response(JSON.stringify(cached), { status: 200, headers: corsHeaders })
    }

    let sql = `SELECT SQL_CALC_FOUND_ROWS rm.* FROM settingsmaster rm WHERE 1=1`
    const params = []

    Object.keys(filters).forEach((key) => {
      const value = filters[key]

      if (value === "NULL") {
        sql += ` AND rm.${key} IS NULL`
      } else if (value !== undefined && value !== "") {
        sql += ` AND rm.${key} = ?`
        params.push(value)
      }
    })

    const results = await db.query(sql, params)

    const cleanedResults = results.map((row) => {
      const cleanedRow = {}

      for (const key in row) {
        const value = row[key]

        cleanedRow[key] = value == null ? "" : typeof value === "string" ? value.replace(/\u0000/g, "") : value
      }

      return cleanedRow
    })

    const countResult = await db.query("SELECT FOUND_ROWS() AS totalCount")
    const totalCount = countResult[0]?.totalCount || 0

    const responseData = { status: true, data: cleanedResults, totalCount }

    setCache(cacheKey, responseData, DEFAULT_TTL)

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: corsHeaders,
    })

  } catch (err) {
    console.error("Error executing query:", err)

    return new Response(JSON.stringify({ status: false, message: err.message }), {
      status: 500,
      headers: corsHeaders,
    })
  }
}

export const dynamic = 'force-dynamic';
import jwt from 'jsonwebtoken'; // Use jwt library for token validation

import db from '../db'; // Ensure you have the correct database connection file

const SECRET_KEY = process.env.SECRET_KEY // Replace with your secret key

// Middleware to validate JWT token
// Middleware to validate JWT token
const validateToken = async req => {
  const authHeader = req.headers.get('authorization')
  const token = authHeader && authHeader.split(' ')[1] // Bearer <token>

  if (!token) {
    throw new Error('Unauthorized')
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] })

    // Check if token is active
    const rows = await db.query('SELECT * FROM tokens WHERE Token = ? AND IsActive = 1', [token])

    if (!rows.length) {
      throw new Error('Unauthorized')
    }

    return decoded // Return decoded user info
  } catch (err) {
    console.error('Error during token validation:', err.message)
    throw new Error('Unauthorized')
  }
}

export async function GET(req) {
  try {
    // Validate token
    const user = await validateToken(req)

    // Initialize the SQL query

    let counts = `CALL Account_SP_GetDailyReportCounts()`

    // Execute the query
    const resultCounts = await db.query(counts)

    let sql = `CALL Account_SP_GetDailyReportStateCounts()`

    // Execute the query
    const results = await db.query(sql)

    let BusinessCategory = `CALL Account_SP_GetDailyReportBusinessCategoryCounts()`

    // Execute the query
    const BusinessCategoryresults = await db.query(BusinessCategory)

    let BusinessTrade = `CALL Account_SP_GetDailyReportBusinessTradeCounts()`

    // Execute the query
    const BusinessTraderesults = await db.query(BusinessTrade)

    let ExhibitorType = `CALL Account_SP_GetDailyReportExhibitorsTypeCounts()`

// Execute the query
    const ExhibitorTyperesults = await db.query(ExhibitorType)

    let StallBookingResults = `CALL Account_SP_GetDailyReportStallBookingCounts()`


// Stall Booked query
const StallBookedresults = await db.query(StallBookingResults)


    // Return response
    return new Response(
      JSON.stringify({
        status: true,
        Overall: resultCounts,
        State: results,
        BusinessCategory: BusinessCategoryresults,
        BusinessTrade : BusinessTraderesults,
        ExhibitorType : ExhibitorTyperesults,
        StallBooking : StallBookedresults
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

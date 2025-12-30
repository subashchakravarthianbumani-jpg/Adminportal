import jwt from 'jsonwebtoken' // Use jwt library for token validation

import db from '../db' // Make sure to use your actual database connection method

const SECRET_KEY = process.env.SECRET_KEY // Use your actual secret key

// Middleware to validate JWT token
const validateToken = async req => {
  const authHeader = req.headers.get('authorization')

  console.log(authHeader)

  const token = authHeader && authHeader.split(' ')[1] // Bearer <token>

  console.log('token : ' + token)

  if (!token) {
    throw new Error('Unauthorized')
  }

  try {
    // Verify the token's signature
    // const decoded = jwt.verify(token, SECRET_KEY)
    const decoded = jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] });


    console.log('Decoded Token:', decoded)
    console.log('---------------------------------')
    console.log('SECRET_KEY used:', SECRET_KEY)

    // Check if token is active
    const [rows] = await db.query('SELECT * FROM tokens WHERE Token = ? AND IsActive = 1', [token])

    if (!rows.length) {
      console.log(rows);

      throw new Error('Unauthorized')
    }

    return decoded // Return decoded user information
    // req.user = decoded
    // next()
  } catch (err) {
    console.log('SECRET_KEY:', SECRET_KEY);
    console.error('Error during token validation:', err.message)
    throw new Error('Unauthorized')
  }
}

export async function GET(req) {
  try {
    // Validate token
    const user = await validateToken(req)

    // Extract query parameters from the URL
    const { searchParams } = new URL(req.url)

    const filters = {
      RegitrationType: searchParams.get('RegitrationType'),
      IsActive: searchParams.get('IsActive'),

      // limit: searchParams.get('limit'),
      // offset: searchParams.get('offset')
    }

    // Initialize the SQL query
    let sql = `
      SELECT SQL_CALC_FOUND_ROWS rm.*,
             gd1.DropDownValue AS GenderName,
             gd2.DropDownValue AS CommunityName,
             gd3.DropDownValue AS DistrictName,
             gd4.DropDownValue AS StateName,
             gd5.DropDownValue AS ReferenceByName,
             gd6.DropDownValue AS VisitorCategoryName,
             gd7.DropDownValue AS BusinessCategoryName,
             gd8.DropDownValue AS OthersCategoryName,
             gd9.DropDownValue AS IntrestedSectorName,
             CASE
             WHEN rm.IsStallApprove = 0 THEN 'Rejected'
             WHEN rm.IsStallApprove = 1 THEN 'Approved'
             WHEN rm.IsStallApprove IS NULL THEN 'Waiting'
             END AS StallApprovalStatus,
             sm.SlotNumber AS SlotNumber,
             sm.SlotName AS SlotName
      FROM registrationmaster rm
      LEFT JOIN dropdownmaster gd1 ON rm.Gender = gd1.Id
      LEFT JOIN dropdownmaster gd2 ON rm.Community = gd2.Id
      LEFT JOIN dropdownmaster gd3 ON rm.District = gd3.Id
      LEFT JOIN dropdownmaster gd4 ON rm.State = gd4.Id
      LEFT JOIN dropdownmaster gd5 ON rm.ReferenceBy = gd5.Id
      LEFT JOIN dropdownmaster gd6 ON rm.VisitorCategory = gd6.Id
      LEFT JOIN dropdownmaster gd7 ON rm.BusinessCategory = gd7.Id
      LEFT JOIN dropdownmaster gd8 ON rm.OthersCategory = gd8.Id
      LEFT JOIN dropdownmaster gd9 ON rm.IntrestedSector = gd9.Id
      LEFT JOIN slotmaster sm ON rm.Id = sm.RegistrationId
      WHERE 1=1`

    const params = []

    // Add filters dynamically to the query
    if (filters.RegitrationType) {
      sql += ' AND rm.RegitrationType = ?'
      params.push(filters.RegitrationType)
    }

    if (filters.IsActive) {
      sql += ' AND rm.IsActive = ?'
      params.push(filters.IsActive === '1' ? 1 : 0)
    }

    // Add pagination if limit and offset are provided
    const limit = filters.limit ? parseInt(filters.limit, 10) : 10
    const offset = filters.offset ? parseInt(filters.offset, 10) : 0

    sql += ' LIMIT ? OFFSET ?'
    params.push(limit, offset)

    // Execute the query
    const [results] = await db.query(sql, params)

    // Get total count of rows
    const [countResult] = await db.query('SELECT FOUND_ROWS() AS totalCount')
    const totalCount = countResult[0]?.totalCount || 0

    // Return response with data and total count
    return new Response(
      JSON.stringify({
        status: true,
        data: results,
        totalCount: totalCount
      }),
      { status: 200 }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({
        status: false,
        message: 'Unauthorized or Internal Server Error',
        error: err.message
      }),
      { status: 401 }
    )
  }
}

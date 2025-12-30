import jwt from 'jsonwebtoken'

import { format } from 'date-fns'

import db from '../db'

import { validateToken } from '../validateToken'

import { clearCache,deleteCacheByPrefix } from '../cache'


const SECRET_KEY = process.env.SECRET_KEY

// Helper function to get client IP address
function getClientIP(req) {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  return 'Unknown'
}

// Helper function to call Log_Entry procedure
async function logAction(description, moduleName, action, oldData, newData, ipAddress, userId, userName) {
  try {
    const sql = `CALL Log_Entry(?, ?, ?, ?, ?, ?, ?, ?)`

    const params = [
      description,
      moduleName,
      action,
      oldData ? JSON.stringify(oldData) : null,
      newData ? JSON.stringify(newData) : null,
      ipAddress,
      userId,
      userName
    ]

    await db.query(sql, params)

    deleteCacheByPrefix('loglist');

    console.log('Log entry created successfully')
  } catch (error) {
    console.error('Error creating log entry:', error)
  }
}

// Helper function to get registration details
async function getRegistrationDetails(registrationNo) {
  try {
    const sql = `SELECT Id, FirstName, LastName, RegitrationType, Phone, Email
                 FROM registrationmaster
                 WHERE RegitrationNo = ? AND IsActive = 1
                 LIMIT 1`

    const results = await db.query(sql, [registrationNo])

    if (results && results.length > 0) {
      return results[0]
    }

    return null
  } catch (error) {
    console.error('Error fetching registration details:', error)

    return null
  }
}

// Helper function to get existing check-in status
async function getCheckInStatus(registrationNo) {
  try {
    const sql = `SELECT * FROM checkenhistory
                 WHERE RegistrationId = ?
                 ORDER BY CreatedDate DESC
                 LIMIT 1`

    const results = await db.query(sql, [registrationNo])

    if (results && results[0] && Array.isArray(results[0]) && results[0].length > 0) {
      return results[0][0]
    }

    return null
  } catch (error) {
    console.error('Error fetching check-in status:', error)

    return null
  }
}


// API route for Check-In
export async function POST(req) {
  const clientIP = getClientIP(req)
  let userId = null
  let userName = null
  let registrationNo = null

  try {
    // Validate token
    const user = await validateToken(req)

    // Set user info from token
    userId = user?.userId || user?.id || 'SYSTEM'
    userName = user?.userName || user?.username || 'System User'

    const { RegistrationNo } = await req.json()

    registrationNo = RegistrationNo

    console.log('Registration No:', RegistrationNo)

    // Validate required fields
    if (!RegistrationNo) {
      await logAction(
        'Check-in attempt failed - Registration number not provided',
        'CheckIn',
        'CHECKIN_FAILED',
        null,
        { error: 'RegistrationNo is required' },
        clientIP,
        userId,
        userName
      )

      return new Response(
        JSON.stringify({
          status: false,
          message: "'RegistrationNo' is required."
        }),
        { status: 400 }
      )
    }

    // Get registration details for better logging
    const registrationDetails = await getRegistrationDetails(RegistrationNo)

    if (!registrationDetails) {
      await logAction(
        `Check-in attempt failed - Invalid Registration No: ${RegistrationNo}`,
        'CheckIn',
        'CHECKIN_FAILED',
        null,
        { registrationNo: RegistrationNo, error: 'Registration not found' },
        clientIP,
        userId,
        userName
      )

      return new Response(
        JSON.stringify({
          status: false,
          message: 'Invalid Registration Number'
        }),
        { status: 404 }
      )
    }

    // Update user info with registration details if available
    if (registrationDetails) {
      userId = registrationDetails.Id
      userName = `${registrationDetails.FirstName || ''} ${registrationDetails.LastName || ''}`.trim()
    }

    // Get existing check-in status (if any)
    const existingCheckIn = await getCheckInStatus(RegistrationNo)

    // Save the check-in
    const now = new Date()
    const SavedDate = format(now, 'yyyy-MM-dd HH:mm:ss')

    const params = [RegistrationNo || null, SavedDate || null]

    console.log('Params:', params)

    const sql = 'CALL Settings_SP_NewCheckIn(?, ?)'
    const [results] = await db.query(sql, params)

    console.log('Results:', results)

    const procedureResult = results
    const messageKey = Object.keys(procedureResult)[0]
    const messageValue = procedureResult[messageKey]

    // Prepare data for logging`
    const checkInData = {
      registrationNo: RegistrationNo,
      registrationType: registrationDetails?.RegitrationType,
      phone: registrationDetails?.Phone,
      email: registrationDetails?.Email,
      checkInDate: SavedDate
    }

    if(messageValue) {
      clearCache("loglist");
    }

    switch (messageValue) {
      case 'Already Checked In':
        await logAction(
          `Check-in attempt - Already checked in - Registration No: ${RegistrationNo}`,
          'CheckIn',
          'ALREADY_CHECKED_IN',
          existingCheckIn,
          checkInData,
          clientIP,
          userId,
          userName
        )

        return new Response(
          JSON.stringify({
            status: true,
            message: 'Already Checked In.'
          }),
          { status: 200 }
        )

      case 'Checked In Successfully':
        await logAction(
          `Check-in successful - Registration No: ${RegistrationNo}`,
          'CheckIn',
          'CHECKIN_SUCCESS',
          null,
          checkInData,
          clientIP,
          userId,
          userName
        )

        return new Response(
          JSON.stringify({
            status: true,
            message: 'Checked In Successfully'
          }),
          { status: 200 }
        )

      default:
        await logAction(
          `Check-in failed - Registration No: ${RegistrationNo} - ${messageValue}`,
          'CheckIn',
          'CHECKIN_FAILED',
          existingCheckIn,
          { ...checkInData, error: messageValue },
          clientIP,
          userId,
          userName
        )

        return new Response(
          JSON.stringify({
            status: false,
            message: messageValue
          }),
          { status: 500 }
        )
    }
  } catch (err) {
    console.error('Error in CheckIn API:', err.message)

    // Log the error
    await logAction(
      `Check-in error - Registration No: ${registrationNo || 'Unknown'} - ${err.message}`,
      'CheckIn',
      'ERROR',
      null,
      {
        error: err.message,
        stack: err.stack,
        registrationNo: registrationNo
      },
      clientIP,
      userId,
      userName
    )

    return new Response(
      JSON.stringify({
        status: false,
        message: err.message || 'Internal Server Error'
      }),
      { status: err.status || 500 }
    )
  }
}

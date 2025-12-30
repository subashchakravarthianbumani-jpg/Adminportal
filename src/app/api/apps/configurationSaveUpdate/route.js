import jwt from 'jsonwebtoken'; // Use jwt library for token validation

import { format } from 'date-fns'; // Date formatting for SQL insert

import { v4 as uuidv4 } from 'uuid';

import db from '../db'; // Ensure you have the correct database connection file

import { validateToken } from '../validateToken';

import { deleteCacheByPrefix } from '../cache'

// API route for Slot Booking (POST method)
export async function POST(req) {
  try {
    // Validate token
    const user = await validateToken(req)

    const { Id, Code, Type, Value, DependentId, SavedBy, SavedUserName } = await req.json() // Parse request body

    // Validate required fields based on the operation
    if ( !Code || !Value || !SavedBy || !SavedUserName) {
      return new Response(
        JSON.stringify({
          status: false,
          message: "'Code', 'Value', 'SavedBy', and 'SavedUserName' are required."
        }),
        { status: 400 }
      )
    }

    const validateQuery = `
      SELECT
        (SELECT COUNT(*) FROM usermaster WHERE Id = ? AND UserName = ?) AS UserExists
    `

    const validationResults = await db.query(validateQuery, [SavedBy, SavedUserName])

    const UserExists = validationResults[0]?.UserExists ?? 0;

    if (UserExists === 0) {
      return new Response(
        JSON.stringify({
          status: false,
          message: "Invalid 'SavedBy' or 'SavedUserName'. They do not match in the usermaster table."
        }),
        { status: 400 }
      )
    }

    // Save the booking or approval
    const now = new Date()
    const SavedDate = format(now, 'yyyy-MM-dd HH:mm:ss')

    // const generatedId = Id || uuidv4()
    const generatedId = Id ? Id : uuidv4()

    const params = [
      generatedId,
      Code || null,
      Type || null,
      Value || null,
      DependentId || null,
      SavedBy || null,
      SavedDate,
      SavedUserName || null
    ]

    console.log('Values:', Value)

    const sql = 'CALL Settings_SP_Dropdown_SaveUpdate(?,?, ?, ?, ?, ?, ?, ?)'

    const results = await db.query(sql, params)

    console.log('Results:', results)

    const procedureResult = results[0]
    const messageKey = Object.keys(procedureResult)[0]
    const messageValue = procedureResult[messageKey]

    if (messageValue === 'Created' || messageValue === 'Updated') {

      // if (Type) {
        deleteCacheByPrefix(`DropdownList:${Type}:`)

      // }

      // if (Type && DependentId) {
        deleteCacheByPrefix(`DropdownList:${Type}:${DependentId}`)

      // }

      deleteCacheByPrefix(`DropdownList`)
    }

    switch (messageValue) {
      case 'Created':
        return new Response(
          JSON.stringify({
            status: true,
            message: 'Configuration saved successfully.'
          }),
          { status: 200 }
        )

      case 'Updated':
        return new Response(
          JSON.stringify({
            status: true,
            message: 'Configuration updated successfully.'
          }),
          { status: 200 }
        )
      case 'Not Exist':
        return new Response(
          JSON.stringify({
            status: false,
            message: 'Configuration does not exist.'
          }),
          { status: 200 }
        )

      default:
        return new Response(
          JSON.stringify({
            status: false,
            message: messageValue
          }),
          { status: 500 }
        )
    }
  } catch (err) {
    console.error('Error in POST API:', err.message)

    return new Response(
      JSON.stringify({
        status: false,
        message: err.message || 'Internal Server Error'
      }),
      { status: err.status || 500 }
    )
  }
}

import jwt from 'jsonwebtoken' // Use jwt library for token validation

import { format } from 'date-fns' // Date formatting for SQL insert

import db from '../db' // Ensure you have the correct database connection file

import { validateToken } from '../validateToken'

import { deleteCacheByPrefix } from '../cache'

// API route for Slot Booking (DELETE method)
export async function POST(req) {
  try {
    // Validate token
    const user = await validateToken(req)

    const { Id, IsActive, SavedBy, SavedUserName } = await req.json() // Parse request body



    // Validate required fields based on the operation
    if (!Id || !IsActive || !SavedBy || !SavedUserName) {
      return new Response(
        JSON.stringify({
          status: false,
          message: "'Id','IsActive', 'SavedBy', and 'SavedUserName' are required."
        }),
        { status: 400 }
      )
    }



    // Dependency check
    const dependencyQuery = `
      SELECT COUNT(*) AS DependencyCount
      FROM dropdownmaster
      WHERE DependentId = ?
    `

    const dependencyResults = await db.query(dependencyQuery, [Id])
    const  DependencyCount = dependencyResults[0]?.DependencyCount || 0;

    if (DependencyCount > 0 && IsActive == 0) {
      return new Response(
        JSON.stringify({
          status: false,
          message:
            'Cannot delete this configuration as it is linked to other records. Remove dependencies and try again'
        }),
        { status: 400 }
      )
    }

    const validateQuery = `
      SELECT
        (SELECT COUNT(*) FROM usermaster WHERE Id = ? AND UserName = ?) AS UserExists
    `

    const validationResults = await db.query(validateQuery, [SavedBy, SavedUserName])

    const UserExists = validationResults[0]?.UserExists || 0;

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

    const params = [Id || null, IsActive || null, SavedBy || null, SavedDate, SavedUserName || null]

    console.log('Params:', params)

    const sql = 'CALL Settings_SP_Dropdown_Delete(?, ?, ?, ?, ?)'

    const results = await db.query(sql, params)

    console.log('Results:', results)

    // const procedureResult = results[0][0]

    if (!results || Object.keys(results).length === 0) {
      throw new Error('Stored procedure did not return any result')
    }

    const procedureResult = results[0] || results // pick first result set or use object directly
    const messageValue = Object.values(procedureResult)[0] // safe

    const messageKey = Object.keys(procedureResult)[0]

    // const messageValue = procedureResult[messageKey]

    // if (messageValue === 'Deleted' || messageValue === 'Restored') {

      deleteCacheByPrefix('DropdownList')

    // }

    switch (messageValue) {
      case 'Restored':
        return new Response(
          JSON.stringify({
            status: true,
            message: 'Configuration restored successfully.'
          }),
          { status: 200 }
        )

      case 'Deleted':
        return new Response(
          JSON.stringify({
            status: true,
            message: 'Configuration deleted successfully.'
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
    console.error('Error in DELETE API:', err.message)

    return new Response(
      JSON.stringify({
        status: false,
        message: err.message || 'Internal Server Error'
      }),
      { status: err.status || 500 }
    )
  }
}

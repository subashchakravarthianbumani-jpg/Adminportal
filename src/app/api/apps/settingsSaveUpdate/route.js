import { writeFile } from 'fs/promises'
import path from 'path'

import fs from 'fs'

import jwt from 'jsonwebtoken'
import { format } from 'date-fns'

import { v4 as uuidv4 } from 'uuid'

import db from '../db'

import { validateToken } from '../validateToken'

import { clearCache, deleteCacheByPrefix } from '../cache'


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

// Helper function to get existing setting data
async function getExistingSetting(id) {
  try {
    const sql = `SELECT * FROM settingsmaster WHERE Id = ? AND IsActive = 1 LIMIT 1`
    const results = await db.query(sql, [id])

    if (Array.isArray(results) && results.length > 0) {
      return results[0];
    }

    return null
  } catch (error) {
    console.error('Error fetching existing setting:', error)

    return null
  }
}

// Helper function to get existing setting by Key
async function getExistingSettingByKey(key) {
  try {
    const sql = `SELECT * FROM settings WHERE \`Key\` = ? AND IsActive = 1 LIMIT 1`
    const results = await db.query(sql, [key])

    // if (results && results[0] && Array.isArray(results[0]) && results[0].length > 0) {
    //   return results[0][0]
    // }

    if (Array.isArray(results) && results.length > 0) {
      return results[0];
    }

    return null
  } catch (error) {
    console.error('Error fetching existing setting by key:', error)

    return null
  }
}

export async function POST(req) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  const clientIP = getClientIP(req)
  let userId = null
  let userName = null
  let settingKey = null
  let isUpdate = false
  let existingData = null

  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    // Validate token and get user info
    const decodedToken = await validateToken(req)

    const formData = await req.formData()
    const Id = formData.get('Id') || null
    const Key = formData.get('Key')
    const SType = formData.get('SType')
    const Description = formData.get('Description')
    const Status = formData.get('Status')
    const SavedBy = formData.get('SavedBy')
    const SavedUserName = formData.get('SavedUserName')
    const Value = formData.get('Value')

    // Set user identifiers for logging
    userId = SavedBy || decodedToken?.userId || 'SYSTEM'
    userName = SavedUserName || decodedToken?.userName || 'System User'
    settingKey = Key || 'Unknown'

    // Check if this is an update operation
    if (Id) {
      existingData = await getExistingSetting(Id)

      if (existingData) {
        isUpdate = true
      }
    } else if (Key) {
      // Check by Key if Id is not provided
      existingData = await getExistingSettingByKey(Key)

      if (existingData) {
        isUpdate = true
      }
    }

    let newValue = Value

    const uploadsDir = path.resolve('./public/images/web-logo')

    await fs.promises.mkdir(uploadsDir, { recursive: true })

    // Handle file upload
    if (Value && typeof Value === 'object' && 'arrayBuffer' in Value) {
      const buffer = Buffer.from(await Value.arrayBuffer())
      const ext = Value.name?.split('.').pop()?.toLowerCase() || 'bin'
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'mkv', 'pdf']

      if (!allowedExtensions.includes(ext)) {
        await logAction(
          `Settings file upload failed - Invalid file type: ${ext} for Key: ${settingKey}`,
          'Settings',
          'UPLOAD_FAILED',
          null,
          { Key: settingKey, fileType: ext },
          clientIP,
          userId,
          userName
        )
        throw new Error(`Unsupported file type: ${ext}`)
      }

      const fileName = `${Key || 'setting'}_${Date.now()}.${ext}`
      const filePath = path.join(uploadsDir, fileName)

      await writeFile(filePath, buffer)

      // Save relative path to DB
      newValue = `/images/web-logo/${fileName}`

      // Log file upload
      await logAction(
        `File uploaded for Setting Key: ${settingKey} - File: ${fileName}`,
        'Settings',
        'FILE_UPLOAD',
        existingData ? { oldValue: existingData.Value } : null,
        { Key: settingKey, fileName, filePath: newValue },
        clientIP,
        userId,
        userName
      )
    }

    const generatedId = Id || uuidv4()
    const SavedDate = format(new Date(), 'yyyy-MM-dd HH:mm:ss')

    // Prepare data for logging
    const newDataForLog = {
      Id: generatedId,
      Key,
      Value: newValue,
      SType,
      Description,
      Status
    }

    const params = [
      generatedId,
      Key || null,
      newValue || null,
      SType || null,
      Description || null,
      Status || null,
      SavedBy,
      SavedDate,
      SavedUserName,
    ]

    const sql = 'CALL Settings_SP_Settings_SaveUpdate(?, ?, ?, ?, ?, ?, ?, ?, ?)'
    const procedureResults = await db.query(sql, params)
    const procedureResult = procedureResults[0]
    const messageKey = Object.keys(procedureResult)
    const messageValue = procedureResult[messageKey]

    // Log based on operation result
    if (messageValue === 'Created') {
      await logAction(
        `Setting created successfully - Key: ${settingKey}`,
        'Settings',
        'CREATE',
        null,
        newDataForLog,
        clientIP,
        userId,
        userName
      )
    } else if (messageValue === 'Updated') {
      // Compare old and new values for detailed logging
      const changes = []

      if (existingData) {
        if (existingData.Value !== newValue) changes.push('Value')
        if (existingData.SType !== SType) changes.push('SType')
        if (existingData.Description !== Description) changes.push('Description')
        if (existingData.Status !== Status) changes.push('Status')
      }

      await logAction(
        `Setting updated successfully - Key: ${settingKey}${changes.length > 0 ? ` - Changed: ${changes.join(', ')}` : ''}`,
        'Settings',
        'UPDATE',
        existingData,
        newDataForLog,
        clientIP,
        userId,
        userName
      )
    } else if (messageValue.startsWith('ERROR:')) {
      // Log failed operation
      await logAction(
        `Setting ${isUpdate ? 'update' : 'creation'} failed - Key: ${settingKey} - ${messageValue}`,
        'Settings',
        isUpdate ? 'UPDATE_FAILED' : 'CREATE_FAILED',
        existingData,
        newDataForLog,
        clientIP,
        userId,
        userName
      )
    }

    deleteCacheByPrefix('settingslist');

    return new Response(
      JSON.stringify({
        status: messageValue === 'Created' || messageValue === 'Updated',
        message: messageValue,
      }),
      { status: 200, headers: corsHeaders }
    )
  } catch (err) {
    console.error('Error in POST API:', err.message)

    // Log the error
    await logAction(
      `Settings error - Key: ${settingKey || 'Unknown'} - ${err.message}`,
      'Settings',
      'ERROR',
      existingData,
      { error: err.message, stack: err.stack },
      clientIP,
      userId,
      userName
    )

    return new Response(
      JSON.stringify({ status: false, message: err.message || 'Internal Server Error' }),
      { status: 500, headers: corsHeaders }
    )
  }
}

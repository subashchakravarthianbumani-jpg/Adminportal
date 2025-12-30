export const dynamic = 'force-dynamic'
import jwt from 'jsonwebtoken'

import { v4 as uuidv4 } from 'uuid'

import db from '../db'

import { validateToken } from '../validateToken'

import { getCache, setCache, deleteCacheByPrefix, clearCache, DEFAULT_TTL } from '../cache'

export async function POST(req) {
  try {
    // Validate token
    const user = await validateToken(req)

    // Parse request body
    const body = await req.json()
    const { action, ...data } = body

    console.log('Action:', action)
    console.log('Data:', data)

    // Route to appropriate handler based on action
    switch (action) {
      case 'generate':
        return await handleGenerate(data, user)

      case 'rename':
        return await handleRename(data, user)

      case 'delete':
        return await handleDelete(data, user)

      case 'deleteSingle':
        return await handleDeleteSingle(data, user)

      default:
        return new Response(
          JSON.stringify({
            status: false,
            message: 'Invalid action specified'
          }),
          { status: 400 }
        )
    }
  } catch (err) {
    console.error('Error in POST API:', err.message)

    return new Response(
      JSON.stringify({
        status: false,
        message: err.message || 'Internal Server Error'
      }),
      { status: err.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

// Handler: Generate Codes
async function handleGenerate(data, user) {
  const { Category, Prefix, From, To, Suffix, SavedBy, SavedUserName } = data

  // Validation
  if (!Category || !Prefix || !From || !To) {
    return new Response(
      JSON.stringify({
        status: false,
        message: 'Category, Prefix, From, and To are required'
      }),
      { status: 400 }
    )
  }

  const fromNum = parseInt(From)
  const toNum = parseInt(To)

  if (isNaN(fromNum) || isNaN(toNum) || fromNum > toNum) {
    return new Response(
      JSON.stringify({
        status: false,
        message: 'Invalid From/To range'
      }),
      { status: 400 }
    )
  }

  try {
    const createdSlots = []
    const currentDate = new Date()

    for (let i = fromNum; i <= toNum; i++) {
      const slotName = `${i}`
      const slotNumber = `${Prefix}${i}${Suffix || ''}`
      const slotId = uuidv4()

      const sql = `
  INSERT INTO slotmaster (
    Id, SlotNumber, Prefix, SlotName, Suffix, SlotGroup,
    IsBooked, IsActive,
    CreatedBy, CreatedByUserName, CreatedDate
  )
  SELECT ?, ?, ?, ?, ?, ?, 0, 1, ?, ?, ?
  WHERE NOT EXISTS (
    SELECT 1
    FROM slotmaster
    WHERE SlotNumber = ?
      AND SlotGroup = ?
      AND SlotName = ?
      AND IsActive = 1
      AND IsBooked = 0
  )
`

      const params = [
        slotId,
        slotNumber,
        Prefix,
        `${i}`,
        Suffix || '',
        Category,
        SavedBy,
        SavedUserName,
        currentDate,
        slotNumber,
        Category,
        `${i}`
      ]

      await db.query(sql, params)
      createdSlots.push(slotNumber)

    deleteCacheByPrefix('slotlist')
    deleteCacheByPrefix('slotlist:')
    deleteCacheByPrefix('slotlist-')
    deleteCacheByPrefix('slotlist*')
    clearCache('slotlist:*')
    }

    deleteCacheByPrefix('slotlist')
    deleteCacheByPrefix('slotlist:')
    deleteCacheByPrefix('slotlist-')
    deleteCacheByPrefix('slotlist*')
    clearCache('slotlist:*')

    return new Response(
      JSON.stringify({
        status: true,
        message: `Successfully generated ${createdSlots.length} slots`,
        data: createdSlots
      }),
      { status: 200 }
    )
  } catch (err) {
    console.error('Error generating slots:', err.message)

    return new Response(
      JSON.stringify({
        status: false,
        message: 'Failed to generate slots: ' + err.message
      }),
      { status: 500 }
    )
  }
}

// Handler: Rename Slots
async function handleRename(data, user) {
  const { Category, Prefix, From, To, Suffix, SavedBy, SavedUserName } = data

  // Validation
  if (!Category || !Prefix || !From || !To) {
    return new Response(
      JSON.stringify({
        status: false,
        message: 'Category, Prefix, From, and To are required'
      }),
      { status: 400 }
    )
  }

  const fromNum = parseInt(From)
  const toNum = parseInt(To)

  if (isNaN(fromNum) || isNaN(toNum) || fromNum > toNum) {
    return new Response(
      JSON.stringify({
        status: false,
        message: 'Invalid From/To range'
      }),
      { status: 400 }
    )
  }

  try {
    const renamedSlots = []
    const currentDate = new Date()

    for (let i = fromNum; i <= toNum; i++) {
      const oldSlotNumber = `${Prefix}${i}${Suffix || ''}`
      const newSlotNumber = `${Prefix}${i}${Suffix || ''}`

      // Update existing slot
      const updateSql = `
        UPDATE slotmaster
        SET
          SlotNumber = ?,
          SlotName = ?,
          Prefix = ?,
          Suffix = ?,
          ModifiedBy = ?,
          ModifiedByUserName = ?,
          ModifiedDate = ?
        WHERE SlotGroup = ?
          AND Prefix = ?
          AND SlotNumber LIKE ?
          AND IsActive = 1
      `

      const params = [
        newSlotNumber,
        `${i}`,
        Prefix,
        Suffix || '',
        SavedBy,
        SavedUserName,
        currentDate,
        Category,
        Prefix,
        `${Prefix}${i}%`
      ]

      const result = await db.query(updateSql, params)

      deleteCacheByPrefix('slotlist')

      if (result.affectedRows > 0) {
        renamedSlots.push(newSlotNumber)
      }
    }

    return new Response(
      JSON.stringify({
        status: true,
        message: `Successfully renamed ${renamedSlots.length} slots`,
        data: renamedSlots
      }),
      { status: 200 }
    )
  } catch (err) {
    console.error('Error renaming slots:', err.message)

    return new Response(
      JSON.stringify({
        status: false,
        message: 'Failed to rename slots: ' + err.message
      }),
      { status: 500 }
    )
  }
}

// Handler: Delete Range (Soft Delete)
async function handleDelete(data, user) {
  const { Category, Prefix = '', From, To, Suffix = '', SavedBy } = data

  // Validation
  if (!Category || !From || !To) {
    return new Response(
      JSON.stringify({
        status: false,
        message: 'Category, Prefix, From, and To are required'
      }),
      { status: 400 }
    )
  }

  const fromNum = parseInt(From)
  const toNum = parseInt(To)

  if (isNaN(fromNum) || isNaN(toNum) || fromNum > toNum) {
    return new Response(
      JSON.stringify({
        status: false,
        message: 'Invalid From/To range'
      }),
      { status: 400 }
    )
  }

  try {
    const currentDate = new Date()

    // Single SQL to handle the whole range
    const updateSql = `
  UPDATE slotmaster
  SET
    IsActive = 0,
    DeletedBy = ?,
    DeletedDate = ?
  WHERE SlotGroup = ?
    AND IsActive = 1
    AND SlotNumber REGEXP '^${Prefix}[0-9]+${Suffix}$'
    AND CAST(REGEXP_SUBSTR(SlotNumber, '[0-9]+') AS UNSIGNED)
        BETWEEN ? AND ?
`

    console.log('updateSql', updateSql)

    const params = [SavedBy, currentDate, Category, fromNum, toNum]

    console.log('params', params)
    const result = await db.query(updateSql, params)

    // Clear caches
    deleteCacheByPrefix('slotlist')
    deleteCacheByPrefix('slotlist:')
    deleteCacheByPrefix('slotlist-')
    deleteCacheByPrefix('slotlist*')
    clearCache('countlist')
    clearCache('dailyreport')
    clearCache('dashboardcounts')
    clearCache('interval:*')
    clearCache('slotlist:*')
    deleteCacheByPrefix('registrationlist:')
    deleteCacheByPrefix('formregistrationlist:')

    return new Response(
      JSON.stringify({
        status: true,
        message: `Successfully deleted ${result.affectedRows} slots`,
        data: result.affectedRows
      }),
      { status: 200 }
    )
  } catch (err) {
    console.error('Error deleting slots:', err.message)

    return new Response(
      JSON.stringify({
        status: false,
        message: 'Failed to delete slots: ' + err.message
      }),
      { status: 500 }
    )
  }
}

// Handler: Delete Single Slot (Soft Delete)
async function handleDeleteSingle(data, user) {
  const { Id, DeletedBy, DeletedByUserName } = data

  // Validation
  if (!Id) {
    return new Response(
      JSON.stringify({
        status: false,
        message: 'Id is required'
      }),
      { status: 400 }
    )
  }

  try {
    const currentDate = new Date()

    // Soft delete by setting IsActive = 0
    const updateSql = `
      UPDATE slotmaster
      SET
        IsActive = 0,
        DeletedBy = ?,
        DeletedByUserName = ?,
        DeletedDate = ?
      WHERE Id = ? AND IsActive = 1
    `

    const params = [DeletedBy, DeletedByUserName, currentDate, Id]

    const [result] = await db.query(updateSql, params)

    deleteCacheByPrefix('slotlist')

    if (result.affectedRows === 0) {
      return new Response(
        JSON.stringify({
          status: false,
          message: 'Slot not found or already deleted'
        }),
        { status: 404 }
      )
    }

    return new Response(
      JSON.stringify({
        status: true,
        message: 'Slot deleted successfully'
      }),
      { status: 200 }
    )
  } catch (err) {
    console.error('Error deleting single slot:', err.message)

    return new Response(
      JSON.stringify({
        status: false,
        message: 'Failed to delete slot: ' + err.message
      }),
      { status: 500 }
    )
  }
}

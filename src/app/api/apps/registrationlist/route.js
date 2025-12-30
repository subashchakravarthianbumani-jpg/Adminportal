export const dynamic = 'force-dynamic'
import jwt from 'jsonwebtoken'

import db from '../db'

import { validateToken } from '../validateToken'

import { getCache, setCache, DEFAULT_TTL } from '../cache'

export const createCacheKey = body => {
  return `registrationlist:${Buffer.from(JSON.stringify(body)).toString('base64')}`
}

export async function POST(req) {
  try {
    await validateToken(req)
    const body = await req.json()

    const cacheKey = createCacheKey(body)

    const cachedResponse = getCache(cacheKey)

    if (cachedResponse) {
      console.log('Returning cached registration data')

      return new Response(JSON.stringify(cachedResponse), { status: 200 })
    }

    const { skip = 0, take = 10, searchString = '', sorting = {}, columnSearch = [], where = {} } = body

    const filterKeyMap = {
      RegistrationType: 'RegitrationType',
      RegistrationNoPrefix: 'RegitrationNoPrefix',
      RegistrationNo: 'RegitrationNo',
      RegistrationRunningNo: 'RegitrationRunningNo',
      InterestedSector: 'IntrestedSector',
      InterestedSectorName: 'IntrestedSectorName',
      IsStallApproved: 'IsStallApprove',
      IsStallCanceled: 'IsStallCancelled'
    }

    const baseSelect = `
      SELECT
    rm.Id,
    rm.RegitrationType AS RegistrationType,
    rm.RegitrationNoPrefix AS RegistrationNoPrefix,
    rm.RegitrationNo AS RegistrationNo,
    rm.RegitrationRunningNo AS RegistrationRunningNo,
    rm.FirstName,
    rm.LastName,
    rm.Gender,
    rm.Age,
    rm.Community,
    rm.Phone,
    rm.Email,
    rm.District,
    rm.State,
    rm.ReferenceBy,
    rm.VisitorCategory,
    rm.PurposeOfVisit,
    rm.IntrestedSector AS InterestedSector,
    rm.PurposeOfParticipation,
    rm.CompanyName,
    rm.BusinessCategory,
    rm.BusinessType,
    rm.BusinessTrade,
    rm.YearEstablished,
    rm.BusinessTurnOver,
    rm.UdyogRegistrationId,
    rm.GSTNumber,
    rm.DescriptionOfProducts,
    rm.IsMoreStallsReq,
    rm.IsStallApprove AS IsStallApproved,
    rm.IsStallCancelled AS IsStallCanceled,
    rm.IsActive,
    rm.CreatedBy,
    rm.CreatedByUserName,
    rm.CreatedDate,
    rm.ModifiedBy,
    rm.ModifiedByUserName,
    rm.ModifiedDate,
    rm.DeletedBy,
    rm.DeletedByUserName,
    rm.DeletedDate,
    rm.Seminars,
    rm.ReferenceByOthers,
    rm.OthersCategory,
    rm.NatureOfActivities,
    rm.Session,
    rm.IsCheckedIn,
    rm.CheckInDate,
    rm.ProductImage,
    rm.AlreadyAttended,
    rm.StallSize,
    rm.StallLength,
    rm.Stallbreadth AS StallBreadth,
    rm.PreviousYearStallImage,
    rm.StallType,
    rm.PanNo,
    rm.Items,
    rm.ExhType,

    gd1.DropDownValue AS GenderName,
    gd2.DropDownValue AS CommunityName,
    gd3.DropDownValue AS DistrictName,
    gd4.DropDownValue AS StateName,
    gd5.DropDownValue AS ReferenceByName,
    gd6.DropDownValue AS VisitorCategoryName,
    gd7.DropDownValue AS BusinessCategoryName,
    gd8.DropDownValue AS OthersCategoryName,
    gd9.DropDownValue AS InterestedSectorName,
    gd10.DropDownValue AS SessionName,
    gd11.DropDownValue AS SeminarName,

    CASE
      WHEN rm.IsStallApprove = 0 THEN 'Rejected'
      WHEN rm.IsStallApprove = 1 THEN 'Approved'
      ELSE 'Waiting'
    END AS StallApprovalStatus,

    sm.Id AS SlotId,
    sm.SlotNumber,
    sm.SlotName,
    rm.CreatedByUserName,
    rm.ModifiedByUserName,
    rm.DeletedByUserName,
    rm.CreatedDate,
    rm.ModifiedDate,
    rm.DeletedDate
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
  LEFT JOIN dropdownmaster gd10 ON rm.Session = gd10.Id
  LEFT JOIN dropdownmaster gd11 ON rm.Seminars = gd11.Id
  LEFT JOIN slotmaster sm ON rm.Id = sm.RegistrationId
  WHERE 1=1
    `

    const params = []
    const whereClauses = []

    // for (const [key, value] of Object.entries(where)) {
    //   if (value == null || value === '') continue

    //   const dbKey = filterKeyMap[key] || key // map frontend field to db field

    //   if (Array.isArray(value) && value.length > 0) {
    //     whereClauses.push(`rm.${dbKey} IN (${value.map(() => '?').join(',')})`)
    //     params.push(...value)
    //   } else if (key.toLowerCase() === 'year') {
    //     whereClauses.push(`YEAR(rm.CreatedOn) = ?`)
    //     params.push(value)
    //   } else {
    //     whereClauses.push(`rm.${dbKey} = ?`)
    //     params.push(value)
    //   }
    // }

    for (const [key, value] of Object.entries(where)) {
      if (value == null || value === '') continue

      const dbKey = filterKeyMap[key] || key

      if (Array.isArray(value)) {
        const filteredValues = value.filter(v => v !== '')

        const hasOnlyNull = filteredValues.length > 0 && filteredValues.every(v => v === null)

        const nonNullValues = filteredValues.filter(v => v != null)

        if (hasOnlyNull) {
          whereClauses.push(`rm.${dbKey} IS NULL`)
        } else if (nonNullValues.length > 0) {
          whereClauses.push(`rm.${dbKey} IN (${nonNullValues.map(() => '?').join(',')})`)
          params.push(...nonNullValues)
        }
      } else if (key.toLowerCase() === 'year') {
        whereClauses.push(`YEAR(rm.CreatedOn) = ?`)
        params.push(value)
      } else {
        whereClauses.push(`rm.${dbKey} = ?`)
        params.push(value)
      }
    }

    const searchFields = [
      'rm.RegitrationType',
      'rm.RegitrationNoPrefix',
      'rm.RegitrationNo',
      'rm.RegitrationRunningNo',
      'rm.FirstName',
      'rm.LastName',
      'rm.Age',
      'rm.Phone',
      'rm.Email',
      'rm.PurposeOfVisit',
      'rm.CompanyName',
      'rm.YearEstablished',
      'rm.BusinessTurnOver',
      'rm.UdyogRegistrationId',
      'rm.GSTNumber',
      'rm.DescriptionOfProducts',
      'rm.NatureOfActivities',
      'rm.StallSize',
      'rm.StallLength',
      'rm.Stallbreadth',
      'rm.PanNo',
      'rm.Items',
      'rm.ExhType',
      'gd1.DropDownValue',
     'gd2.DropDownValue',
     'gd3.DropDownValue',
     'gd4.DropDownValue',
     'gd5.DropDownValue',
     'gd6.DropDownValue',
     'gd7.DropDownValue',
     'gd8.DropDownValue',
     'gd9.DropDownValue',
     'gd10.DropDownValue',
     'gd11.DropDownValue',
     'rm.CreatedByUserName',
    'rm.ModifiedByUserName',
    'rm.DeletedByUserName',
    'rm.CreatedDate',
    'rm.ModifiedDate',
    'rm.DeletedDate'
    ]

    if (searchString.trim()) {
      const likeVal = `%${searchString.trim()}%`

      whereClauses.push('(' + searchFields.map(f => `${f} LIKE ?`).join(' OR ') + ')')

      params.push(...Array(searchFields.length).fill(likeVal))
    }

    for (const col of columnSearch) {
      if (col.field && col.value) {
        whereClauses.push(`rm.${col.field} LIKE ?`)
        params.push(`%${col.value}%`)
      }
    }

    const whereSQL = whereClauses.length ? ` AND ${whereClauses.join(' AND ')}` : ''

    const sortField = sorting.fieldName ? sorting.fieldName.replace(/[^a-zA-Z0-9_.]/g, '') : 'rm.Id'

    const sortOrder = sorting.sort?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    const orderSQL = ` ORDER BY ${sortField} ${sortOrder}`

    const limitSQL = ' LIMIT ?, ?'

    params.push(Number(skip), Number(take))

    const dataSQL = baseSelect + whereSQL + orderSQL + limitSQL

    function formatSQL(sql, params) {
  let i = 0;

  return sql.replace(/\?/g, () => `'${params[i++]}'`);
}

console.log(formatSQL(dataSQL, params))


    const countSQL = `SELECT COUNT(*) AS filteredCount FROM registrationmaster rm LEFT JOIN dropdownmaster gd1 ON rm.Gender = gd1.Id
  LEFT JOIN dropdownmaster gd2 ON rm.Community = gd2.Id
  LEFT JOIN dropdownmaster gd3 ON rm.District = gd3.Id
  LEFT JOIN dropdownmaster gd4 ON rm.State = gd4.Id
  LEFT JOIN dropdownmaster gd5 ON rm.ReferenceBy = gd5.Id
  LEFT JOIN dropdownmaster gd6 ON rm.VisitorCategory = gd6.Id
  LEFT JOIN dropdownmaster gd7 ON rm.BusinessCategory = gd7.Id
  LEFT JOIN dropdownmaster gd8 ON rm.OthersCategory = gd8.Id
  LEFT JOIN dropdownmaster gd9 ON rm.IntrestedSector = gd9.Id
  LEFT JOIN dropdownmaster gd10 ON rm.Session = gd10.Id
  LEFT JOIN dropdownmaster gd11 ON rm.Seminars = gd11.Id
  LEFT JOIN slotmaster sm ON rm.Id = sm.RegistrationId  WHERE 1=1 ${whereSQL}`

    const totalSQL = 'SELECT COUNT(*) AS totalCount FROM registrationmaster'

    const [data, count, total] = await Promise.all([
      db.query(dataSQL, params),
      db.query(countSQL, params.slice(0, -2)), // exclude LIMIT params
      db.query(totalSQL)
    ])

    const cleanedResults = data.map(row => {
      const cleanRow = {}

      for (const [k, v] of Object.entries(row)) {
        if (v === null || v === undefined) cleanRow[k] = ''
        else if (typeof v === 'string') cleanRow[k] = v.replace(/\u0000/g, '')
        else cleanRow[k] = v
      }

      return cleanRow
    })

    const responseData = {
      status: true,
      data: cleanedResults,
      totalCount: total[0]?.totalCount || 0,
      filteredCount: count[0]?.filteredCount || 0
    }

    setCache(cacheKey, responseData, DEFAULT_TTL)

    return new Response(
      JSON.stringify({
        status: true,
        data: cleanedResults,
        totalCount: total[0]?.totalCount || 0,
        filteredCount: count[0]?.filteredCount || 0
      }),
      { status: 200 }
    )
  } catch (err) {
    console.error('Error executing query:', err)

    return new Response(
      JSON.stringify({
        status: false,
        message: err.message || 'Internal Server Error'
      }),
      { status: 500 }
    )
  }
}

export default POST

export const dynamic = "force-dynamic";
import db from '../db'; // Ensure you have the correct database connection file
import { getCache, setCache, DEFAULT_TTL } from '../cache';

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const createCacheKey = (prefix, params = {}) => {
  return `${prefix}:${Buffer.from(JSON.stringify(params)).toString("base64")}`;
};

// API Route to handle the GET request
export async function GET(req) {
  try {
    // Base SQL query
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
           gd10.DropDownValue AS SeminarsName,
           gd11.DropDownValue AS SessionName,
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
    LEFT JOIN dropdownmaster gd10 ON rm.Seminars = gd10.Id
    LEFT JOIN dropdownmaster gd11 ON rm.Session = gd11.Id
    LEFT JOIN slotmaster sm ON rm.Id = sm.RegistrationId
    WHERE 1=1`;

    const params = [];

    const filterKeyMap = {
  RegistrationType: 'RegitrationType',
  RegistrationNoPrefix: 'RegitrationNoPrefix',
  RegistrationNo: 'RegitrationNo',
  RegistrationRunningNo: 'RegitrationRunningNo',
  InterestedSector: 'IntrestedSector',
  InterestedSectorName: 'IntrestedSectorName',
  IsStallApproved: 'IsStallApprove',
  IsStallCanceled: 'IsStallCancelled'
};

 const filters = Object.fromEntries(req.nextUrl.searchParams.entries());


 const cacheKey = createCacheKey("formregistrationlist", filters);

    // CHECK CACHE
    const cached = getCache(cacheKey);

    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: CORS_HEADERS
      });
    }

    // Dynamically build the query
    Object.keys(filters).forEach(key => {
      let dbKey = filterKeyMap[key] || key;
      const value = filters[key];

      if (value === 'NULL') {
        sql += ` AND rm.${dbKey} IS NULL`;
      } else if (value !== undefined && value !== '') {
        sql += ` AND rm.${dbKey} = ?`;
        params.push(value);
      }
    });

    // Execute the query
    const results = await db.query(sql, params);


    const cleanedResults = results.map((row) => {
    const cleanedRow = {};

  for (const key in row) {
    let value = row[key];

    if (Buffer.isBuffer(value)) {
    value = value[0] === 1 ? 1 : 0;
    } else if (value === null || value === undefined) {
      // value = '';
       if (typeof value === 'number') {
        value = 0;
      } else {
        value = '';
      }
    } else if (typeof value === 'string') {
      value = value.replace(/\u0000/g, '');
    }

    const numericFields = [
      'Age',
      'YearEstablished',
      'BusinessTurnOver',
      'RegitrationRunningNo',
      'AlreadyAttended',
      'IsStallApprove',
      'IsActive',
      'IsStallCancelled',
      'IsCheckedIn'
    ];

    if (numericFields.includes(key)) {
      value = value === '' ? 0 : Number(value);
    }

    cleanedRow[key] = value;
  }

  cleanedRow.IsStallApproved = cleanedRow.IsStallApprove ?? 0;
  delete cleanedRow.IsStallApprove;

  cleanedRow.IsStallCanceled = cleanedRow.IsStallCancelled ?? 0;
  delete cleanedRow.IsStallCancelled;

  cleanedRow.RegistrationType = cleanedRow.RegitrationType || '';
  delete cleanedRow.RegitrationType;

  cleanedRow.RegistrationNoPrefix = cleanedRow.RegitrationNoPrefix || '';
  delete cleanedRow.RegitrationNoPrefix;

  cleanedRow.RegistrationNo = cleanedRow.RegitrationNo || '';
  delete cleanedRow.RegitrationNo;

  cleanedRow.RegistrationRunningNo = cleanedRow.RegitrationRunningNo || 0;
  delete cleanedRow.RegitrationRunningNo;

  cleanedRow.InterestedSector = cleanedRow.IntrestedSector || '';
  delete cleanedRow.IntrestedSector;

  cleanedRow.InterestedSectorName = cleanedRow.IntrestedSectorName || '';
  delete cleanedRow.IntrestedSectorName;

  return cleanedRow;

});


    // Get the total count
    const countResult = await db.query('SELECT FOUND_ROWS() AS totalCount');
    const totalCount = countResult[0]?.totalCount || 0;

    const finalResponse = {
      status: true,
      data: cleanedResults,
      totalCount
    };


    setCache(cacheKey, finalResponse, DEFAULT_TTL);

    // Return the results
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    };

    if (!results.length) {
      return new Response(
        JSON.stringify({ status: false, message: 'Data not found.', totalCount }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    return new Response(
      JSON.stringify({ status: true, data: cleanedResults, totalCount }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error('Error executing query:', err);

    return new Response(
      JSON.stringify({ status: false, message: err.message || 'Internal Server Error' }),
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
}

// Handle OPTIONS for CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  });
}

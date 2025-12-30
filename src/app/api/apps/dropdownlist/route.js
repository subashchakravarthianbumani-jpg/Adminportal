// import db from '../db';
// import { getCache, setCache } from '../cache';

// const CACHE_TTL = 5 * 60 * 1000;


// export async function GET(req) {
//   try {
//     // Extract query parameters
//     const { searchParams } = new URL(req.url);
//     const type = searchParams.get('type');
//     const DependentId = searchParams.get('DependentId');

//     const cacheKey = `dropdown:${type}:${DependentId}`;


//    const cachedData = getCache(cacheKey);

//     if (cachedData) {
//       return new Response(
//         JSON.stringify({ status: true, message: 'Dropdown fetched from cache', data: cachedData }),
//         { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
//       );
//     }


//     // Prepare dependent value
//     const Dependent = DependentId || '';

//     // SQL query for the stored procedure
//     const sql = 'CALL Settings_SP_GetDropdownList(?, ?)';
//     const results = await db.query(sql, [type, Dependent]);

//     // Access the first array of results (stored procedure result)
//     // const processedResults = results?.[0]?.[0] || [];
//     const processedResults = results || [];

//     // Store in cache
//     setCache(cacheKey, processedResults, 300000); // 5 min TTL

//     // CORS Headers
//     const headers = {
//       'Content-Type': 'application/json',
//       'Access-Control-Allow-Origin': '*', // Allow all origins, or replace '*' with a specific domain
//       'Access-Control-Allow-Methods': 'GET, OPTIONS', // Allowed methods
//       'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Allowed headers
//     };

//     // Return success response
//     return new Response(
//       JSON.stringify({
//         status: true,
//         message: 'Dropdown list fetched successfully',
//         data: processedResults,
//       }),
//       { status: 200, headers }
//     );
//   } catch (err) {
//     console.error('Error fetching dropdown list:', err);

//     // CORS Headers
//     const headers = {
//       'Content-Type': 'application/json',
//       'Access-Control-Allow-Origin': '*', // Allow all origins
//     };

//     // Return error response
//     return new Response(
//       JSON.stringify({
//         status: false,
//         message: 'An error occurred while fetching the dropdown list',
//         error: err.message,
//       }),
//       { status: 500, headers }
//     );
//   }
// }

// // Handle OPTIONS requests for preflight
// export async function OPTIONS() {
//   return new Response(null, {
//     status: 204,
//     headers: {
//       'Access-Control-Allow-Origin': '*', // Allow all origins
//       'Access-Control-Allow-Methods': 'GET, OPTIONS', // Allowed methods
//       'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Allowed headers
//     },
//   });
// }


import db from '../db';
import { getCache, setCache, DEFAULT_TTL } from '../cache';
import { deleteCacheByPrefix } from '../cache'

export async function GET(req) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const DependentId = searchParams.get('DependentId') || '';

    const cacheKey = `DropdownList:${type}:${DependentId}`;

    // Check if cached response exists
    const cachedResponse = getCache(cacheKey);

    if (cachedResponse) {
      return new Response(JSON.stringify(cachedResponse), { status: 200, headers });
    }

    let processedResults;
    let responseData;

    try {
      // Fetch from DB
      const sql = 'CALL Settings_SP_GetDropdownList(?, ?)';

      const results = await db.query(sql, [type, DependentId]);

      processedResults = results || [];

      // Prepare exact response object
      responseData = {
        status: true,
        message: 'Dropdown list fetched successfully',
        data: processedResults,
      };

      // Store in cache
      try {
        setCache(cacheKey, responseData, DEFAULT_TTL);
      } catch (cacheErr) {
        console.warn('Cache set failed:', cacheErr);
      }

      return new Response(JSON.stringify(responseData), { status: 200, headers });
    } catch (dbErr) {
      console.error('DB error:', dbErr);

      // If DB fails, try to return stale cache
      if (cachedResponse) {
        console.warn('Returning stale cache due to DB error');

        return new Response(JSON.stringify(cachedResponse), { status: 200, headers });
      }

      // No cache available
      return new Response(
        JSON.stringify({ status: false, message: 'Database error and no cache available', error: dbErr.message }),
        { status: 500, headers }
      );
    }
  } catch (err) {
    console.error('API error:', err);

    return new Response(
      JSON.stringify({ status: false, message: 'Internal server error', error: err.message }),
      { status: 500, headers }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

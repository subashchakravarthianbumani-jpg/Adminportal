// src/app/api/apps/saveUpdate/route.js
import { NextResponse } from 'next/server';

import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

import db from '../db'; // Adjust the path based on your project structure

export async function POST(req) {
  try {
    const input = await req.json();
    const dataArray = Array.isArray(input) ? input : [input];

    if (dataArray.length === 0) {
      return NextResponse.json({ status: false, message: 'Data is required' }, { status: 400 });
    }

    const resultsArray = [];
    let insertedCount = 0;
    let uninsertedCount = 0;
    const now = new Date();
    const formattedDate = format(now, 'yyyy-MM-dd HH:mm:ss');

    for (const data of dataArray) {
      const generatedId = data.Id || uuidv4();
      const finalSavedBy = data.SavedBy || generatedId;

      const sql =
        'CALL Settings_SP_Registration_SaveUpdate(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

      const params = [
        generatedId,
        data.RegistrationType ?? '',
        data.RegitrationNoPrefix ?? '',
        data.RegistrationNo ?? '',
        data.RegitrationRunningNo ?? '',
        data.FirstName ?? '',
        data.LastName ?? '',
        data.Gender ?? '',
        data.Age ?? '0',
        data.Community ?? '',
        data.Phone ?? '',
        data.Email ?? '',
        data.District ?? '',
        data.State ?? '',
        data.ReferenceBy ?? '',
        data.VisitorCategory ?? '',
        data.PurposeOfVisit ?? '',
        data.IntrestedSector ?? '',
        data.PurposeOfParticipation ?? '',
        data.CompanyName ?? '',
        data.BusinessCategory ?? '',
        data.BusinessType ?? '',
        data.BusinessTrade ?? '',
        data.YearEstablished ?? '',
        data.BusinessTurnOver ?? '',
        data.UdyogRegistrationId ?? '',
        data.GSTNumber ?? '',
        data.DescriptionOfProducts ?? '',
        data.Seminars ?? '',
        data.IsMoreStallsReq ?? '',
        data.OthersCategory ?? '',
        finalSavedBy,
        data.ReferenceByOthers ?? '',
        data.NatureOfActivities ?? '',
        data.ProductImage ?? '',
        data.StallSize ?? '',
        data.Width ?? '',
        data.Height ?? '',
        data.AlreadyAttended ?? '0',
        data.PreviousStallImage ?? '',
        formattedDate,
        `${data.FirstName} ${data.LastName}` ?? ''
      ];

      try {
        const results = await db.execute(sql, params);
        const status = results?.[0]?.[0]?.RegitrationNo !== '';

        if (status) {
          insertedCount++;
          resultsArray.push({
            status: true,
            message: `${data.RegistrationNo} Saved successfully`,
          });
        } else {
          uninsertedCount++;
          resultsArray.push({
            status: false,
            message: 'Failed to save record',
            data,
          });
        }
      } catch (error) {
        uninsertedCount++;
        resultsArray.push({
          status: false,
          message: error.message,
          data,
        });
      }
    }

    const hasFailedRecords = uninsertedCount > 0;
    const commonMessage = `Total Saved: ${insertedCount}, Total Failed: ${uninsertedCount}`;

    return NextResponse.json(
      {
        status: !hasFailedRecords,
        message: commonMessage,
        results: resultsArray,
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error) {
    console.error('Error occurred:', error);

    return NextResponse.json(
      { status: false, message: 'Internal server error', error: error.message || error },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

import path from 'path';
import { promises as fs } from 'fs';

import { NextResponse } from 'next/server';

import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

import QRCode from 'qrcode';

import db from '../db';

import { clearCache } from '../cache';

import { deleteCacheByPrefix } from '../cache.js';

const publicFolder = path.join(process.cwd(), 'public', 'uploads');
const logoPath = path.join(__dirname, '..','..','..','..','..', '..', 'public', 'images', 'logos', 'logo.png');

// Helper function to get client IP address
function getClientIP(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {

    return realIP;
  }

  return 'Unknown';
}

// Helper function to call Log_Entry procedure
async function logAction(description, moduleName, action, oldData, newData, ipAddress, userId, userName) {
  try {
    const sql = `CALL Log_Entry(?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      description,
      moduleName,
      action,
      oldData ? JSON.stringify(oldData) : null,
      newData ? JSON.stringify(newData) : null,
      ipAddress,
      userId,
      userName
    ];

    await db.query(sql, params);
    deleteCacheByPrefix('loglist');

    console.log('Log entry created successfully');
  } catch (error) {
    console.error('Error creating log entry:', error);
  }
}

// Helper function to get existing registration data from database
async function getExistingRegistration(id) {
  try {
    const sql = `SELECT * FROM registrationmaster WHERE Id = ? AND IsActive = 1 LIMIT 1`;
    const rows = await db.query(sql, [id]);

    // Handle different response structures
    if (rows.length > 0) {
      return rows[0];
    }

    return null;
  } catch (error) {
    console.error('Error fetching existing registration:', error);

    return null;
  }
}

// Helper function to compare and get changed fields
function getChangedFields(oldData, newData) {
  const changes = {};
  const oldChanges = {};

  for (const key in newData) {
    if (newData[key] !== null && newData[key] !== undefined && newData[key] !== '') {
      if (oldData[key] !== newData[key]) {
        changes[key] = newData[key];
        oldChanges[key] = oldData[key];
      }
    }
  }

  return { changes, oldChanges };
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req) {
  const clientIP = getClientIP(req);
  let userId = null;
  let userName = null;
  let registrationNo = null;
  let isUpdate = false;
  let existingData = null;

  try {
    const formData = await req.formData();
    const dataObject = {};
    const now = new Date();
    const formattedDate = format(now, 'yyyy-MM-dd HH:mm:ss');
    let status = false;

    // Ensure the uploads folder exists
    await fs.mkdir(publicFolder, { recursive: true });

    // Process form data
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && (key === 'PreviousYearStallImage' || key === 'productImage')) {
        const fileExtension = path.extname(value.name);
        const fileName = `${uuidv4()}${fileExtension}`;
        const filePath = path.join(publicFolder, fileName);

        const fileData = Buffer.from(await value.arrayBuffer());

        await fs.writeFile(filePath, fileData);

        dataObject[key] = `/uploads/${fileName}`;
      } else {
        dataObject[key] = value;
      }
    }

    // Data validation
    if (Object.keys(dataObject).length === 0) {
      await logAction(
        'Registration attempt failed - No data provided',
        'Registration',
        'CREATE_FAILED',
        null,
        null,
        clientIP,
        userId,
        userName
      );
      throw new Error(`Parameter(s) are required`);
    }

    const allowedKeys = [
      "Id","RegistrationType", "RegitrationNoPrefix", "RegistrationNo", "RegitrationRunningNo",
      "FirstName", "LastName", "Gender", "Age", "Community", "Phone", "Email",
      "District", "State", "ReferenceBy", "VisitorCategory", "PurposeOfVisit",
      "IntrestedSector", "PurposeOfParticipation", "CompanyName", "BusinessCategory",
      "BusinessType", "BusinessTrade", "YearEstablished", "BusinessTurnOver",
      "UdyogRegistrationId", "GSTNumber", "DescriptionOfProducts", "Seminars",
      "IsMoreStallsReq", "OthersCategory", "ReferenceByOthers", "NatureOfActivities",
      "productImage", "StallSize", "StallLength", "Stallbreadth", "AlreadyAttended",
      "PreviousYearStallImage", "sltSession", "StallType", "PanNo", "Items", "ExhType"
    ];

    // Create a mapping of lowercase keys to correct keys
    const keyMapping = {};

    allowedKeys.forEach(key => {
      keyMapping[key.toLowerCase()] = key;
    });

    // Common spelling corrections
    const spellingCorrections = {
      'registration': 'Regitration',
      'interested': 'Intrested',
      'stallbreadth': 'Stallbreadth',
      'Session': 'sltSession',
    };

    // Normalize and correct keys
    const normalizedDataObject = {};
    const invalidKeys = [];

    for (const [originalKey, value] of Object.entries(dataObject)) {
      let normalizedKey = originalKey;
      const lowerKey = originalKey.toLowerCase();

      if (keyMapping[lowerKey]) {
        normalizedKey = keyMapping[lowerKey];
      } else {
        let correctedKey = originalKey;

        for (const [wrong, correct] of Object.entries(spellingCorrections)) {
          const wrongPattern = new RegExp(wrong, 'gi');

          correctedKey = correctedKey.replace(wrongPattern, correct);
        }

        const correctedLowerKey = correctedKey.toLowerCase();

        if (keyMapping[correctedLowerKey]) {
          normalizedKey = keyMapping[correctedLowerKey];
        } else {
          invalidKeys.push(originalKey);
          continue;
        }
      }

      normalizedDataObject[normalizedKey] = value;
    }

    // Replace original dataObject with normalized version
    Object.keys(dataObject).forEach(key => delete dataObject[key]);
    Object.assign(dataObject, normalizedDataObject);

    if (invalidKeys.length > 0) {
      await logAction(
        `Registration attempt failed - Invalid parameters: ${invalidKeys.join(", ")}`,
        'Registration',
        'VALIDATION_FAILED',
        null,
        dataObject,
        clientIP,
        userId,
        userName
      );

      const messageFinal = `Invalid parameter(s): ${invalidKeys.join(", ")}`;

      return NextResponse.json(
        {
          status: false,
          message: messageFinal
        },
        {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );

      // throw new Error(`Invalid parameter(s): ${invalidKeys.join(", ")}`);

    }

    // Check if this is an update operation
    const generatedId = dataObject.Id || uuidv4();
    const finalSavedBy = dataObject.SavedBy || generatedId;

    userId = generatedId;
    userName = `${dataObject.FirstName || ''} ${dataObject.LastName || ''}`.trim();

    // Fetch existing data if ID exists
    if (dataObject.Id) {
      existingData = await getExistingRegistration(dataObject.Id);

      if (existingData) {
        isUpdate = true;
        registrationNo = existingData.RegitrationNo;
      }
    }

    const RegistrationType = dataObject.RegistrationType;

    const sql = `
      CALL Settings_SP_Registration_SaveUpdate(
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?
      )`;

    const params = [
      generatedId,
      dataObject.RegistrationType || null,
      dataObject.RegitrationNoPrefix || null,
      dataObject.RegistrationNo || null,
      dataObject.RegitrationRunningNo || null,
      dataObject.FirstName || null,
      dataObject.LastName || null,
      dataObject.Gender || null,
      dataObject.Age || null,
      dataObject.Community || null,
      dataObject.Phone || null,
      dataObject.Email || null,
      dataObject.District || null,
      dataObject.State || null,
      dataObject.ReferenceBy || null,
      dataObject.VisitorCategory || null,
      dataObject.PurposeOfVisit || null,
      dataObject.IntrestedSector || null,
      dataObject.PurposeOfParticipation || null,
      dataObject.CompanyName || null,
      dataObject.BusinessCategory || null,
      dataObject.BusinessType || null,
      dataObject.BusinessTrade || null,
      dataObject.YearEstablished || null,
      dataObject.BusinessTurnOver || null,
      dataObject.UdyogRegistrationId || null,
      dataObject.GSTNumber || null,
      dataObject.DescriptionOfProducts || null,
      dataObject.Seminars || null,
      dataObject.IsMoreStallsReq || null,
      dataObject.OthersCategory || null,
      finalSavedBy,
      dataObject.ReferenceByOthers || null,
      dataObject.NatureOfActivities || null,
      dataObject.productImage || null,
      dataObject.StallSize || null,
      dataObject.StallLength || null,
      dataObject.Stallbreadth || null,
      dataObject.AlreadyAttended || null,
      dataObject.PreviousYearStallImage || null,
      dataObject.sltSession || null,
      dataObject.StallType || null,
      dataObject.PanNo || null,
      dataObject.Items || null,
      dataObject.ExhType || null,
      formattedDate,
      userName || '',
    ];

    const results = await db.query(sql, params);

    // registrationNo = results?.[0]?.[0]?.[0]?.RegitrationNo;
    registrationNo = results?.[0]?.RegitrationNo || null;

    // Check for error response from stored procedure
    if (registrationNo && registrationNo.startsWith('ERROR: ')) {
      status = false;
      const messageFinal = registrationNo.replace('ERROR: ', '');

      await logAction(
        `Registration ${isUpdate ? 'update' : 'creation'} failed: ${messageFinal}`,
        'Registration',
        isUpdate ? 'UPDATE_FAILED' : 'CREATE_FAILED',
        isUpdate ? existingData : null,
        { ...dataObject, registrationNo },
        clientIP,
        userId,
        userName
      );

      return NextResponse.json(
        {
          status: false,
          message: messageFinal
        },
        {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Successful operation
    status = results?.[0]?.RegitrationNo !== '';

    const formatDate = (date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      return `${day}-${month}-${year} ${hours}:${minutes}`;
    };

    let messageFinal = '';

    if (status == true) {
      const phoneNumber = dataObject.Phone;
      const { RegitrationNo } = results[0];
      const dataObjects = results[0];

      console.log('Extracted Data:', dataObjects.RegitrationNo);
      messageFinal = dataObjects.RegitrationNo;

      clearCache("countlist");
      clearCache("dailyreport");
      clearCache("dashboardcounts");

      // clearCache("dropdown:*");
      clearCache("interval:*");
      deleteCacheByPrefix('registrationlist:');
      deleteCacheByPrefix('formregistrationlist:');

      // Log based on operation type
      if (isUpdate) {
        const { changes, oldChanges } = getChangedFields(existingData, dataObject);

        if (Object.keys(changes).length > 0) {
          // Log complete old data from database and new changes
          await logAction(
            `Registration updated successfully - Registration No: ${messageFinal} - Changed fields: ${Object.keys(changes).join(', ')}`,
            'Registration',
            'UPDATE',
            existingData,  // Complete old data from registrationmaster table
            { ...dataObject, registrationNo: messageFinal }, // All new data submitted
            clientIP,
            userId,
            userName
          );
        } else {
          await logAction(
            `Registration accessed without changes - Registration No: ${messageFinal}`,
            'Registration',
            'VIEW',
            existingData,  // Complete existing data from database
            { registrationNo: messageFinal },
            clientIP,
            userId,
            userName
          );
        }
      } else {
        // New registration - no old data
        await logAction(
          `Registration created successfully - Registration No: ${messageFinal}`,
          'Registration',
          'CREATE',
          null,  // No old data for new registration
          { ...dataObject, registrationNo: messageFinal },
          clientIP,
          userId,
          userName
        );
      }

      // Send SMS only for new registrations
      if (!isUpdate) {
        const cleanedType = RegistrationType.replace(/[^a-zA-Z0-9_ ]/g, '').replace(/_/g, ' ');
        const formattedType = cleanedType.charAt(0).toUpperCase() + cleanedType.slice(1).toLowerCase();
        const RefNo = `${formattedType} Registration ${messageFinal}`;
        const DateTime = formatDate(new Date());

        const messageText = `Hi ${dataObject.FirstName}, you've completed the ${RefNo} successfully on ${DateTime} -TAHDCO`;

        console.log("messageText:", messageText);

        const smsApiUrl = `http://panel.smsmessenger.in/api/mt/SendSMS?user=tahdco&password=T@hdc0&senderid=TAHDCO&channel=Trans&DCS=0&flashsms=0&number=${phoneNumber}&text=${encodeURIComponent(messageText)}&route=6&peid=1101634270000046830&DLTTemplateId=1107172778136171249`;

        try {
          const smsResponse = await fetch(smsApiUrl, { method: 'GET' });
          const smsResult = await smsResponse.json();

          if (smsResult.ErrorCode !== '0') {
            console.error('SMS sending failed:', smsResult.ErrorMessage);
            await logAction(
              `SMS sending failed for Registration No: ${messageFinal}`,
              'Notification',
              'SMS_FAILED',
              null,
              { phone: phoneNumber, error: smsResult.ErrorMessage },
              clientIP,
              userId,
              userName
            );
          } else {
            console.log('SMS sent successfully!');
            await logAction(
              `SMS sent successfully for Registration No: ${messageFinal}`,
              'Notification',
              'SMS_SENT',
              null,
              { phone: phoneNumber, registrationNo: messageFinal },
              clientIP,
              userId,
              userName
            );
          }
        } catch (error) {
          console.error('Error sending SMS:', error);
          await logAction(
            `SMS error for Registration No: ${messageFinal}`,
            'Notification',
            'SMS_ERROR',
            null,
            { phone: phoneNumber, error: error.message },
            clientIP,
            userId,
            userName
          );
        }

        // Send Email only for new registrations
        if (dataObject.Email != '') {
          const to = dataObject.Email;
          const subject = 'TN-BEAT EXPO Registration confirmation';
          const qrData = `https://eventreg.tahdco.com/#/idcard/${messageFinal}`;
          const qrCodeDataUri = await QRCode.toDataURL(qrData);
          let htmlContent = '';

          if (RegistrationType === 'EXHIBITORS') {
            htmlContent = `<p id="hi"> Dear ${dataObject.FirstName} ,</p>
            <p id='para'>Thanks, for your registration. The details are below:</p>
            <table>
            <tr>
            <td>Registration Number</td>
            <td>:<b>${messageFinal}</b></td>
            </tr>
            <tr>
            <td>Registration Type.</td>
            <td>:<b>${RegistrationType}</b></td>
            </tr>
            <tr>
            <td>Registration Date and Time</td>
            <td>:<b>${DateTime}</b></td>
            </tr>
            <tr>
            <td>Registration Status</td>
            <td>:<b>Active</b></td>
            </tr>
            </table>
            <p>You will receive another email after the stall has been confirmed by TN BEAT Management.</p>
            <br>
            <table>
            <tr>
            <td>EXPO Dates</td>
            <td>:<b>25<sup>th</sup> and 26<sup>th</sup> January, 2025</b></td>
            </tr>
            <tr>
            <td>EXPO Venue</td>
            <td>:<b>Chennai Trade Centre – Nandambakkam, Chennai - 600089</b></td>
            </tr>
            </table>
            <p>If you have any questions, Please reach out TN-BEAT EXPO management.</p><br>

            <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f3f4f6; margin: 0;" class="dummy" id="dummy">
              <div style="background-color: white; border-radius: 12px; box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1); width: 90%; max-width: 477px; margin-bottom: 16px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <img src="cid:logo" alt="Form Illustration" style="max-width: 100%; height: auto; max-width: 377px;" />
                </div>
                <div style="background: linear-gradient(90deg, #040E56 0%, #006D5D 100%); color: white; font-size: 20px; font-weight: bold; text-align: center; padding: 16px 0 59px; line-height: 1.55rem; margin-bottom: 24px;">
                  Tamilnadu Adi Dravidar Housing & Development Corporation
                </div>
                <div style="text-align: center; margin-top: -30px;">
                  <div style="width: 200px; height: 200px; border-radius: 10px; border: 15px solid white; background-image: url('cid:qrcode'); background-repeat: no-repeat; background-size: cover; background-position: center; margin: 0 auto;"></div>
                  <div style="font-weight: 700; font-size: 36px; text-align: center; margin-top: 24px; color: #000;">
                    ${dataObject.FirstName} ${dataObject.LastName}
                  </div>
                  <div style="font-family: 'Alice', serif; font-size: 30px; line-height: 40px; text-align: center; margin-top: 8px;">
                    ${messageFinal}
                  </div>
                </div>
                <div style="background: linear-gradient(90deg, #040E56 0%, #006D5D 100%); color: white; font-family: 'Archivo Black', sans-serif; font-weight: 700; font-size: 20px; text-align: center; padding: 8px 0; margin-top: 16px;">
                  ${RegistrationType}
                </div>
              </div>
            </div>
            <br>
            <p>Thanks,</p>
            <p>TN-BEAT EXPO 2025 2<sup>nd</sup> Edition</p>
            <p>Contact: 94450 29534  |  91502 77736</p><br>
            <p>TAHDCO - Tamil Nadu Adi Dravidar Housing & Development Corporation Ltd</p>
            <p> #31, Cenotaph Road, Teynampet, Chennai - 600018</p>`;
          } else {
            htmlContent = `<p id="hi"> Dear ${dataObject.FirstName} ,</p>
            <p id='para'>Thanks, for your registration. The details are below:</p>
            <table>
            <tr>
            <td>Registration Number</td>
            <td>:<b>${messageFinal}</b></td>
            </tr>
            <tr>
            <td>Registration Type.</td>
            <td>:<b>${RegistrationType}</b></td>
            </tr>
            <tr>
            <td>Registration Date and Time</td>
            <td>:<b>${DateTime}</b></td>
            </tr>
            <tr>
            <td>Registration Status</td>
            <td>:<b>Active</b></td>
            </tr>
            </table>
            <br>
            <table>
            <tr>
            <td>EXPO Dates</td>
            <td>:<b>25<sup>th</sup> and 26<sup>th</sup> January, 2025</b></td>
            </tr>
            <tr>
            <td>EXPO Venue</td>
            <td>:<b>Chennai Trade Centre – Nandambakkam, Chennai - 600089</b></td>
            </tr>
            </table>
            <p>If you have any questions, Please reach out TN-BEAT EXPO management.</p><br>

            <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f3f4f6; margin: 0;" class="dummy" id="dummy">
              <div style="background-color: white; border-radius: 12px; box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1); width: 90%; max-width: 477px; margin-bottom: 16px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <img src="cid:logo" alt="Form Illustration" style="max-width: 100%; height: auto; max-width: 377px;" />
                </div>
                <div style="background: linear-gradient(90deg, #040E56 0%, #006D5D 100%); color: white; font-size: 20px; font-weight: bold; text-align: center; padding: 16px 0 59px; line-height: 1.55rem; margin-bottom: 24px;">
                  Tamilnadu Adi Dravidar Housing & Development Corporation
                </div>
                <div style="text-align: center; margin-top: -30px;">
                  <div style="width: 200px; height: 200px; border-radius: 10px; border: 15px solid white; background-image: url('cid:qrcode'); background-repeat: no-repeat; background-size: cover; background-position: center; margin: 0 auto;"></div>
                  <div style="font-weight: 700; font-size: 36px; text-align: center; margin-top: 24px; color: #000;">
                    ${dataObject.FirstName} ${dataObject.LastName}
                  </div>
                  <div style="font-family: 'Alice', serif; font-size: 30px; line-height: 40px; text-align: center; margin-top: 8px;">
                    ${messageFinal}
                  </div>
                </div>
                <div style="background: linear-gradient(90deg, #040E56 0%, #006D5D 100%); color: white; font-family: 'Archivo Black', sans-serif; font-weight: 700; font-size: 20px; text-align: center; padding: 8px 0; margin-top: 16px;">
                  ${RegistrationType}
                </div>
              </div>
            </div>
            <br>
            <p>Thanks,</p>
            <p>TN-BEAT EXPO 2025 2<sup>nd</sup> Edition</p>
            <p>Contact: 94450 29534  |  91502 77736</p>
            <p>TAHDCO - Tamil Nadu Adi Dravidar Housing & Development Corporation Ltd</p>
            <p> #31, Cenotaph Road, Teynampet, Chennai - 600018</p>`;
          }

          try {
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST,
              port: process.env.SMTP_PORT,
              secure: process.env.SMTP_SECURE === 'true',
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            });

            const emailInfo = await transporter.sendMail({
              from: `"TN-BEAT EXPO" <${process.env.SMTP_USER}>`,
              to,
              subject,
              html: htmlContent,
              attachments: [
                {
                  filename: 'qrcode.png',
                  content: qrCodeDataUri.split(',')[1],
                  encoding: 'base64',
                  cid: 'qrcode',
                },
                {
                  filename: 'logo.png',
                  path: logoPath,
                  cid: 'logo',
                }
              ],
            });

            console.log('Email sent successfully:', emailInfo.messageId);
            await logAction(
              `Email sent successfully for Registration No: ${messageFinal}`,
              'Notification',
              'EMAIL_SENT',
              null,
              { email: to, registrationNo: messageFinal },
              clientIP,
              userId,
              userName
            );
          } catch (error) {
            console.error('Error in Email :', error.message);
            await logAction(
              `Email error for Registration No: ${messageFinal}`,
              'Notification',
              'EMAIL_ERROR',
              null,
              { email: to, error: error.message },
              clientIP,
              userId,
              userName
            );
          }
        }
      }
    }

    return NextResponse.json(
      {
        status,
        message: messageFinal
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );

  } catch (error) {
    console.error('Error occurred:', error);

    // Log the error
    await logAction(
      `Registration error: ${error.message}`,
      'Registration',
      'ERROR',
      null,
      { error: error.message, stack: error.stack },
      clientIP,
      userId,
      userName
    );

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

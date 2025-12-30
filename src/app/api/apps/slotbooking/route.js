import path from 'path';

import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

import * as QRCode from 'qrcode';

import db from '../db';

import { validateToken } from '../validateToken';

import { clearCache, deleteCacheByPrefix } from '../cache';

const SECRET_KEY = process.env.SECRET_KEY
const logoPath = path.join(__dirname, '..','..','..','..','..', '..', 'public', 'images', 'logos', 'logo.png');

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

    await db.execute(sql, params)
    deleteCacheByPrefix('loglist');
    console.log('Log entry created successfully')
  } catch (error) {
    console.error('Error creating log entry:', error)
  }
}

// Helper function to get existing slot booking status
async function getExistingSlotBooking(registrationId, slotId) {
  try {
    const sql = `SELECT * FROM slotbooking WHERE RegistrationId = ? OR SlotId = ? LIMIT 1`
    const results = await db.query(sql, [registrationId, slotId])

    // if (results && results[0] && Array.isArray(results[0]) && results[0].length > 0) {
    //   return results[0][0]
    // }

    if (Array.isArray(results) && results.length > 0) {
      return results[0];
    }

    return null
  } catch (error) {
    console.error('Error fetching existing slot booking:', error)

    return null
  }
}


function formatDate(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// API route for Slot Booking (POST method)
export async function POST(req) {
  const clientIP = getClientIP(req)
  let userId = null
  let userName = null
  let registrationNo = null
  let existingBooking = null

  try {
    // Validate token
    const user = await validateToken(req)

    const { StallApprove, SlotId, Isbooked, RegistrationId, SavedBy, SavedUserName } = await req.json()

    // Set user info
    userId = SavedBy || user?.userId || 'SYSTEM'
    userName = SavedUserName || user?.userName || 'System User'

    // Validate required fields
    if (!StallApprove || !SavedBy || !SavedUserName) {
      await logAction(
        'Stall approval attempt failed - Missing required fields',
        'StallApproval',
        'VALIDATION_FAILED',
        null,
        { StallApprove, SavedBy, SavedUserName },
        clientIP,
        userId,
        userName
      )

      return new Response(
        JSON.stringify({
          status: false,
          message: "'StallApprove', 'SavedBy', and 'SavedUserName' are required."
        }),
        { status: 400 }
      )
    }

    const validateQuery = `
      SELECT
        (SELECT COUNT(*) FROM slotmaster WHERE Id = ?) AS SlotExists,
        (SELECT COUNT(*) FROM registrationmaster WHERE Id = ?) AS RegistrationExists,
        (SELECT COUNT(*) FROM usermaster WHERE Id = ? AND UserName = ?) AS UserExists
    `

    const validationResults = await db.query(validateQuery, [SlotId, RegistrationId, SavedBy, SavedUserName])
    const { SlotExists, RegistrationExists, UserExists } = validationResults[0]

    if (SlotId && SlotExists === 0) {
      await logAction(
        `Stall approval failed - Invalid SlotId: ${SlotId}`,
        'StallApproval',
        'VALIDATION_FAILED',
        null,
        { SlotId, error: 'Slot does not exist' },
        clientIP,
        userId,
        userName
      )

      return new Response(
        JSON.stringify({
          status: false,
          message: "Invalid 'SlotId'. It does not exist in the slotmaster table."
        }),
        { status: 400 }
      )
    }

    if (RegistrationId && RegistrationExists === 0) {
      await logAction(
        `Stall approval failed - Invalid RegistrationId: ${RegistrationId}`,
        'StallApproval',
        'VALIDATION_FAILED',
        null,
        { RegistrationId, error: 'Registration does not exist' },
        clientIP,
        userId,
        userName
      )

      return new Response(
        JSON.stringify({
          status: false,
          message: "Invalid 'RegistrationId'. It does not exist in the registrationmaster table."
        }),
        { status: 400 }
      )
    }

    if (UserExists === 0) {
      await logAction(
        `Stall approval failed - Invalid user credentials`,
        'StallApproval',
        'VALIDATION_FAILED',
        null,
        { SavedBy, SavedUserName, error: 'User validation failed' },
        clientIP,
        userId,
        userName
      )

      return new Response(
        JSON.stringify({
          status: false,
          message: "Invalid 'SavedBy' or 'SavedUserName'. They do not match in the usermaster table."
        }),
        { status: 400 }
      )
    }

    // Get existing booking status
    if (RegistrationId || SlotId) {
      existingBooking = await getExistingSlotBooking(RegistrationId, SlotId)
    }

    // Get registration details
    const Registration = 'SELECT * FROM registrationmaster WHERE Id = ?'
    const results2 = await db.query(Registration, [RegistrationId])
    const registration = results2[0]

    if (registration) {
      registrationNo = registration.RegitrationNo
      userId = registration.Id
      userName = `${registration.FirstName || ''} ${registration.LastName || ''}`.trim()
    }

    const now = new Date()
    const SavedDate = formatDate(new Date())

    const params = [
      StallApprove || 0,
      SlotId || null,
      Isbooked || 0,
      RegistrationId || null,
      SavedBy || null,
      SavedDate,
      SavedUserName || null
    ]

    console.log('Params:', params)

    const sql = 'CALL Settings_SP_ApproveSaveSlotSelection(?, ?, ?, ?, ?, ?, ?)'
    const results = await db.query(sql, params)

    console.log('Results:', results)

    const procedureResult = results[0]
    const messageKey = Object.keys(procedureResult)[0]
    const messageValue = procedureResult[messageKey]

    clearCache("countlist");
    clearCache("dailyreport");
    clearCache("dashboardcounts");
    clearCache("dashboard");
    clearCache("interval:*");
    deleteCacheByPrefix('registrationlist:');
    deleteCacheByPrefix('formregistrationlist:');
    deleteCacheByPrefix('slotlist');

    // Prepare data for logging
    const bookingData = {
      registrationId: RegistrationId,
      registrationNo: registrationNo,
      slotId: SlotId,
      stallApprove: StallApprove,
      isBooked: Isbooked,
      savedDate: SavedDate
    }

    if (messageValue) {
      if (messageValue == 'Booking successful') {
        const slot = 'SELECT * FROM slotmaster WHERE Id = ?'
        const results1 = await db.query(slot, [SlotId])
        const slotbooked = results1[0]
        const DateTime = formatDate(new Date())

        // Log successful booking
        await logAction(
          `Stall booking successful - Registration No: ${registrationNo}, Slot: ${slotbooked?.SlotNumber || SlotId}`,
          'StallApproval',
          'BOOKING_SUCCESS',
          existingBooking,
          { ...bookingData, slotNumber: slotbooked?.SlotNumber },
          clientIP,
          userId,
          userName
        )

        const messageText = `Hi ${registration.FirstName}, you've completed the Stall Booking Registration confirmed successfully on ${DateTime} -TAHDCO`

        console.log("messageText:", messageText)

        const smsApiUrl = `http://panel.smsmessenger.in/api/mt/SendSMS?user=tahdco&password=T@hdc0&senderid=TAHDCO&channel=Trans&DCS=0&flashsms=0&number=${registration.Phone}&text=${encodeURIComponent(messageText)}&route=6&peid=1101634270000046830&DLTTemplateId=1107172778136171249`

        console.log("smsApiUrl:", smsApiUrl)

        try {
          const smsResponse = await fetch(smsApiUrl, { method: 'GET' })
          const smsResult = await smsResponse.json()

          if (smsResult.ErrorCode !== '0') {
            console.error('SMS sending failed:', smsResult.ErrorMessage)
            await logAction(
              `SMS sending failed for Registration No: ${registrationNo}`,
              'Notification',
              'SMS_FAILED',
              null,
              { phone: registration.Phone, error: smsResult.ErrorMessage },
              clientIP,
              userId,
              userName
            )
          } else {
            console.log('SMS sent successfully!')
            await logAction(
              `Stall approval SMS sent - Registration No: ${registrationNo}`,
              'Notification',
              'SMS_SENT',
              null,
              { phone: registration.Phone, registrationNo },
              clientIP,
              userId,
              userName
            )
          }
        } catch (error) {
          console.error('Error sending SMS:', error)
          await logAction(
            `SMS error for Registration No: ${registrationNo}`,
            'Notification',
            'SMS_ERROR',
            null,
            { phone: registration.Phone, error: error.message },
            clientIP,
            userId,
            userName
          )
        }

        if (registration.Email != '' && registration.Email != null) {
          const to = registration.Email
          const subject = 'TN-BEAT EXPO Stall confirmation'
          const qrData = `https://eventreg.tahdco.com/#/idcard/${registration.RegitrationNo}`
          const qrCodeDataUri = await QRCode.toDataURL(qrData)
          const StallDateTime = formatDate(registration.CreatedDate)

          const htmlContent = `<p id="hi"> Dear ${registration.FirstName},</p>
            <p id='para'>Thanks, for your registration. The stall has been approved. The details are below:</p>
            <table>
            <tr><td>Registration Number</td><td>:<b>${registration.RegitrationNo}</b></td></tr>
            <tr><td>Registration Type.</td><td>:<b>${registration.RegitrationType}</b></td></tr>
            <tr><td>Registration Date and Time</td><td>:<b>${StallDateTime}</b></td></tr>
            <tr><td>Registration Status</td><td>:<b>Active</b></td></tr>
            </table>
            <br>
            <table>
            <tr><td>EXPO Dates</td><td>:<b>25<sup>th</sup> and 26<sup>th</sup> January, 2025</b></td></tr>
            <tr><td>EXPO Venue</td><td>:<b>Chennai Trade Centre – Nandambakkam, Chennai - 600089</b></td></tr>
            </table>
            <p>If you have any questions, Please reach out TN-BEAT EXPO management.</p><br>
            <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f3f4f6; margin: 0;">
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
                    ${registration.FirstName} ${registration.LastName}
                  </div>
                  <div style="font-family: 'Alice', serif; font-size: 30px; line-height: 40px; text-align: center; margin-top: 8px;">
                    ${registration.RegitrationNo}
                  </div>
                </div>
                <div style="background: linear-gradient(90deg, #040E56 0%, #006D5D 100%); color: white; font-family: 'Archivo Black', sans-serif; font-weight: 700; font-size: 20px; text-align: center; padding: 8px 0; margin-top: 16px;">
                  ${registration.RegitrationType}
                </div>
              </div>
            </div><br>
            <p>Thanks,</p>
            <p>TN-BEAT EXPO 2025 2<sup>nd</sup> Edition</p>
            <p>Contact: 94450 29534  |  91502 77736</p><br>
            <p>TAHDCO - Tamil Nadu Adi Dravidar Housing & Development Corporation Ltd</p>
            <p> #31, Cenotaph Road, Teynampet, Chennai - 600018</p>`

          try {
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST,
              port: process.env.SMTP_PORT,
              secure: process.env.SMTP_SECURE === 'true',
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            })

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
            })

            console.log('Email sent successfully:', emailInfo.messageId)
            await logAction(
              `Stall approval email sent - Registration No: ${registrationNo}`,
              'Notification',
              'EMAIL_SENT',
              null,
              { email: to, registrationNo },
              clientIP,
              userId,
              userName
            )
          } catch (error) {
            console.error('Error in Email :', error.message)
            await logAction(
              `Email error for Registration No: ${registrationNo}`,
              'Notification',
              'EMAIL_ERROR',
              null,
              { email: to, error: error.message },
              clientIP,
              userId,
              userName
            )
          }
        }
      }

      if (messageValue == 'Registration rejected and slot unbooked') {
        const DateTime = formatDate(new Date())
        const status = 'Rejected'
        const additionalDetails = 'Your application does not meet the eligibility criteria.'

        // Log rejection
        await logAction(
          `Registration rejected and slot unbooked - Registration No: ${registrationNo}`,
          'StallApproval',
          'REGISTRATION_REJECTED',
          existingBooking,
          { ...bookingData, reason: additionalDetails },
          clientIP,
          userId,
          userName
        )

        const messageText = `Your application ${registration.RegitrationNo} status is ${status}. ${additionalDetails}. -TAHDCO`

        console.log("messageText:", messageText)

        const smsApiUrl = `http://panel.smsmessenger.in/api/mt/SendSMS?user=tahdco&password=T@hdc0&senderid=TAHDCO&channel=Trans&DCS=0&flashsms=0&number=${registration.Phone}&text=${encodeURIComponent(messageText)}&route=6&peid=1107168267236448856&DLTTemplateId=1107168267231976704`

        try {
          const smsResponse = await fetch(smsApiUrl, { method: 'GET' })
          const smsResult = await smsResponse.json()

          if (smsResult.ErrorCode !== '0') {
            console.error('SMS sending failed:', smsResult.ErrorMessage)
            await logAction(
              `Rejection SMS failed for Registration No: ${registrationNo}`,
              'Notification',
              'SMS_FAILED',
              null,
              { phone: registration.Phone, error: smsResult.ErrorMessage },
              clientIP,
              userId,
              userName
            )
          } else {
            console.log('SMS sent successfully!')
            await logAction(
              `Rejection SMS sent - Registration No: ${registrationNo}`,
              'Notification',
              'SMS_SENT',
              null,
              { phone: registration.Phone, registrationNo },
              clientIP,
              userId,
              userName
            )
          }
        } catch (error) {
          console.error('Error sending SMS:', error)
          await logAction(
            `Rejection SMS error for Registration No: ${registrationNo}`,
            'Notification',
            'SMS_ERROR',
            null,
            { phone: registration.Phone, error: error.message },
            clientIP,
            userId,
            userName
          )
        }

        // Email logic for rejection (similar to approval, shortened for brevity)
        if (registration.Email != '' && registration.Email != null) {
          const to = registration.Email
          const subject = 'TN-BEAT EXPO Stall Cancelled'
          const qrData = `https://eventreg.tahdco.com/#/idcard/${registration.RegitrationNo}`
          const qrCodeDataUri = await QRCode.toDataURL(qrData)
          const StallDateTime = formatDate(registration.CreatedDate)

          const htmlContent = `<p id="hi"> Dear ${registration.FirstName},</p>
            <p id='para'>Thanks, for your registration. Unfortunately, the stall allocation has been cancelled. The details are below:</p>
            <table>
            <tr><td>Registration Number</td><td>:<b>${registration.RegitrationNo}</b></td></tr>
            <tr><td>Registration Type.</td><td>:<b>${registration.RegitrationType}</b></td></tr>
            <tr><td>Registration Date and Time</td><td>:<b>${StallDateTime}</b></td></tr>
            <tr><td>Registration Status</td><td>:<b>Cancelled</b></td></tr>
            </table><br>
            <p>If you have any questions, Please reach out TN-BEAT EXPO management.</p><br>
            <p>Thanks,</p>
            <p>TN-BEAT EXPO 2025 2<sup>nd</sup> Edition</p>
            <p>Contact: 94450 29534  |  91502 77736</p>`

          try {
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST,
              port: process.env.SMTP_PORT,
              secure: process.env.SMTP_SECURE === 'true',
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            })

            await transporter.sendMail({
              from: `"TN-BEAT EXPO" <${process.env.SMTP_USER}>`,
              to,
              subject,
              html: htmlContent,
              attachments: [
                { filename: 'qrcode.png', content: qrCodeDataUri.split(',')[1], encoding: 'base64', cid: 'qrcode' },
                { filename: 'logo.png', path: logoPath, cid: 'logo' }
              ],
            })

            await logAction(
              `Rejection email sent - Registration No: ${registrationNo}`,
              'Notification',
              'EMAIL_SENT',
              null,
              { email: to, registrationNo },
              clientIP,
              userId,
              userName
            )
          } catch (error) {
            console.error('Error in Email :', error.message)
            await logAction(
              `Rejection email error for Registration No: ${registrationNo}`,
              'Notification',
              'EMAIL_ERROR',
              null,
              { email: to, error: error.message },
              clientIP,
              userId,
              userName
            )
          }
        }
      }
    }

    // Log other operations based on messageValue
    const logMapping = {
      'Unapproved and Unbooked': { action: 'UNAPPROVE_UNBOOK', description: 'Registration unapproved and slot unbooked' },
      'Registration approved': { action: 'APPROVAL_SUCCESS', description: 'Registration approved' },
      'Slot already booked': { action: 'BOOKING_FAILED', description: 'Slot already booked' },
      'Already Booked': { action: 'BOOKING_FAILED', description: 'Registration already has a slot' },
      'Unbooking successful': { action: 'UNBOOKING_SUCCESS', description: 'Slot unbooked' },
      'Slot canceled': { action: 'SLOT_CANCELED', description: 'Slot canceled' },
      'Registration restored': { action: 'REGISTRATION_RESTORED', description: 'Registration restored' }
    }

    if (logMapping[messageValue]) {
      await logAction(
        `${logMapping[messageValue].description} - Registration No: ${registrationNo || 'N/A'}`,
        'StallApproval',
        logMapping[messageValue].action,
        existingBooking,
        bookingData,
        clientIP,
        userId,
        userName
      )
    }

    console.log(procedureResult)

    switch (messageValue) {
      case 'Unapproved and Unbooked':
        return new Response(JSON.stringify({ status: true, message: 'Registration unapproved and associated slot unbooked successfully.' }), { status: 200 })
      case 'Registration approved':
        return new Response(JSON.stringify({ status: true, message: 'Registration approved successfully.' }), { status: 200 })
      case 'Booking successful':
        return new Response(JSON.stringify({ status: true, message: 'Slot booked successfully.' }), { status: 200 })
      case 'Slot already booked':
        return new Response(JSON.stringify({ status: false, message: 'Slot booking failed. The selected slot is already booked.' }), { status: 400 })
      case 'Already Booked':
        return new Response(JSON.stringify({ status: false, message: 'Slot booking failed. The registration ID is already associated with another slot.' }), { status: 400 })
      case 'Unbooking successful':
        return new Response(JSON.stringify({ status: true, message: 'Slot unbooked successfully.' }), { status: 200 })
      case 'Slot Not Booked':
        return new Response(JSON.stringify({ status: false, message: 'Slot unbooking failed. The slot was not booked.' }), { status: 400 })
      case 'Not Approved':
        return new Response(JSON.stringify({ status: false, message: 'The registration is not approved.' }), { status: 400 })
      case 'Booking Not Allowed':
        return new Response(JSON.stringify({ status: false, message: 'Booking is not allowed for the registration.' }), { status: 400 })
      case 'Already Approved':
        return new Response(JSON.stringify({ status: false, message: 'The registration is already approved.' }), { status: 400 })
      case 'Slot Is Not Available':
        return new Response(JSON.stringify({ status: false, message: 'The selected slot is not available for booking.' }), { status: 400 })
      case 'Approval Pending':
        return new Response(JSON.stringify({ status: false, message: 'The registration approval is pending.' }), { status: 400 })
      case 'Slot canceled':
        return new Response(JSON.stringify({ status: true, message: 'Slot canceled successfully.' }), { status: 200 })
      case 'Registration rejected and slot unbooked':
        return new Response(JSON.stringify({ status: true, message: 'Rejected successfully.' }), { status: 200 })
      case 'Registration restored':
        return new Response(JSON.stringify({ status: true, message: 'Restored successfully.' }), { status: 200 })
      default:
        return new Response(JSON.stringify({ status: false, message: messageValue }), { status: 500 })
    }
  } catch (err) {
    console.error('Error in POST API:', err.message)

    await logAction(
      `Stall approval error - Registration No: ${registrationNo || 'Unknown'} - ${err.message}`,
      'StallApproval',
      'ERROR',
      existingBooking,
      { error: err.message, stack: err.stack },
      clientIP,
      userId,
      userName
    )

    return new Response(
      JSON.stringify({ status: false, message: err.message || 'Internal Server Error' }),
      { status: err.status || 500 }
    )
  }
}

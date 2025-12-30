// src/app/api/apps/saveUpdate/route.js
import path from 'path';

import { NextResponse } from 'next/server';

import { format } from 'date-fns';
import nodemailer from 'nodemailer'; // Use nodemailer for sending emails
import { v4 as uuidv4 } from 'uuid';

import QRCode from 'qrcode';

import db from '../db'; // Adjust the path based on your project structure

const publicFolder = path.join(process.cwd(), 'public', 'uploads'); // Adjust the path if needed

// const logoPath = path.join(process.cwd(), 'public', 'images', 'logos', 'logo.png');

// const logoPath = path.join(__dirname, '..', 'public', 'images', 'logos', 'logo.png');
const logoPath = path.join(__dirname, '..','..','..','..','..', '..', 'public', 'images', 'logos', 'logo.png');

// Handle CORS preflight for OPTIONS method
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*', // Allow any origin, adjust for production security
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}

export async function POST(req) {
  try {
    const input = await req.json()
    const dataArray = Array.isArray(input) ? input : [input]

    if (dataArray.length === 0) {
      return NextResponse.json({ status: false, message: 'Data is required' }, { status: 400 })
    }

    const resultsArray = []
    let insertedCount = 0
    let uninsertedCount = 0
    const now = new Date()
    const formattedDate = format(now, 'yyyy-MM-dd HH:mm:ss')

    const mandatoryFields = ['RegistrationType', 'FirstName', 'Phone', 'Email'];
    const validRegistrationTypes = ['VISITOR', 'SEMINAR_ATTENDEE', 'EXHIBITORS', 'OTHERS']

    for (const dataObject of dataArray) {
      const missingFields = mandatoryFields.filter(field => !dataObject[field]);

      if (missingFields.length > 0) {
        uninsertedCount++;
        resultsArray.push({
          status: false,
          message: `Missing mandatory fields: ${missingFields.join(', ')}`,
          dataObject,
        });
        continue;
      }

       // Validate RegistrationType
       if (!validRegistrationTypes.includes(dataObject.RegistrationType)) {
        uninsertedCount++;
        resultsArray.push({
          status: false,
          message: `Invalid RegistrationType: ${dataObject.RegistrationType}`,
          dataObject,
        });
        continue;
      }

      // Validate Age is a number
      if (isNaN(dataObject.Age)) {
        uninsertedCount++;
        resultsArray.push({
          status: false,
          message: `Age must be a number.`,
          dataObject,
        });
        continue;
      }

      // Validate Phone Number format
      const phoneRegex = /^[0-9]{10}$/ // Example regex for 10-digit phone number

      if (!phoneRegex.test(dataObject.Phone)) {
        uninsertedCount++;
        resultsArray.push({
          status: false,
          message: `Invalid Phone Number format.`,
          dataObject,
        });
         continue;
      }

      // Validate Email format
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

      if (!emailRegex.test(dataObject.Email)) {
        uninsertedCount++;
        resultsArray.push({
          status: false,
          message: `Invalid Email format.`,
          dataObject,
        });
         continue;
      }


      // const phoneExistsQuery = `SELECT COUNT(*) AS phoneCount FROM registrationmaster WHERE Phone = ?`; // Replace with your actual table
      // // const genderValidationQuery = `SELECT COUNT(*) AS genderCount FROM GenderTable WHERE Id = ? OR DropDownValue = ? AND DropDownType = 'Gender'`; // Replace with your actual gender table query
      // const [phoneResult] = await db.execute(phoneExistsQuery, [dataObject.Phone]);

      // if (phoneResult[0].phoneCount > 0) {
      //   uninsertedCount++;
      //   resultsArray.push({
      //     status: false,
      //     message: `Phone number ${dataObject.Phone} already exists.`,
      //     dataObject,
      //   });
      //   continue;
      // }

      // // Validate Gender ID or Name
      // const [genderResult] = await db.execute(genderValidationQuery, [dataObject.Gender, dataObject.Gender]);

      // if (genderResult[0].genderCount === 0) {
      //   uninsertedCount++;
      //   resultsArray.push({
      //     status: false,
      //     message: `Invalid Gender provided. Valid options are Gender Id or Name.`,
      //     dataObject,
      //   });
      //   continue;
      // }

      const generatedId = dataObject.Id || uuidv4()
      const finalSavedBy = dataObject.SavedBy || generatedId
      const RegistrationType = dataObject.RegistrationType

      const sql = `
      CALL Settings_SP_Registration_SaveUpdate(
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?
      )`;


    const params = [
      generatedId,
      dataObject.RegistrationType ?? '',
      dataObject.RegitrationNoPrefix ?? '',
      dataObject.RegistrationNo ?? '',
      dataObject.RegitrationRunningNo ?? '',
      dataObject.FirstName ?? '',
      dataObject.LastName ?? '',
      dataObject.Gender ?? '',
      dataObject.Age ?? 0,
      dataObject.Community ?? '',
      dataObject.Phone ?? '',
      dataObject.Email ?? '',
      dataObject.District ?? '',
      dataObject.State ?? '',
      dataObject.ReferenceBy ?? '',
      dataObject.VisitorCategory ?? '',
      dataObject.PurposeOfVisit ?? '',
      dataObject.IntrestedSector ?? '',
      dataObject.PurposeOfParticipation ?? '',
      dataObject.CompanyName ?? '',
      dataObject.BusinessCategory ?? '',
      dataObject.BusinessType ?? '',
      dataObject.BusinessTrade ?? '',
      dataObject.YearEstablished ?? 0,
      dataObject.BusinessTurnOver ?? 0,
      dataObject.UdyogRegistrationId ?? '',
      dataObject.GSTNumber ?? '',
      dataObject.DescriptionOfProducts ?? '',
      dataObject.Seminars ?? '',
      dataObject.IsMoreStallsReq ?? '' ,
      dataObject.OthersCategory ?? '',
      finalSavedBy,
      dataObject.ReferenceByOthers ?? '',
      dataObject.NatureOfActivities ?? '',
      dataObject.productImage ?? '',
      dataObject.StallSize ?? '',
      dataObject.StallLength ?? '',
      dataObject.Stallbreadth ?? '',
      dataObject.AlreadyAttended ?? 0,
      dataObject.PreviousYearStallImage ?? '',
      dataObject.sltSession ?? '',
      dataObject.StallType ?? '',
      dataObject.PanNo ?? '',
      dataObject.Items ?? '',
      dataObject.ExhType ?? '',
      formattedDate,
      `${dataObject.FirstName} ${dataObject.LastName}` ?? '',
    ];


      try {
        const formatDate = (date) => {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
          const year = date.getFullYear();
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');

          return `${day}-${month}-${year} ${hours}:${minutes}`;
      };

        const results = await db.execute(sql, params)
        const status = results?.[0]?.[0]?.RegitrationNo !== ''

        // Check if the message contains "RegitrationNo": "" and modify the response
        const message = results[0][0]
        let finalMessage

        if (message && Array.isArray(message) && message[0]?.RegitrationNo === '') {
          finalMessage = `${dataObject.RegistrationNo}` + ' Updated successfully'
        } else {
          finalMessage = `${message[0].RegitrationNo}`
        }

        let messageFinal = '';

        if (status) {
          let RegId = ''

          // Prepare and send the SMS
          const phoneNumber = dataObject.Phone
          const { RegitrationNo } = results[0][0][0]

          // const messageFinal = results[0][0];
          //  console.log("--------------------");

          // if (results[0] && results[0][0] && results[0][0][0]) {
          const dataObjects = results[0][0][0] // Adjust based on your structure

          console.log('Extracted Data:', dataObjects.RegitrationNo)

          messageFinal = dataObjects.RegitrationNo

          // const formattedType = RegistrationType.charAt(0).toUpperCase() + RegistrationType.slice(1).toLowerCase();

          const cleanedType = RegistrationType.replace(/[^a-zA-Z0-9_ ]/g, '').replace(/_/g, ' ')
          const formattedType = cleanedType.charAt(0).toUpperCase() + cleanedType.slice(1).toLowerCase()

          const RefNo = `${formattedType} Registration ${messageFinal}`
          const DateTime = formatDate(new Date()) // Formats the current date and time

          // Construct message text to match the approved template
          const messageText = `Hi ${dataObject.FirstName}, you've completed the ${RefNo} successfully on ${DateTime} -TAHDCO`

          console.log('messageText:', messageText)

          // const smsApiUrl = `http://panel.smsmessenger.in/api/mt/SendSMS?user=tahdco&password=T@hdc0&senderid=TAHDCO&channel=Trans&DCS=0&flashsms=0&number=${phoneNumber}&text=${encodeURIComponent(messageText)}&route=6&peid=1101634270000046830&DLTTemplateId=1107172778136171249`

          // console.log('smsApiUrl:', smsApiUrl)

          // // Send SMS via API
          // try {
          //   const smsResponse = await fetch(smsApiUrl, { method: 'GET' })
          //   const smsResult = await smsResponse.json()

          //   if (smsResult.ErrorCode !== '0') {
          //     console.error('SMS sending failed:', smsResult.ErrorMessage)
          //   } else {
          //     console.log('SMS sent successfully!')
          //   }
          // } catch (error) {
          //   console.error('Error sending SMS:', error)
          // }

          if (dataObject.Email != '') {
            const to = dataObject.Email
            const subject = 'TN-BEAT EXPO Registration confirmation'
            const qrData = `https://eventreg.tahdco.com/#/idcard/${messageFinal}`

            // const qrCodeDataUri = await QRCode.toDataURL(qrData) // Generate QR code as a Data URI
            let htmlContent = ''

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
                        <!-- Registration Form Container -->
                        <div style="background-color: white; border-radius: 12px; box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1); width: 90%; max-width: 477px; margin-bottom: 16px;">
                          <!-- Image Section -->
                          <div style="text-align: center; margin-bottom: 24px;">
                            <img src="cid:logo" alt="Form Illustration" style="max-width: 100%; height: auto; max-width: 377px;" />
                          </div>

                          <!-- Header Section -->
                          <div style="background: linear-gradient(90deg, #040E56 0%, #006D5D 100%); color: white; font-size: 20px; font-weight: bold; text-align: center; padding: 16px 0 59px; line-height: 1.55rem; margin-bottom: 24px;">
                            Tamilnadu Adi Dravidar Housing & Development Corporation
                          </div>

                         <!-- QR Code Section -->
                            <div style="text-align: center; margin-top: -30px;"> <!-- Adjusted margin for QR Code -->
                                <!-- QR Code -->
                                <div style="width: 200px; height: 200px; border-radius: 10px; border: 15px solid white; background-image: url('cid:qrcode'); background-repeat: no-repeat; background-size: cover; background-position: center; margin: 0 auto;"></div>

                                <!-- Name -->
                                <div style="font-weight: 700; font-size: 36px; text-align: center; margin-top: 24px; color: #000;">
                                    ${dataObject.FirstName} ${dataObject.LastName}
                                </div>

                                <!-- Registration ID -->
                                <div style="font-family: 'Alice', serif; font-size: 30px; line-height: 40px; text-align: center; margin-top: 8px;">
                                    ${messageFinal}
                                </div>
                            </div>

                          <!-- Footer Section -->
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
                            <p> #31, Cenotaph Road, Teynampet, Chennai - 600018</p>
                          `

              // try {
              //   // Set up Nodemailer transporter
              //   const transporter = nodemailer.createTransport({
              //     host: process.env.SMTP_HOST, // Your SMTP host
              //     port: process.env.SMTP_PORT, // SMTP port (e.g., 587)
              //     secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
              //     auth: {
              //       user: process.env.SMTP_USER, // Your email address
              //       pass: process.env.SMTP_PASS // Your email password
              //     }
              //   })

              //   // Send email
              //   const emailInfo = await transporter.sendMail({
              //     from: `"TN-BEAT EXPO" <${process.env.SMTP_USER}>`, // Sender address
              //     to, // Receiver address
              //     subject, // Subject line
              //     html: htmlContent,
              //     attachments: [
              //       {
              //         filename: 'qrcode.png',
              //         content: qrCodeDataUri.split(',')[1], // Extract base64 part of QR code
              //         encoding: 'base64',
              //         cid: 'qrcode' // Content ID for inline attachment
              //       },

              //       {
              //         filename: 'logo.png',
              //         path: logoPath, // Direct path to the logo image in the public folder
              //         cid: 'logo' // Content ID for inline attachment
              //       }
              //     ]
              //   })

              //   console.log('Email sent successfully:', emailInfo.messageId)
              // } catch (error) {
              //   console.error('Error in Email :', error.message)
              // }
            } else {
              htmlContent = `
                     <p id="hi"> Dear ${dataObject.FirstName} ,</p>
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
                        <!-- Registration Form Container -->
                        <div style="background-color: white; border-radius: 12px; box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1); width: 90%; max-width: 477px; margin-bottom: 16px;">
                          <!-- Image Section -->
                          <div style="text-align: center; margin-bottom: 24px;">
                            <img src="cid:logo" alt="Form Illustration" style="max-width: 100%; height: auto; max-width: 377px;" />
                          </div>

                          <!-- Header Section -->
                          <div style="background: linear-gradient(90deg, #040E56 0%, #006D5D 100%); color: white; font-size: 20px; font-weight: bold; text-align: center; padding: 16px 0 59px; line-height: 1.55rem; margin-bottom: 24px;">
                            Tamilnadu Adi Dravidar Housing & Development Corporation
                          </div>

                         <!-- QR Code Section -->
                            <div style="text-align: center; margin-top: -30px;"> <!-- Adjusted margin for QR Code -->
                                <!-- QR Code -->
                                <div style="width: 200px; height: 200px; border-radius: 10px; border: 15px solid white; background-image: url('cid:qrcode'); background-repeat: no-repeat; background-size: cover; background-position: center; margin: 0 auto;"></div>

                                <!-- Name -->
                                <div style="font-weight: 700; font-size: 36px; text-align: center; margin-top: 24px; color: #000;">
                                    ${dataObject.FirstName} ${dataObject.LastName}
                                </div>

                                <!-- Registration ID -->
                                <div style="font-family: 'Alice', serif; font-size: 30px; line-height: 40px; text-align: center; margin-top: 8px;">
                                    ${messageFinal}
                                </div>
                            </div>

                          <!-- Footer Section -->
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
                            <p> #31, Cenotaph Road, Teynampet, Chennai - 600018</p>
                          `

              // try {
              //   // Set up Nodemailer transporter
              //   const transporter = nodemailer.createTransport({
              //     host: process.env.SMTP_HOST, // Your SMTP host
              //     port: process.env.SMTP_PORT, // SMTP port (e.g., 587)
              //     secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
              //     auth: {
              //       user: process.env.SMTP_USER, // Your email address
              //       pass: process.env.SMTP_PASS // Your email password
              //     }
              //   })

              //   // Send email
              //   const emailInfo = await transporter.sendMail({
              //     from: `"TN-BEAT EXPO" <${process.env.SMTP_USER}>`, // Sender address
              //     to, // Receiver address
              //     subject, // Subject line
              //     html: htmlContent,
              //     attachments: [
              //       {
              //         filename: 'qrcode.png',
              //         content: qrCodeDataUri.split(',')[1], // Extract base64 part of QR code
              //         encoding: 'base64',
              //         cid: 'qrcode' // Content ID for inline attachment
              //       },

              //       {
              //         filename: 'logo.png',
              //         path: logoPath, // Direct path to the logo image in the public folder
              //         cid: 'logo' // Content ID for inline attachment
              //       }
              //     ]
              //   })

              //   console.log('Email sent successfully:', emailInfo.messageId)
              // } catch (error) {
              //   console.error('Error in Email :', error.message)
              // }
            }
          }

          insertedCount++
          resultsArray.push({
            status: true,
            message: finalMessage
          })
        } else {
          uninsertedCount++
          resultsArray.push({
            status: false,
            message: 'Failed to save record',
            dataObject
          })
        }
      } catch (error) {
        uninsertedCount++
        resultsArray.push({
          status: false,
          message: error.message,
          dataObject
        })
      }
    }

    const hasFailedRecords = uninsertedCount > 0
    const commonMessage = `Total Saved: ${insertedCount}, Total Failed: ${uninsertedCount}`

    return NextResponse.json(
      {
        status: !hasFailedRecords,
        message: commonMessage,
        results: resultsArray
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*', // Allow any origin, adjust for production security
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    )
  } catch (error) {
    console.error('Error occurred:', error)

    return NextResponse.json(
      { status: false, message: 'Internal server error', error: error.message || error },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*', // Allow any origin, adjust for production security
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    )
  }
}

import path from 'path';

import jwt from 'jsonwebtoken'; // For token validation
import nodemailer from 'nodemailer';

import QRCode from 'qrcode';

import db from '../db'; // Ensure correct database connection file

const SECRET_KEY = process.env.SECRET_KEY; // Use your secret key
const logoPath = path.resolve('public/images/logos/logo.png'); // Correctly resolve the logo path

export async function POST(req) {
  try {
    const sql = `
      SELECT FirstName, LastName, RegitrationNo, RegitrationType, CreatedDate, Email
      FROM registrationmaster
      WHERE IsActive = '1'
    `;

    const [rows] = await db.query(sql);

    const subject = "TN BEAT 2025 - ID Card";
    const body = await req.json();
    const { to } = body;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const recipients = to
      ? to.split(',').map(email => email.trim())
      : rows.map(dataObject => dataObject.Email).filter(Boolean);

    if (!recipients.length) {
      return new Response(
        JSON.stringify({ status: false, message: 'No valid email recipients found.' }),
        { status: 400 }
      );
    }

    const sentEmails = []; // List to track successfully sent emails
    const failedEmails = []; // List to track failed email attempts

    const emailPromises = recipients.map(async (recipientEmail) => {
      const dataObject = rows.find(row => row.Email === recipientEmail);

      if (!dataObject) {
        console.warn(`No data found for recipient: ${recipientEmail}`);
        failedEmails.push({ recipientEmail, reason: 'No data found' });

        return null;
      }

      // Generate QR code
      const qrData = `https://eventreg.tahdco.com/#/idcard/${dataObject.RegitrationNo}`;
      const qrCodeDataUri = await QRCode.toDataURL(qrData);

           const htmlContent = `
      <p id="hi"> Dear ${dataObject.FirstName},</p>
      <p id='para'>Here are the details of your registration:</p>
      <table>
        <tr>
          <td>Registration Number</td>
          <td>:<b>${dataObject.RegitrationNo}</b></td>
        </tr>
        <tr>
          <td>Registration Type</td>
          <td>:<b>${dataObject.RegitrationType}</b></td>
        </tr>
        <tr>
          <td>Registration Date and Time</td>
          <td>:<b>${dataObject.CreatedDate}</b></td>
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
      <p>If you have any questions, Please reach out TN-BEAT EXPO management.</p>
      <br>
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
              ${dataObject.RegitrationNo}
            </div>
          </div>
          <div style="background: linear-gradient(90deg, #040E56 0%, #006D5D 100%); color: white; font-family: 'Archivo Black', sans-serif; font-weight: 700; font-size: 20px; text-align: center; padding: 8px 0; margin-top: 16px;">
            ${dataObject.RegitrationType}
          </div>
        </div>
      </div>
      <br>
      <p>Thanks,</p>
      <p>TN-BEAT EXPO 2025 2<sup>nd</sup> Edition</p>
      <p>Contact: 94450 29534  |  91502 77736</p>
      <br>
      <p>TAHDCO - Tamil Nadu Adi Dravidar Housing & Development Corporation Ltd</p>
      <p>#31, Cenotaph Road, Teynampet, Chennai - 600018</p>
      `;

      try {
        // Send email
        await transporter.sendMail({
          from: `"TN-BEAT EXPO" <${process.env.SMTP_USER}>`,
          to: recipientEmail,
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
            },
          ],
        });

        sentEmails.push(recipientEmail); // Add to sent emails

        return { success: true, recipientEmail };
      } catch (error) {
        console.error(`Failed to send email to ${recipientEmail}:`, error);
        failedEmails.push({ recipientEmail, reason: error.message });

        return { success: false, recipientEmail, error };
      }
    });

    // Wait for email sending promises
    await Promise.allSettled(emailPromises);

    return new Response(
      JSON.stringify({
        status: true,
        message: `Emails sent: ${sentEmails.length}, Failed: ${failedEmails.length}`,
        sentEmails, // Include sent emails
        failedEmails, // Include failed emails
      }),
      { status: 200 }
    );

  } catch (err) {
    console.error('Error in email sending:', err.message);

    return new Response(
      JSON.stringify({ status: false, message: err.message || 'Internal Server Error' }),
      { status: 500 }
    );
  }
}

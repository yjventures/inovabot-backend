let nodemailer = require('nodemailer');
require("dotenv").config();

// ^ Function to send email service
const SendEmailUtils = async (EmailTo, EmailText, EmailSubject, attachments)=>{
    try {
        let transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: 465,
            secure: true,
             logger: true,
             debug: true,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
            tls: {
                rejectUnauthorized: true
            }
        });
    
    
        let mailOptions = {
            from: `Team ${process.env.NAME} <${process.env.SMTP_EMAIL}>`,
            to: EmailTo,
            subject: EmailSubject,
            text: EmailText,
        };

        if (attachments) {
            mailOptions.attachments = attachments;
        }
    
        return await transporter.sendMail(mailOptions);
    } catch (err) {
        throw new Error({ message: 'Email could not be sent' });
    }
}

module.exports = {
    SendEmailUtils
};
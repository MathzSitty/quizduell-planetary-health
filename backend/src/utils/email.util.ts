import nodemailer from 'nodemailer';
import config from '../config';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    // Ethereal Email für Tests verwenden (entwickelt von Nodemailer-Team)
    console.log('Verwende Ethereal für E-Mail-Tests...');
    
    // Erstelle ein Test-Konto bei Ethereal (wird automatisch erstellt)
    const testAccount = await nodemailer.createTestAccount();
    console.log('Ethereal Test-Konto erstellt:', testAccount.user);
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    // Definiere Mail-Optionen
    const mailOptions = {
      from: `Planetary Health Quiz <${config.emailFrom}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    console.log(`Sende E-Mail an: ${options.to}`);

    // Sende die E-Mail
    const info = await transporter.sendMail(mailOptions);
    console.log(`E-Mail erfolgreich gesendet: ${info.messageId}`);
    
    // Zeige URL an, wo die E-Mail angesehen werden kann
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`Ethereal E-Mail-Vorschau: ${previewUrl}`);
    
    // Reset-Link für einfachen Zugriff während der Entwicklung extrahieren
    console.log('------------------');
    console.log('RESET LINK FÜR ENTWICKLUNGSTESTS:');
    const resetLinkMatch = options.html.match(/href="(http:\/\/localhost:[0-9]+\/reset-password\/[^"]+)"/);
    if (resetLinkMatch && resetLinkMatch[1]) {
      console.log(resetLinkMatch[1]);
    }
    console.log('------------------');
    
    return info;
  } catch (error) {
    console.error('Fehler beim Senden der E-Mail:', error);
    throw error;
  }
};
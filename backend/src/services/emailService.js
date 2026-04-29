const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendVerificationEmail = async (email, username, verificationToken) => {
  const verificationUrl = `http://localhost:3000/api/auth/verify/${verificationToken}`;
  
  const mailOptions = {
    from: `"Matcha" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Bienvenue sur Matcha - Vérifie ton compte',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e91e63;">Bienvenue sur Matcha, ${username} !</h1>
        <p>Merci de t'être inscrit. Pour commencer à utiliser l'application, veuillez vérifier ton adresse email.</p>
        <a href="${verificationUrl}" style="display: inline-block; background-color: #e91e63; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Vérifier mon compte</a>
        <p>Ou copie ce lien dans ton navigateur :</p>
        <p style="background-color: #f5f5f5; padding: 10px; word-break: break-all;">${verificationUrl}</p>
        <p>Ce lien expirera dans 24 heures.</p>
        <hr style="margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">L'équipe Matcha</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email de vérification envoyé à ${email}`);
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw error;
  }
};

module.exports = { sendVerificationEmail };
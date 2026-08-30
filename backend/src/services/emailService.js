const nodemailer = require('nodemailer');

// Variable globale pour stocker le faux transporteur Ethereal sans le recréer à chaque fois
let devTransporter = null;

// Fonction pour récupérer le transporteur (Ethereal par défaut en dev)
const getTransporter = async () => {
  // Si tu as configuré un VRAI compte email dans le .env, il l'utilise
  if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'ton_email@gmail.com') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Sinon, création d'un compte de test Ethereal transparent (la meilleure méthode)
  if (!devTransporter) {
    const testAccount = await nodemailer.createTestAccount();
    devTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
  return devTransporter;
};

const sendVerificationEmail = async (email, username, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;
  
  const mailOptions = {
    from: '"Matcha" <no-reply@matcha.com>',
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
    const transporter = await getTransporter();
    const info = await transporter.sendMail(mailOptions);
    
    console.log("\n=========================================");
    console.log(`💌 EMAIL DE VÉRIFICATION ENVOYÉ À : ${email}`);
    
    // Récupérer le lien magique Ethereal
    const testUrl = nodemailer.getTestMessageUrl(info);
    if (testUrl) {
      console.log(`🔗 CLIQUEZ ICI POUR VOIR L'EMAIL : ${testUrl}`);
    } else {
      console.log(`👉 LIEN DIRECT DE VALIDATION : ${verificationUrl}`);
    }
    console.log("=========================================\n");

  } catch (error) {
    console.error("Erreur d'envoi d'email :", error);
  }
};

const sendPasswordResetEmail = async (email, username, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: '"Matcha" <no-reply@matcha.com>',
    to: email,
    subject: 'Réinitialisation de ton mot de passe Matcha',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e91e63;">Bonjour ${username},</h1>
        <p>Tu as demandé à réinitialiser ton mot de passe.</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #e91e63; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Réinitialiser mon mot de passe</a>
        <p>Ce lien est valide pendant 1 heure.</p>
        <p>Si tu n'as pas fait cette demande, ignore simplement cet email.</p>
      </div>
    `,
  };

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail(mailOptions);
    
    console.log("\n=========================================");
    console.log(`🔐 EMAIL DE RESET ENVOYÉ À : ${email}`);
    
    const testUrl = nodemailer.getTestMessageUrl(info);
    if (testUrl) {
      console.log(`🔗 CLIQUEZ ICI POUR VOIR L'EMAIL : ${testUrl}`);
    } else {
      console.log(`👉 LIEN DIRECT DE RESET : ${resetUrl}`);
    }
    console.log("=========================================\n");

  } catch (error) {
    console.error("Erreur d'envoi d'email :", error);
  }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
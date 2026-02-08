import nodemailer from 'nodemailer'
import { getBaseUrl } from './utils'

// Configuration du transporteur d'e-mail
const createTransporter = () => {
  // Configuration depuis les variables d'environnement
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true pour 465, false pour autres ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  }

  // Si pas de configuration SMTP, utiliser un transporteur de test (pour le développement)
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️  SMTP non configuré, utilisation d\'un transporteur de test')
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'test@ethereal.email',
        pass: 'test',
      },
    })
  }

  return nodemailer.createTransport(smtpConfig)
}

/**
 * Envoie un e-mail de vérification avec un code à 6 chiffres
 */
export async function sendVerificationEmail(
  email: string,
  code: string,
  username?: string
): Promise<void> {
  const transporter = createTransporter()

  const mailOptions = {
    from: `"Catalogue Véhicule A4L" <${process.env.SMTP_USER || 'noreply@a4l.com'}>`,
    to: email,
    subject: 'Vérification de votre compte - Catalogue Véhicule A4L',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
              border-radius: 10px;
              padding: 30px;
              color: #fff;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              width: 60px;
              height: 60px;
              border-radius: 12px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .code-box {
              background: rgba(16, 185, 129, 0.1);
              border: 2px solid #10b981;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 30px 0;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #10b981;
              font-family: 'Courier New', monospace;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
              text-align: center;
              font-size: 12px;
              color: #888;
            }
            .warning {
              background: rgba(239, 68, 68, 0.1);
              border-left: 4px solid #ef4444;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">A4L</div>
              <h1 style="margin: 0; color: #fff;">Vérification de votre compte</h1>
            </div>
            
            <p>Bonjour${username ? ` ${username}` : ''},</p>
            
            <p>Merci de vous être inscrit sur <strong>Catalogue Véhicule A4L</strong> !</p>
            
            <p style="color: #888; font-size: 14px; margin-top: 10px;">
              <em>Note : Ce site est un catalogue non-officiel créé par des joueurs du serveur Arma For Life. 
              Nous ne sommes pas affiliés au serveur officiel Arma For Life.</em>
            </p>
            
            <p>Pour activer votre compte, veuillez entrer le code de vérification suivant :</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important :</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Ce code est valide pendant <strong>10 minutes</strong> uniquement</li>
                <li>Ne partagez jamais ce code avec personne</li>
                <li>Si vous n'avez pas créé de compte, ignorez cet e-mail</li>
              </ul>
            </div>
            
            <p>Si vous n'avez pas demandé ce code, vous pouvez ignorer cet e-mail en toute sécurité.</p>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Catalogue Véhicule A4L - Site non-officiel créé par des joueurs</p>
              <p style="font-size: 11px; color: #666; margin-top: 5px;">
                Ce site n'est pas affilié au serveur officiel Arma For Life.
              </p>
              <p>Cet e-mail a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Bonjour${username ? ` ${username}` : ''},

Merci de vous être inscrit sur Catalogue Véhicule A4L !

Note : Ce site est un catalogue non-officiel créé par des joueurs du serveur Arma For Life. 
Nous ne sommes pas affiliés au serveur officiel Arma For Life.

Pour activer votre compte, veuillez entrer le code de vérification suivant :

${code}

Ce code est valide pendant 10 minutes uniquement.

Si vous n'avez pas créé de compte, ignorez cet e-mail.

© ${new Date().getFullYear()} Catalogue Véhicule A4L - Site non-officiel créé par des joueurs
Ce site n'est pas affilié au serveur officiel Arma For Life.
    `.trim(),
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ E-mail de vérification envoyé:', info.messageId)
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'e-mail:', error)
    throw new Error('Impossible d\'envoyer l\'e-mail de vérification')
  }
}

/**
 * Envoie un e-mail de confirmation de changement d'e-mail
 */
export async function sendEmailChangeConfirmation(
  oldEmail: string,
  newEmail: string,
  username?: string
): Promise<void> {
  const transporter = createTransporter()

  const mailOptions = {
    from: `"Catalogue Véhicule A4L" <${process.env.SMTP_USER || 'noreply@a4l.com'}>`,
    to: oldEmail,
    subject: 'Confirmation de changement d\'e-mail - Catalogue Véhicule A4L',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
              border-radius: 10px;
              padding: 30px;
              color: #fff;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              width: 60px;
              height: 60px;
              border-radius: 12px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .info-box {
              background: rgba(59, 130, 246, 0.1);
              border: 2px solid #3b82f6;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
              text-align: center;
              font-size: 12px;
              color: #888;
            }
            .warning {
              background: rgba(239, 68, 68, 0.1);
              border-left: 4px solid #ef4444;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">A4L</div>
              <h1 style="margin: 0; color: #fff;">Changement d'e-mail confirmé</h1>
            </div>
            
            <p>Bonjour${username ? ` ${username}` : ''},</p>
            
            <p>Votre adresse e-mail a été modifiée avec succès.</p>
            
            <div class="info-box">
              <p style="margin: 0;"><strong>Ancien e-mail :</strong> ${oldEmail}</p>
              <p style="margin: 10px 0 0 0;"><strong>Nouveau e-mail :</strong> ${newEmail}</p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important :</strong>
              <p style="margin: 10px 0 0 0;">
                Si vous n'avez pas demandé ce changement, veuillez nous contacter immédiatement.
                Votre compte pourrait avoir été compromis.
              </p>
            </div>
            
            <p>Cet e-mail a été envoyé à votre ancienne adresse e-mail pour votre information.</p>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Catalogue Véhicule A4L - Site non-officiel créé par des joueurs</p>
              <p style="font-size: 11px; color: #666; margin-top: 5px;">
                Ce site n'est pas affilié au serveur officiel Arma For Life.
              </p>
              <p>Cet e-mail a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Bonjour${username ? ` ${username}` : ''},

Votre adresse e-mail a été modifiée avec succès.

Ancien e-mail : ${oldEmail}
Nouveau e-mail : ${newEmail}

⚠️ Important : Si vous n'avez pas demandé ce changement, veuillez nous contacter immédiatement.

Cet e-mail a été envoyé à votre ancienne adresse e-mail pour votre information.

© ${new Date().getFullYear()} Catalogue Véhicule A4L - Site non-officiel créé par des joueurs
Ce site n'est pas affilié au serveur officiel Arma For Life.
    `.trim(),
  }

  try {
    await transporter.sendMail(mailOptions)
    
    // Envoyer aussi un e-mail au nouvel e-mail
    const newEmailOptions = {
      ...mailOptions,
      to: newEmail,
      subject: 'Nouvelle adresse e-mail enregistrée - Catalogue Véhicule A4L',
      html: mailOptions.html.replace(
        'Cet e-mail a été envoyé à votre ancienne adresse e-mail pour votre information.',
        'Bienvenue sur votre nouvelle adresse e-mail ! Vous recevrez désormais tous les e-mails de Catalogue Véhicule A4L à cette adresse.'
      ),
      text: mailOptions.text.replace(
        'Cet e-mail a été envoyé à votre ancienne adresse e-mail pour votre information.',
        'Bienvenue sur votre nouvelle adresse e-mail ! Vous recevrez désormais tous les e-mails de Catalogue Véhicule A4L à cette adresse.'
      ),
    }
    
    await transporter.sendMail(newEmailOptions)
    console.log('✅ E-mails de changement d\'e-mail envoyés')
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'e-mail:', error)
    throw new Error('Impossible d\'envoyer l\'e-mail de confirmation')
  }
}

/**
 * Envoie un e-mail de confirmation de changement de mot de passe
 */
export async function sendPasswordChangeConfirmation(
  email: string,
  username?: string
): Promise<void> {
  const transporter = createTransporter()

  const mailOptions = {
    from: `"Catalogue Véhicule A4L" <${process.env.SMTP_USER || 'noreply@a4l.com'}>`,
    to: email,
    subject: 'Confirmation de changement de mot de passe - Catalogue Véhicule A4L',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
              border-radius: 10px;
              padding: 30px;
              color: #fff;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              width: 60px;
              height: 60px;
              border-radius: 12px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .success-box {
              background: rgba(16, 185, 129, 0.1);
              border: 2px solid #10b981;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
              text-align: center;
              font-size: 12px;
              color: #888;
            }
            .warning {
              background: rgba(239, 68, 68, 0.1);
              border-left: 4px solid #ef4444;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">A4L</div>
              <h1 style="margin: 0; color: #fff;">Mot de passe modifié</h1>
            </div>
            
            <p>Bonjour${username ? ` ${username}` : ''},</p>
            
            <div class="success-box">
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #10b981;">✓</p>
              <p style="margin: 10px 0 0 0;">Votre mot de passe a été modifié avec succès.</p>
            </div>
            
            <p>La modification a été effectuée le <strong>${new Date().toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}</strong>.</p>
            
            <div class="warning">
              <strong>⚠️ Important :</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Si vous n'avez pas demandé ce changement, votre compte pourrait avoir été compromis</li>
                <li>Connectez-vous immédiatement et changez à nouveau votre mot de passe</li>
                <li>Contactez-nous si vous pensez que votre compte a été piraté</li>
              </ul>
            </div>
            
            <p>Pour votre sécurité, nous vous recommandons d'utiliser un mot de passe unique et fort.</p>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Catalogue Véhicule A4L - Site non-officiel créé par des joueurs</p>
              <p style="font-size: 11px; color: #666; margin-top: 5px;">
                Ce site n'est pas affilié au serveur officiel Arma For Life.
              </p>
              <p>Cet e-mail a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Bonjour${username ? ` ${username}` : ''},

Votre mot de passe a été modifié avec succès.

La modification a été effectuée le ${new Date().toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}.

⚠️ Important : Si vous n'avez pas demandé ce changement, votre compte pourrait avoir été compromis.
Connectez-vous immédiatement et changez à nouveau votre mot de passe.

Pour votre sécurité, nous vous recommandons d'utiliser un mot de passe unique et fort.

© ${new Date().getFullYear()} Catalogue Véhicule A4L - Site non-officiel créé par des joueurs
Ce site n'est pas affilié au serveur officiel Arma For Life.
    `.trim(),
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ E-mail de changement de mot de passe envoyé:', info.messageId)
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'e-mail:', error)
    throw new Error('Impossible d\'envoyer l\'e-mail de confirmation')
  }
}

/**
 * Génère un token sécurisé pour les liens de confirmation
 */
export function generateSecureToken(): string {
  // Génère un token aléatoire de 32 caractères
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

/**
 * Envoie un e-mail de demande de confirmation pour le changement de mot de passe
 */
export async function sendPasswordChangeRequest(
  email: string,
  token: string,
  username?: string
): Promise<void> {
  const transporter = createTransporter()
  const baseUrl = getBaseUrl()
  const confirmationUrl = `${baseUrl}/account/confirm-password?token=${token}`

  const mailOptions = {
    from: `"Catalogue Véhicule A4L" <${process.env.SMTP_USER || 'noreply@a4l.com'}>`,
    to: email,
    subject: 'Confirmez votre changement de mot de passe - Catalogue Véhicule A4L',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
              border-radius: 10px;
              padding: 30px;
              color: #fff;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              width: 60px;
              height: 60px;
              border-radius: 12px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: #fff !important;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
              text-align: center;
              font-size: 12px;
              color: #888;
            }
            .warning {
              background: rgba(239, 68, 68, 0.1);
              border-left: 4px solid #ef4444;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">A4L</div>
              <h1 style="margin: 0; color: #fff;">Changement de mot de passe demandé</h1>
            </div>
            
            <p>Bonjour${username ? ` ${username}` : ''},</p>
            
            <p>Une demande de changement de mot de passe a été effectuée pour votre compte.</p>
            
            <div class="button-container">
              <a href="${confirmationUrl}" class="button">Confirmer le changement de mot de passe</a>
            </div>
            
            <p style="font-size: 14px; color: #888;">
              Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
              <a href="${confirmationUrl}" style="color: #10b981; word-break: break-all;">${confirmationUrl}</a>
            </p>
            
            <div class="warning">
              <strong>⚠️ Important :</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Ce lien est valide pendant <strong>1 heure</strong> uniquement</li>
                <li>Si vous n'avez pas demandé ce changement, ignorez cet e-mail</li>
                <li>Votre mot de passe ne sera modifié qu'après avoir cliqué sur le bouton ci-dessus</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Catalogue Véhicule A4L - Site non-officiel créé par des joueurs</p>
              <p style="font-size: 11px; color: #666; margin-top: 5px;">
                Ce site n'est pas affilié au serveur officiel Arma For Life.
              </p>
              <p>Cet e-mail a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Bonjour${username ? ` ${username}` : ''},

Une demande de changement de mot de passe a été effectuée pour votre compte.

Pour confirmer le changement, cliquez sur ce lien :
${confirmationUrl}

⚠️ Important :
- Ce lien est valide pendant 1 heure uniquement
- Si vous n'avez pas demandé ce changement, ignorez cet e-mail
- Votre mot de passe ne sera modifié qu'après avoir cliqué sur le lien

© ${new Date().getFullYear()} Catalogue Véhicule A4L - Site non-officiel créé par des joueurs
Ce site n'est pas affilié au serveur officiel Arma For Life.
    `.trim(),
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ E-mail de demande de changement de mot de passe envoyé:', info.messageId)
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'e-mail:', error)
    throw new Error('Impossible d\'envoyer l\'e-mail de confirmation')
  }
}

/**
 * Envoie un e-mail de demande de confirmation pour le changement d'e-mail
 */
export async function sendEmailChangeRequest(
  oldEmail: string,
  newEmail: string,
  token: string,
  username?: string
): Promise<void> {
  const transporter = createTransporter()
  const baseUrl = getBaseUrl()
  const confirmationUrl = `${baseUrl}/account/confirm-email?token=${token}`

  // E-mail à l'ancienne adresse
  const mailOptionsOld = {
    from: `"Catalogue Véhicule A4L" <${process.env.SMTP_USER || 'noreply@a4l.com'}>`,
    to: oldEmail,
    subject: 'Confirmez votre changement d\'e-mail - Catalogue Véhicule A4L',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
              border-radius: 10px;
              padding: 30px;
              color: #fff;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              width: 60px;
              height: 60px;
              border-radius: 12px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: #fff !important;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .info-box {
              background: rgba(59, 130, 246, 0.1);
              border: 2px solid #3b82f6;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
              text-align: center;
              font-size: 12px;
              color: #888;
            }
            .warning {
              background: rgba(239, 68, 68, 0.1);
              border-left: 4px solid #ef4444;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">A4L</div>
              <h1 style="margin: 0; color: #fff;">Changement d'e-mail demandé</h1>
            </div>
            
            <p>Bonjour${username ? ` ${username}` : ''},</p>
            
            <p>Une demande de changement d'adresse e-mail a été effectuée pour votre compte.</p>
            
            <div class="info-box">
              <p style="margin: 0;"><strong>Ancien e-mail :</strong> ${oldEmail}</p>
              <p style="margin: 10px 0 0 0;"><strong>Nouveau e-mail :</strong> ${newEmail}</p>
            </div>
            
            <p>Pour confirmer ce changement, cliquez sur le bouton ci-dessous :</p>
            
            <div class="button-container">
              <a href="${confirmationUrl}" class="button">Confirmer le changement d'e-mail</a>
            </div>
            
            <p style="font-size: 14px; color: #888;">
              Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
              <a href="${confirmationUrl}" style="color: #10b981; word-break: break-all;">${confirmationUrl}</a>
            </p>
            
            <div class="warning">
              <strong>⚠️ Important :</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Ce lien est valide pendant <strong>1 heure</strong> uniquement</li>
                <li>Si vous n'avez pas demandé ce changement, ignorez cet e-mail</li>
                <li>Votre adresse e-mail ne sera modifiée qu'après avoir cliqué sur le bouton ci-dessus</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Catalogue Véhicule A4L - Site non-officiel créé par des joueurs</p>
              <p style="font-size: 11px; color: #666; margin-top: 5px;">
                Ce site n'est pas affilié au serveur officiel Arma For Life.
              </p>
              <p>Cet e-mail a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Bonjour${username ? ` ${username}` : ''},

Une demande de changement d'adresse e-mail a été effectuée pour votre compte.

Ancien e-mail : ${oldEmail}
Nouveau e-mail : ${newEmail}

Pour confirmer ce changement, cliquez sur ce lien :
${confirmationUrl}

⚠️ Important :
- Ce lien est valide pendant 1 heure uniquement
- Si vous n'avez pas demandé ce changement, ignorez cet e-mail
- Votre adresse e-mail ne sera modifiée qu'après avoir cliqué sur le lien

© ${new Date().getFullYear()} Catalogue Véhicule A4L - Site non-officiel créé par des joueurs
Ce site n'est pas affilié au serveur officiel Arma For Life.
    `.trim(),
  }

  try {
    await transporter.sendMail(mailOptionsOld)
    console.log('✅ E-mail de demande de changement d\'e-mail envoyé (ancienne adresse)')
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'e-mail:', error)
    throw new Error('Impossible d\'envoyer l\'e-mail de confirmation')
  }
}

/**
 * Génère un code de vérification à 6 chiffres
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

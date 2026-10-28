import { Resend } from "resend";

// Client Resend initialise seulement si la cle API est presente.
// Sans cle, la notification est simplement desactivee (jamais d'erreur).
const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

// Expediteur : par defaut le domaine de test Resend (onboarding@resend.dev),
// qui n'autorise l'envoi que vers l'adresse du compte Resend. Pour envoyer
// ailleurs, verifier un domaine sur Resend puis definir MAIL_FROM.
const FROM = process.env.MAIL_FROM || "Portfolio <onboarding@resend.dev>";
// Destinataire de la notification (ton adresse).
const TO = process.env.MAIL_TO;

// Echappe le HTML pour eviter toute injection dans le corps du mail.
const escapeHtml = (value) =>
  String(value).replace(
    /[<>&]/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c])
  );

/**
 * Envoie une notification email a chaque nouveau message de contact.
 * Resiliente : si la config manque ou si l'envoi echoue, on logge et on
 * n'empeche jamais l'enregistrement du message (fonction non bloquante).
 */
export async function notifyNewMessage({ name, email, message }) {
  if (!resend) {
    console.warn("Notif email desactivee : RESEND_API_KEY absent.");
    return;
  }
  if (!TO) {
    console.warn("Notif email desactivee : MAIL_TO absent.");
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: TO,
    replyTo: email, // repondre directement au visiteur
    subject: `Nouveau message portfolio : ${name}`,
    text: `Nom : ${name}\nEmail : ${email}\n\n${message}`,
    html: `
      <p><strong>Nom :</strong> ${escapeHtml(name)}<br />
      <strong>Email :</strong> ${escapeHtml(email)}</p>
      <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
    `,
  });

  if (error) {
    throw new Error(error.message || "Envoi Resend echoue");
  }
}

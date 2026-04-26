import webpush from "web-push";

let configured = false;

export function configurePush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

  if (!publicKey || !privateKey) {
    configured = false;
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export function pushConfigured() {
  return configured;
}

export async function sendPush(subscription, payload) {
  if (!configured) return;
  await webpush.sendNotification(subscription, JSON.stringify(payload));
}

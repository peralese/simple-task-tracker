import { useEffect, useState } from "react";
import { api, urlBase64ToUint8Array } from "../api";
import { useApp } from "../context/AppContext";

async function serviceWorkerRegistration() {
  return navigator.serviceWorker.ready;
}

export default function SettingsPage() {
  const { state, actions, dispatch } = useApp();
  const [pauseUntil, setPauseUntil] = useState(state.config.pause_until || "");

  useEffect(() => {
    setPauseUntil(state.config.pause_until || "");
  }, [state.config.pause_until]);

  async function handleSave(event) {
    event.preventDefault();
    await actions.updateConfig({ pause_until: pauseUntil || null });
  }

  async function requestPermissionAndSubscribe() {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      throw new Error("This browser does not support push notifications");
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Notification permission was not granted");
    }

    const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      throw new Error("VITE_VAPID_PUBLIC_KEY is missing");
    }

    const registration = await serviceWorkerRegistration();
    const existingSubscription = await registration.pushManager.getSubscription();
    const subscription = existingSubscription || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    await api.subscribePush(subscription);
  }

  async function handleSubscribe() {
    try {
      await requestPermissionAndSubscribe();
      dispatch({ type: "SET_INFO", info: "Push permission granted and subscription saved." });
    } catch (error) {
      dispatch({ type: "LOAD_ERROR", error: error.message });
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-[28px] border border-ink/10 bg-mist p-5 shadow-panel">
        <p className="text-xs uppercase tracking-[0.24em] text-moss/70">Settings</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">Notifications and pause window</h2>
        <p className="mt-2 text-sm text-ink/60">
          Control push delivery and pause daily reminders until a future date.
        </p>
      </div>

      <form className="space-y-4 rounded-[28px] border border-ink/10 bg-white p-5 shadow-panel" onSubmit={handleSave}>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Pause until</span>
          <input
            className="w-full rounded-2xl border border-ink/10 bg-mist px-4 py-3 text-base focus:border-moss"
            onChange={(event) => setPauseUntil(event.target.value)}
            type="date"
            value={pauseUntil ? String(pauseUntil).slice(0, 10) : ""}
          />
        </label>
        <button className="w-full rounded-2xl bg-moss px-4 py-3 text-base font-medium text-white sm:w-auto" type="submit">
          Save settings
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2">
        <button className="rounded-[24px] bg-ink px-5 py-4 text-left text-white" onClick={handleSubscribe} type="button">
          <span className="block text-sm font-semibold">Request notification permission</span>
          <span className="mt-1 block text-sm text-white/75">Ask the browser and register this device.</span>
        </button>

        <button className="rounded-[24px] bg-amber px-5 py-4 text-left text-ink" onClick={actions.testPush} type="button">
          <span className="block text-sm font-semibold">Send test push notification</span>
          <span className="mt-1 block text-sm text-ink/70">Send a backend test notification to saved subscriptions.</span>
        </button>
      </div>
    </section>
  );
}

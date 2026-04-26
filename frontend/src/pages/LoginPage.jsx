import { useState } from "react";
import { useApp } from "../context/AppContext";

export default function LoginPage() {
  const { state, actions } = useApp();
  const [passphrase, setPassphrase] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    await actions.login(passphrase);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm rounded-[32px] border border-ink/10 bg-mist p-6 shadow-panel sm:p-8">
        <p className="text-xs uppercase tracking-[0.26em] text-moss/70">Secure entry</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-ink">Open your task board.</h1>
        <p className="mt-3 text-sm text-ink/60">
          Enter the single-user passphrase. The app stores a JWT in localStorage.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Passphrase</span>
            <input
              autoComplete="current-password"
              className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-base focus:border-moss"
              onChange={(event) => setPassphrase(event.target.value)}
              placeholder="Enter passphrase"
              type="password"
              value={passphrase}
            />
          </label>
          {state.error ? <p className="text-sm text-rose">{state.error}</p> : null}
          <button className="w-full rounded-2xl bg-moss px-4 py-3 text-base font-medium text-white" type="submit">
            {state.loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}

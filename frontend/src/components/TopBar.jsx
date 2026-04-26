export default function TopBar({ currentPage, onPageChange, onOpenModal, onRefresh, onLogout }) {
  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-mist/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-moss/70">Task App</p>
            <h1 className="text-xl font-semibold text-ink">Personal task manager</h1>
          </div>
          <button className="rounded-full border border-ink/10 px-4 py-2 text-sm text-ink/70" onClick={onLogout} type="button">
            Log out
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex rounded-full bg-canvas p-1">
            {[
              { id: "tasks", label: "Tasks" },
              { id: "archive", label: "Archive" },
              { id: "settings", label: "Settings" }
            ].map((item) => (
              <button
                key={item.id}
                className={`rounded-full px-4 py-2 text-sm ${currentPage === item.id ? "bg-moss text-white" : "text-ink/70"}`}
                onClick={() => onPageChange(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </nav>
          <button className="rounded-full bg-ink px-4 py-2 text-sm text-white" onClick={onOpenModal} type="button">
            Add task
          </button>
          <button className="rounded-full border border-ink/10 px-4 py-2 text-sm text-ink/70" onClick={onRefresh} type="button">
            Refresh
          </button>
        </div>
      </div>
    </header>
  );
}

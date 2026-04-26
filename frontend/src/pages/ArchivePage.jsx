import { useEffect, useState } from "react";
import { api } from "../api";

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}

const priorityClasses = {
  high: "bg-rose/15 text-rose",
  medium: "bg-amber/20 text-amber-700",
  low: "bg-moss/12 text-moss"
};

const statusClasses = {
  completed: "bg-moss/12 text-moss",
  cancelled: "bg-rose/15 text-rose",
  postponed: "bg-amber/20 text-amber-700",
  on_hold: "bg-ink/10 text-ink/55"
};

function ArchiveCard({ task }) {
  return (
    <article className="rounded-[24px] border border-ink/10 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-ink">{task.title}</h3>
          <p className="mt-1 text-sm text-ink/55">Archived {formatDate(task.archived_at)}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${priorityClasses[task.priority] || priorityClasses.medium}`}>
          {task.priority}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-canvas px-3 py-1 text-xs font-medium text-ink/75">
          {task.category || "Uncategorized"}
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusClasses[task.status] || "bg-canvas text-ink/75"}`}>
          {task.status}
        </span>
      </div>
    </article>
  );
}

export default function ArchivePage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setItems([]);
    setPage(1);
    setTotalPages(1);
    fetchPage(1, statusFilter, true);
  }, [statusFilter]);

  async function fetchPage(pageNum, status, replace = false) {
    setLoading(true);
    setError("");
    try {
      const data = await api.getArchive(pageNum, 20, status);
      setItems((prev) => replace ? data.items : [...prev, ...data.items]);
      setPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLoadMore() {
    fetchPage(page + 1, statusFilter);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-ink/10 bg-mist p-5 shadow-panel">
        <p className="text-xs uppercase tracking-[0.24em] text-moss/70">Archive</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">Completed work.</h2>
        <p className="mt-2 text-sm text-ink/60">
          A read-only log of completed, cancelled, and postponed tasks.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <select
            className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm focus:border-moss"
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option value="">All statuses</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="postponed">Postponed</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-[22px] bg-rose/12 px-4 py-3 text-sm text-rose">{error}</div>
      )}

      <div className="grid gap-3">
        {loading && items.length === 0 ? (
          <div className="rounded-[24px] border border-ink/10 bg-white px-4 py-5 text-center text-sm text-ink/55">
            Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-ink/20 bg-white px-4 py-5 text-sm text-ink/55">
            No archived tasks found.
          </div>
        ) : (
          items.map((task) => <ArchiveCard key={task.id} task={task} />)
        )}
      </div>

      {page < totalPages && (
        <button
          className="w-full rounded-2xl border border-ink/10 px-4 py-3 text-sm font-medium text-ink/70 disabled:opacity-50"
          disabled={loading}
          onClick={handleLoadMore}
          type="button"
        >
          {loading ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}

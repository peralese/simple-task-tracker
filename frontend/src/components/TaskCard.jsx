function formatDate(value) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

const priorityClasses = {
  high: "bg-rose/15 text-rose",
  medium: "bg-amber/20 text-amber-700",
  low: "bg-moss/12 text-moss"
};

export default function TaskCard({ task, tone, onComplete, onPostpone, onEdit }) {
  const toneClasses = {
    overdue: "border-rose/35",
    today: "border-amber/35",
    upcoming: "border-ink/10"
  };

  return (
    <article className={`rounded-[24px] border bg-white p-4 shadow-sm ${toneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-ink">{task.title}</h3>
          <p className="mt-1 text-sm text-ink/55">{formatDate(task.due_date)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${priorityClasses[task.priority] || priorityClasses.medium}`}>
          {task.priority}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-canvas px-3 py-1 text-xs font-medium text-ink/75">
          {task.category || "Uncategorized"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button className="rounded-2xl bg-moss px-3 py-2 text-sm font-medium text-white" onClick={onComplete} type="button">
          Complete
        </button>
        <button className="rounded-2xl bg-amber px-3 py-2 text-sm font-medium text-ink" onClick={onPostpone} type="button">
          Postpone
        </button>
        <button className="rounded-2xl border border-ink/10 px-3 py-2 text-sm font-medium text-ink" onClick={onEdit} type="button">
          Edit
        </button>
      </div>
    </article>
  );
}

import TaskCard from "../components/TaskCard";
import { useApp } from "../context/AppContext";

function classify(task) {
  if (task.status === "on_hold") return "onhold";
  if (!task.due_date) return "upcoming";
  const due = new Date(task.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (due < today) return "overdue";
  if (due >= today && due < tomorrow) return "today";
  return "upcoming";
}

function groupTasks(tasks) {
  return tasks.reduce(
    (groups, task) => {
      groups[classify(task)].push(task);
      return groups;
    },
    { overdue: [], today: [], upcoming: [], onhold: [] }
  );
}

function Section({ title, subtitle, tone, children }) {
  const titleTone = {
    overdue: "text-rose",
    today: "text-amber-700",
    upcoming: "text-ink",
    onhold: "text-ink/55"
  };

  return (
    <section className="space-y-3">
      <div>
        <h2 className={`text-lg font-semibold ${titleTone[tone]}`}>{title}</h2>
        <p className="text-sm text-ink/55">{subtitle}</p>
      </div>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

export default function TaskListPage() {
  const { state, dispatch, actions } = useApp();
  const groups = groupTasks(state.tasks);

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-ink/10 bg-mist p-5 shadow-panel">
        <p className="text-xs uppercase tracking-[0.24em] text-moss/70">Today</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">Focus the day.</h2>
        <p className="mt-2 text-sm text-ink/60">
          Tasks are grouped by urgency and tuned for quick actions on mobile.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <select
            className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm focus:border-moss"
            onChange={(event) => actions.applyFilters({ priority: event.target.value })}
            value={state.filters.priority}
          >
            <option value="">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <input
            className="col-span-1 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm focus:border-moss sm:col-span-2"
            onChange={(event) => actions.applyFilters({ category: event.target.value })}
            placeholder="Filter by category"
            value={state.filters.category}
          />

          <button
            className="rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white"
            onClick={() => dispatch({ type: "OPEN_MODAL", mode: "create" })}
            type="button"
          >
            Add task
          </button>
        </div>
      </div>

      <Section subtitle="Tasks whose due date has already passed." title="Overdue" tone="overdue">
        {groups.overdue.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-rose/30 bg-white px-4 py-5 text-sm text-ink/55">
            Nothing overdue.
          </div>
        ) : groups.overdue.map((task) => (
          <TaskCard
            key={task.id}
            onComplete={() => actions.setTaskStatus(task, "completed")}
            onEdit={() => dispatch({ type: "OPEN_MODAL", mode: "edit", task })}
            onHold={() => actions.setTaskStatus(task, "on_hold")}
            onPostpone={() => actions.setTaskStatus(task, "postponed")}
            task={task}
            tone="overdue"
          />
        ))}
      </Section>

      <Section subtitle="Tasks that need attention before the day ends." title="Due Today" tone="today">
        {groups.today.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-amber/30 bg-white px-4 py-5 text-sm text-ink/55">
            No tasks due today.
          </div>
        ) : groups.today.map((task) => (
          <TaskCard
            key={task.id}
            onComplete={() => actions.setTaskStatus(task, "completed")}
            onEdit={() => dispatch({ type: "OPEN_MODAL", mode: "edit", task })}
            onHold={() => actions.setTaskStatus(task, "on_hold")}
            onPostpone={() => actions.setTaskStatus(task, "postponed")}
            task={task}
            tone="today"
          />
        ))}
      </Section>

      <Section subtitle="Everything still ahead of schedule." title="Upcoming" tone="upcoming">
        {groups.upcoming.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-ink/20 bg-white px-4 py-5 text-sm text-ink/55">
            No upcoming tasks.
          </div>
        ) : groups.upcoming.map((task) => (
          <TaskCard
            key={task.id}
            onComplete={() => actions.setTaskStatus(task, "completed")}
            onEdit={() => dispatch({ type: "OPEN_MODAL", mode: "edit", task })}
            onHold={() => actions.setTaskStatus(task, "on_hold")}
            onPostpone={() => actions.setTaskStatus(task, "postponed")}
            task={task}
            tone="upcoming"
          />
        ))}
      </Section>

      <Section subtitle="Paused tasks — resume when ready." title="On Hold" tone="onhold">
        {groups.onhold.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-ink/20 bg-white px-4 py-5 text-sm text-ink/55">
            No tasks on hold.
          </div>
        ) : groups.onhold.map((task) => (
          <TaskCard
            key={task.id}
            onComplete={() => actions.setTaskStatus(task, "completed")}
            onEdit={() => dispatch({ type: "OPEN_MODAL", mode: "edit", task })}
            onHold={() => actions.setTaskStatus(task, "open")}
            onPostpone={() => actions.setTaskStatus(task, "postponed")}
            task={task}
            tone="onhold"
          />
        ))}
      </Section>
    </div>
  );
}

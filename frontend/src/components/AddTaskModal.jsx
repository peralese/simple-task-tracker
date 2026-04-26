import { useEffect, useMemo, useState } from "react";

const presetRules = {
  daily: "FREQ=DAILY;INTERVAL=1",
  weekly: "FREQ=WEEKLY;INTERVAL=1",
  monthly: "FREQ=MONTHLY;INTERVAL=1",
  custom: ""
};

function toInputDate(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default function AddTaskModal({ open, mode, task, recentCategories, onSave, onClose }) {
  const baseForm = useMemo(() => ({
    title: task?.title || "",
    due_date: toInputDate(task?.due_date),
    priority: task?.priority || "medium",
    category: task?.category || "",
    is_recurring: Boolean(task?.is_recurring),
    recurrence_rule: task?.recurrence_rule || presetRules.weekly,
    status: task?.status || "open",
    description: task?.description || ""
  }), [task]);

  const [form, setForm] = useState(baseForm);
  const [preset, setPreset] = useState("weekly");

  useEffect(() => {
    setForm(baseForm);
    if (baseForm.recurrence_rule === presetRules.daily) setPreset("daily");
    else if (baseForm.recurrence_rule === presetRules.weekly) setPreset("weekly");
    else if (baseForm.recurrence_rule === presetRules.monthly) setPreset("monthly");
    else setPreset("custom");
  }, [baseForm]);

  if (!open) return null;

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function changePreset(nextPreset) {
    setPreset(nextPreset);
    update("recurrence_rule", presetRules[nextPreset] ?? form.recurrence_rule);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSave({
      ...task,
      ...form,
      due_date: form.due_date ? new Date(`${form.due_date}T09:00:00`).toISOString() : null,
      recurrence_rule: form.is_recurring ? form.recurrence_rule : ""
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-3 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[28px] bg-mist shadow-panel">
        <form className="space-y-5 p-5 sm:p-6" onSubmit={handleSubmit}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-moss/70">
                {mode === "edit" ? "Edit task" : "New task"}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-ink">
                {mode === "edit" ? "Refine task" : "Capture a task"}
              </h2>
            </div>
            <button className="rounded-full border border-ink/10 px-3 py-1.5 text-sm text-ink/70" onClick={onClose} type="button">
              Close
            </button>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Title</span>
            <input
              className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-base focus:border-moss"
              onChange={(event) => update("title", event.target.value)}
              placeholder="Plan weekly priorities"
              required
              value={form.title}
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Due date</span>
              <input
                className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-base focus:border-moss"
                onChange={(event) => update("due_date", event.target.value)}
                type="date"
                value={form.due_date}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Priority</span>
              <select
                className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-base focus:border-moss"
                onChange={(event) => update("priority", event.target.value)}
                value={form.priority}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Category</span>
            <input
              className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-base focus:border-moss"
              list="recent-category-options"
              onChange={(event) => update("category", event.target.value)}
              placeholder="Work, Personal, Admin"
              value={form.category}
            />
            <datalist id="recent-category-options">
              {recentCategories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Description</span>
            <textarea
              className="min-h-24 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-base focus:border-moss"
              onChange={(event) => update("description", event.target.value)}
              placeholder="Optional notes"
              value={form.description}
            />
          </label>

          <div className="rounded-[24px] border border-ink/10 bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-ink">Recurring</p>
                <p className="text-sm text-ink/55">Enable if the task should roll forward later.</p>
              </div>
              <button
                className={`relative h-8 w-14 rounded-full transition ${form.is_recurring ? "bg-moss" : "bg-stone-300"}`}
                onClick={() => update("is_recurring", !form.is_recurring)}
                type="button"
              >
                <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${form.is_recurring ? "left-7" : "left-1"}`} />
              </button>
            </div>

            {form.is_recurring ? (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {Object.keys(presetRules).map((option) => (
                    <button
                      key={option}
                      className={`rounded-2xl px-3 py-2 text-sm capitalize ${preset === option ? "bg-moss text-white" : "bg-canvas text-ink"}`}
                      onClick={() => changePreset(option)}
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <input
                  className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-base focus:border-moss"
                  onChange={(event) => update("recurrence_rule", event.target.value)}
                  placeholder="FREQ=WEEKLY;INTERVAL=1"
                  value={form.recurrence_rule}
                />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button className="rounded-2xl border border-ink/10 px-4 py-3 text-base text-ink" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="rounded-2xl bg-moss px-4 py-3 text-base font-medium text-white" type="submit">
              {mode === "edit" ? "Save changes" : "Add task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

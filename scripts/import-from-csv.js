import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const csvPath = process.argv[2];

if (!csvPath) {
  console.error("Usage: node scripts/import-from-csv.js <path-to-csv>");
  process.exit(1);
}

const resolvedCsv = path.resolve(process.cwd(), csvPath);
if (!fs.existsSync(resolvedCsv)) {
  console.error(`CSV file not found: ${resolvedCsv}`);
  process.exit(1);
}

const dbPath = path.resolve(process.cwd(), "backend/data/task-app.db");
if (!fs.existsSync(dbPath)) {
  console.error(`Database not found: ${dbPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(resolvedCsv, "utf8");
const lines = raw.split(/\r?\n/).filter(Boolean);
if (lines.length < 2) {
  console.error("CSV appears empty.");
  process.exit(1);
}

function splitCsvLine(line) {
  const out = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      out.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  out.push(current.trim());
  return out;
}

const headers = splitCsvLine(lines[0]);
const rows = lines.slice(1).map((line) => {
  const values = splitCsvLine(line);
  return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
});

const db = new Database(dbPath);
const insert = db.prepare(`
  INSERT INTO tasks (
    title, description, due_date, priority, status, category,
    is_recurring, recurrence_rule, last_modified, created_at
  ) VALUES (
    @title, @description, @due_date, @priority, @status, @category,
    @is_recurring, @recurrence_rule, @last_modified, @created_at
  )
`);

const now = new Date().toISOString();
const tx = db.transaction((items) => {
  items.forEach((row) => {
    const priority = ["high", "medium", "low"].includes(String(row.Priority || "").toLowerCase())
      ? String(row.Priority).toLowerCase()
      : "medium";
    const status = ["open", "completed", "cancelled", "postponed"].includes(String(row.Status || "").toLowerCase())
      ? String(row.Status).toLowerCase()
      : "open";

    insert.run({
      title: row.Title || row["Task ID"] || "Imported task",
      description: row["Task ID"] ? `Imported from Google Sheets task ${row["Task ID"]}` : "",
      due_date: row["Due Date"] ? new Date(row["Due Date"]).toISOString() : null,
      priority,
      status,
      category: row.Category || "",
      is_recurring: 0,
      recurrence_rule: "",
      last_modified: now,
      created_at: now
    });
  });
});

tx(rows);
console.log(`Imported ${rows.length} task${rows.length === 1 ? "" : "s"} from ${resolvedCsv}`);

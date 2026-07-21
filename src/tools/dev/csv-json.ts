// CSV <-> JSON converters — handles quoted fields, no external deps.

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { cur += ch; }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

function csvField(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvToJson(input: string): Record<string, string>[] {
  const lines = input.trim().split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) throw new Error("Input is empty");
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h.trim()] = values[i] ?? ""; });
    return row;
  });
}

export function jsonToCsv(input: string): string {
  let data: unknown;
  try {
    data = JSON.parse(input);
  } catch {
    throw new Error("Invalid JSON input");
  }
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Input must be a non-empty JSON array of objects");
  }
  // Without this, an array of primitives (e.g. [1,2,3]) silently produced
  // near-blank output ("\n\n\n") instead of a clear error — Object.keys()
  // on a non-object returns [], so every "row" ends up empty.
  if (data.some((row) => row === null || typeof row !== "object" || Array.isArray(row))) {
    throw new Error("Input must be a JSON array of objects, e.g. [{\"name\": \"...\"}]");
  }
  const rows = data as Record<string, unknown>[];
  const headers = Array.from(rows.reduce((set, row) => {
    Object.keys(row).forEach((k) => set.add(k));
    return set;
  }, new Set<string>()));

  const lines = [headers.map(csvField).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvField(row[h])).join(","));
  }
  return lines.join("\n");
}

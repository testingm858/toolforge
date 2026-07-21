// YAML Formatter — parse + re-dump via js-yaml (standard, well-vetted parser
// rather than a hand-rolled one; YAML's syntax is too irregular to format
// reliably without a real parser).

import * as yaml from "js-yaml";

export function formatYaml(input: string): string {
  if (!input.trim()) throw new Error("Input is empty");
  let parsed: unknown;
  try {
    parsed = yaml.load(input);
  } catch (err) {
    throw new Error(`Invalid YAML: ${(err as Error).message}`);
  }
  return yaml.dump(parsed, { indent: 2, lineWidth: 80, noRefs: true });
}

export function validateYaml(input: string): { valid: boolean; error?: string } {
  try {
    yaml.load(input);
    return { valid: true };
  } catch (err) {
    return { valid: false, error: (err as Error).message };
  }
}

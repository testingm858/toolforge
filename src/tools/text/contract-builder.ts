// Contract Builder — fills a couple of common template shapes.
// Educational starting point only, not legal advice.

export interface ContractInput {
  type: "nda" | "freelance";
  partyA: string;
  partyB: string;
  date?: string;
  effectiveDate?: string;
  jurisdiction?: string;
  // freelance-only
  scope?: string;
  fee?: string;
  paymentTerms?: string;
  // nda-only
  purpose?: string;
  termMonths?: number;
}

export function buildContract(input: ContractInput): { title: string; text: string } {
  const date = input.date ?? new Date().toISOString().split("T")[0];
  if (!input.partyA || !input.partyB) throw new Error("partyA and partyB are required");

  if (input.type === "nda") {
    const term = input.termMonths ?? 24;
    const title = "Mutual Non-Disclosure Agreement";
    const text = `${title}

This Agreement is entered into as of ${date} between ${input.partyA} ("Disclosing Party") and ${input.partyB} ("Receiving Party") for the purpose of ${input.purpose ?? "evaluating a potential business relationship"}.

1. Confidential Information. Each party may disclose information considered confidential to the other party. The Receiving Party agrees to hold such information in confidence and not disclose it to third parties.

2. Term. This Agreement remains in effect for ${term} months from the date above, unless terminated earlier by mutual written consent.

3. Exclusions. Confidential Information does not include information that is publicly available, independently developed, or rightfully received from a third party.

4. Governing Law. This Agreement is governed by the laws of ${input.jurisdiction ?? "[jurisdiction]"}.

Signed:

${input.partyA}                              ${input.partyB}
_______________________              _______________________
Date: ${date}                                 Date: ${date}`;
    return { title, text };
  }

  if (input.type === "freelance") {
    const title = "Freelance Services Agreement";
    const text = `${title}

This Agreement is entered into as of ${date} between ${input.partyA} ("Client") and ${input.partyB} ("Contractor").

1. Scope of Work. Contractor agrees to provide the following services: ${input.scope ?? "[describe scope of work]"}.

2. Fees. Client agrees to pay Contractor ${input.fee ?? "[fee amount]"}. Payment terms: ${input.paymentTerms ?? "due within 30 days of invoice"}.

3. Effective Date. This Agreement is effective as of ${input.effectiveDate ?? date}.

4. Independent Contractor. Contractor is an independent contractor, not an employee of Client.

5. Ownership. Upon full payment, all deliverables become the property of Client, except for Contractor's pre-existing tools and materials.

6. Governing Law. This Agreement is governed by the laws of ${input.jurisdiction ?? "[jurisdiction]"}.

Signed:

${input.partyA}                              ${input.partyB}
_______________________              _______________________
Date: ${date}                                 Date: ${date}`;
    return { title, text };
  }

  throw new Error('type must be "nda" or "freelance"');
}

## 1. What user problem does this code solve?

<!-- Reference the specific locked User Problem (#1-8) or Daily
Experience moment this addresses. "No product problem" is a valid
answer for pure infra/tooling PRs — say so explicitly rather than
leaving this blank. -->

## 2. Which Product Constitution decision does it implement?

<!-- Name the specific locked pillar, phase, or ADR this traces to.
If this PR doesn't implement a locked decision, say what it's for
instead (e.g. "TD-1: test infrastructure"). -->

## 3. What existing code was reused?

<!-- Name the specific files/services/patterns extended. If nothing
existing applied, say why this had to be net-new. -->

## 4. What technical debt was introduced or removed?

<!-- Reference the Technical Debt Board by ID if applicable (e.g.
"removes TD-3", "does not address TD-2, out of scope for this sprint").
"None" is a valid answer, but must be a deliberate statement, not an
omission. -->

## 5. Migration Impact

<!-- Required for any PR that changes a Mongoose schema, adds/removes a
collection, or otherwise alters stored data shape. "N/A — no schema or
data changes" is a valid answer for pure UI/infra PRs, but must be
stated explicitly rather than left blank. -->

- [ ] Schema change is additive only (new optional/defaulted field or
      new collection) — no existing field renamed, removed, or made
      stricter for existing documents
- [ ] Existing documents remain valid without a backfill (new fields
      have safe defaults), OR a backfill script/plan is included in
      this PR
- [ ] No breaking change to an existing API request/response shape
      consumed by a shipped client
- [ ] Rollback is safe — reverting this PR does not strand or corrupt
      data written under the new shape
- [ ] If this diverges from a locked ADR (`docs/adr/`), a new or
      updated ADR is included in this PR

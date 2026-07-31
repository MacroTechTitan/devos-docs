# Contributing to DevOS Documentation

This repository is the published source of truth for DevOS product guidance, engineering
specifications, and governance. Changes here change what the company considers true.
Please treat contributions accordingly.

## Documentation principles

1. **Accuracy outranks completeness.** A short, correct page is better than a long page
   that overstates what exists. If you cannot verify a claim, do not write it.
2. **Status before capability.** Declare whether something is Concept, Planned, Prototype,
   Private beta, Beta, or Production before describing what it does. Never use the present
   tense for unbuilt behaviour.
3. **Specifications are testable.** Functional requirements should be written so that a
   reviewer can say whether the implementation satisfies them. Acceptance criteria are not
   optional on specification pages.
4. **Record the disagreement.** Alternatives considered and open questions are part of the
   document, not notes that disappear after review.
5. **Write for two readers.** A human evaluating DevOS, and an AI agent retrieving a
   passage without surrounding context. Both need self-contained paragraphs and stable
   headings.
6. **No filler.** No lorem ipsum, no placeholder pages, no invented metrics, customers,
   testimonials, or capabilities.
7. **One concept per page.** If a page needs two version histories, it should be two pages.

## Branch naming

| Prefix | Use |
| --- | --- |
| `docs/` | New content or edits to existing content |
| `fix/` | Corrections to published content |
| `rfc/` | New or revised RFCs, named `rfc/002-confidence-engine` |
| `chore/` | Configuration, navigation, tooling, repository maintenance |
| `refactor/` | Restructuring pages without changing meaning |

Use short, hyphenated, lower-case descriptions: `docs/multi-tenancy-isolation`.

## Commit message conventions

Conventional Commits, imperative mood, lower case after the colon:

```
docs: add multi-tenancy isolation model
fix: correct decision ledger status transitions
chore: update mintlify navigation groups
refactor: split engines overview into per-engine pages
```

Guidance:

- One logical change per commit.
- Reference the RFC in the body when implementing one: `Implements RFC-002.`
- Keep configuration changes (`docs.json`) in their own commit.
- Do not use `wip` as a commit message on a branch you intend to open a PR from.

## Pull request expectations

Every pull request must:

1. Target `main` and be squash-merged.
2. Describe **what changed and why**, not just what changed.
3. State whether the change is normative (alters a standard, requirement, or status) or
   editorial (clarity, typography, structure).
4. Confirm the Mintlify preview renders and that any new page appears in navigation.
5. Update `docs.json` in the same PR when adding or removing a page. A page that is not in
   navigation is unreachable.
6. Update the page's **Version history** table when the change is normative.
7. Leave no `TODO`, `FIXME`, or placeholder text in the diff.

Pull requests that change a status label from a lower to a higher maturity (for example
Prototype to Beta) must link to the evidence: a demo, a test run, or a release note.

## Review requirements

| Change type | Required review |
| --- | --- |
| Editorial (typos, formatting, clarity) | One documentation reviewer |
| New page, non-normative | One documentation reviewer |
| Normative product or engine specification | Product owner for that area |
| Architecture or security specification | Engineering owner, plus security review for `security/` |
| Constitution (`constitution/`) | Two maintainers, via the RFC process |
| Status promotion to Beta or Production | Product owner and engineering owner |
| `docs.json` navigation restructure | One maintainer |

Reviewers check accuracy and status honesty first, prose second. A reviewer who cannot
verify a factual claim should ask for the source rather than approving on trust.

## Page status rules

Every page describing a capability declares its status in a status block near the top.

| Status | Meaning |
| --- | --- |
| Concept | Under design. No implementation exists. Shape may change entirely. |
| Planned | Committed and scoped. Implementation has not started or is early. |
| Prototype | Working implementation exists internally. Not stable, not supported. |
| Private beta | Available to selected users. Behaviour may change with notice. |
| Beta | Broadly available. Stable enough to build on. Known gaps documented. |
| Production | Generally available, supported, and covered by change control. |

Rules:

- Concept and Planned pages describe intent in the future or conditional tense.
- Prototype and above may describe present behaviour, limited to what actually works.
- A status change is always a normative change and requires the review above.
- `index.mdx` carries the authoritative capability status table. Page-level status must not
  contradict it; update both in the same pull request.

See `reference/status-definitions` for the published version of this table.

## How to submit an RFC

Use the RFC process for changes to the Constitution, to an engine's contract, to the data
model, or to anything that other documents depend on.

1. Copy `rfcs/template.mdx` to `rfcs/rfc-<nnn>-<slug>.mdx`. Take the next unused number;
   numbers are never reused.
2. Fill in Summary, Motivation, Proposal, Alternatives considered, Risks, Migration, and
   Open questions. An RFC without alternatives is not ready for review.
3. Set the status to `Draft` and add the entry to the table in `rfcs/index.mdx`.
4. Add the page to `docs.json` navigation.
5. Open a pull request from an `rfc/` branch. The pull request is the discussion venue.
6. When review converges, set the status to `Accepted`, `Rejected`, or `Withdrawn` and
   record the decision date. Rejected RFCs stay in the repository — the reasoning is the
   value.
7. Accepted RFCs are implemented by follow-up pull requests that reference the RFC number.

See `governance/proposal-process` for the full lifecycle.

## How to preview with Mintlify

```bash
npm install -g mint
mint dev
```

The preview normally runs at <http://localhost:3000>. Run the command from the repository
root, where `docs.json` lives.

Before requesting review:

```bash
mint broken-links
```

Checklist:

- [ ] Every new page has `title` and `description` frontmatter.
- [ ] Every new page is reachable from `docs.json` navigation.
- [ ] `mint broken-links` reports no failures.
- [ ] Mermaid diagrams render in the preview.
- [ ] Status labels are present and consistent with `index.mdx`.
- [ ] No `TODO`, `FIXME`, `Lorem`, or placeholder text remains.

## Conduct

All contributors are expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

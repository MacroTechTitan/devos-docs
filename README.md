# DevOS Documentation

DevOS is the operating system for building software. It converts product intent into
architecture recommendations, documented decisions, implementation blueprints, and
structured build pipelines.

This repository contains the complete DevOS documentation set, published with
[Mintlify](https://mintlify.com).

- Product: <https://devos.macrotechtitan.com>
- Documentation: <https://docs.devos.macrotechtitan.com>

## What DevOS does

A user describes what they are building. DevOS then:

1. Runs a guided **product interview** that converts the description into a structured brief.
2. Produces **architecture recommendations** drawn from a library of reference frameworks.
3. Attaches a **confidence score** and explicit rationale to each recommendation.
4. Records accepted choices in an immutable **Decision Ledger**.
5. Compiles the ledger into an implementation **blueprint**.
6. Emits ordered, scoped **AI build prompts** and human work items.

## Repository purpose

This repository serves four distinct purposes, deliberately kept in one place so that
public guidance and internal specification cannot drift apart:

1. **Public product documentation** — what DevOS is and how to use it.
2. **Internal product and engineering specifications** — how each engine, workspace, and
   platform component is meant to behave.
3. **The DevOS Constitution and governance model** — the principles and standards that
   constrain product and engineering decisions, and the process for changing them.
4. **A retrievable knowledge base for AI agents** — pages are written with stable headings
   and explicit status labels so that agents can retrieve and cite them reliably.

## Documentation architecture

| Directory | Contents |
| --- | --- |
| `introduction/` | Overview, vision, philosophy, terminology, roadmap |
| `getting-started/` | Quickstart, workflow, first project, roles and workspaces |
| `constitution/` | Mission, principles, product/engineering/AI standards, governance, versioning |
| `product/` | Product surface: personas, lifecycle, workspaces, permissions |
| `engines/` | The seven core engines, from Product Interview to Build Pipeline |
| `frameworks/` | Framework library: the framework standard plus eight reference frameworks |
| `architecture/` | Platform architecture: system, data, auth, tenancy, integrations, ops |
| `security/` | Access control, data protection, secrets, audit logging, incident response |
| `design/` | Design system, navigation, dashboard, accessibility, content style |
| `agents/` | Agent standard and the specialised DevOS agents |
| `api-reference/` | Planned public API surface |
| `governance/` | Documentation lifecycle, proposals, releases, changelog policy |
| `rfcs/` | RFC index, template, and accepted or in-review RFCs |
| `reference/` | Glossary, status definitions, and reusable templates |
| `images/` | Diagram and screenshot assets |

Configuration lives in `docs.json`. Mintlify's older `mint.json` format is not used.

## Local development

Requires Node.js 18 or later.

```bash
npm install -g mint
mint dev
```

The local preview normally runs at <http://localhost:3000>.

Useful commands:

```bash
mint dev              # start the local preview
mint broken-links     # check internal links across the docs set
mint update           # update the CLI to the current version
```

Run `mint dev` from the repository root, where `docs.json` lives. If the preview fails to
start, confirm `docs.json` is valid JSON before investigating anything else.

## Mintlify deployment

Deployment is continuous and driven by GitHub:

1. Mintlify's GitHub App is installed on `MacroTechTitan/devos-docs`.
2. Merges into `main` trigger a production build and deploy.
3. Pull requests receive a Mintlify preview deployment.
4. The production site is served at `docs.devos.macrotechtitan.com`.

Because `main` deploys automatically, `main` is protected: all changes arrive by pull
request. A build failure on `main` is treated as a production incident, not a routine
failure — see [SECURITY.md](SECURITY.md) for reporting expectations and
`governance/release-process` for the release path.

## Contribution workflow

Full detail lives in [CONTRIBUTING.md](CONTRIBUTING.md). The short version:

```bash
git checkout -b docs/short-description
git add .
git commit -m "docs: describe change"
git push -u origin docs/short-description
```

Then open a pull request against `main`, confirm the Mintlify preview renders, and request
review from a documentation owner.

### Branch strategy

| Branch | Purpose |
| --- | --- |
| `main` | Published documentation. Protected. Deploys to production. |
| `docs/<short-description>` | Content additions and edits. |
| `rfc/<number>-<slug>` | New or revised RFCs. |
| `fix/<short-description>` | Corrections to published content. |
| `chore/<short-description>` | Configuration, tooling, and repository maintenance. |

Branches are short-lived and squash-merged.

### Commit conventions

Commits follow Conventional Commits with a documentation bias:

```
docs: add multi-tenancy isolation model
fix: correct decision ledger status transitions
chore: update mintlify navigation groups
refactor: split engines overview into per-engine pages
```

Rules:

- Use the imperative mood and lower case after the colon.
- One logical change per commit.
- Reference an RFC in the body when the change implements one, for example `Implements RFC-002`.
- Do not mix configuration changes with content changes in a single commit.

## Repository structure

```
.
├── docs.json                 Mintlify configuration and navigation
├── index.mdx                 Documentation homepage
├── README.md                 This file
├── CONTRIBUTING.md           Contribution and review process
├── CODE_OF_CONDUCT.md        Contributor conduct policy
├── SECURITY.md               Vulnerability reporting
├── LICENSE                   Proprietary licence notice
├── introduction/             What DevOS is
├── getting-started/          How to use DevOS
├── constitution/             Principles and standards
├── product/                  Product specifications
├── engines/                  Core engine specifications
├── frameworks/               Framework library
├── architecture/             Platform architecture
├── security/                 Security controls
├── design/                   Design system
├── agents/                   AI agent specifications
├── api-reference/            Planned API surface
├── governance/               Documentation governance
├── rfcs/                     Design proposals
├── reference/                Glossary and templates
└── images/                   Assets
```

## Documentation standards

1. **Frontmatter is mandatory.** Every `.mdx` file begins with `title` and `description`.
2. **State status honestly.** Every capability page declares one of: Concept, Planned,
   Prototype, Private beta, Beta, Production. Never describe a planned capability in the
   present tense.
3. **No filler.** No lorem ipsum, no blanket "coming soon", no invented statistics,
   customers, testimonials, or capabilities.
4. **Specifications use the standard section order** — Purpose, Goals, Non-goals, Scope,
   Definitions, User experience, Functional requirements, Data model, Permissions,
   Security considerations, Failure states, Acceptance criteria, Open questions, Version
   history — omitting only sections that genuinely do not apply.
5. **Open questions are recorded, not hidden.** An unresolved design question belongs in
   the Open questions section, not in a vague sentence in the body.
6. **Diagrams are Mermaid.** Diagrams live in the page, in version control, as text.
7. **Links are root-relative** (`/engines/decision-ledger`), without the `.mdx` extension.
8. **Stable headings.** Headings are part of the retrieval contract for AI agents; renaming
   one is a breaking change and requires a redirect or a note in the version history.
9. **Every page ends with a version history table** where the page carries normative content.

## Licence

Copyright © 2026 Macro Tech Titan, Inc.
All rights reserved.

This repository is proprietary and confidential. It is not open source. See
[LICENSE](LICENSE) for the full notice.

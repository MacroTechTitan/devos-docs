# Security Policy

This repository contains documentation for DevOS, including example code and configuration
snippets. It does not contain the DevOS application itself. This policy covers security
issues in the documentation and its examples, and explains where to report issues in the
DevOS product.

## Scope

**In scope for this repository:**

- Example code, configuration, or commands in the documentation that are insecure by
  default, or that would harm a reader who followed them as written.
- Documented architecture, authentication, or authorisation guidance that is wrong in a way
  that would lead an implementer to build an insecure system.
- Credentials, tokens, private keys, internal hostnames, or customer data accidentally
  committed to this repository or its history.
- Supply-chain issues in this repository's tooling and dependencies.
- Repository configuration weaknesses, such as missing branch protection on `main`.

**Out of scope for this repository — report to the product security address below:**

- Vulnerabilities in the DevOS application, API, or infrastructure.
- Account, tenancy, or data-isolation issues in a DevOS workspace.
- Issues in the Mintlify platform itself. Report those to Mintlify.

## Reporting a vulnerability

Email **security@macrotechtitan.com** with:

1. A description of the issue and why it is a security problem.
2. The affected file, page URL, or commit.
3. Reproduction steps, if applicable.
4. Your assessment of impact.
5. Whether the issue is already public.

Please do **not** open a public GitHub issue for a suspected vulnerability, and do not
include live credentials or customer data in your report.

If the issue concerns the DevOS product rather than this documentation, use the same
address and say so in the subject line.

## What to expect

| Stage | Target |
| --- | --- |
| Acknowledgement of your report | 3 business days |
| Initial assessment and severity | 10 business days |
| Remediation of documentation issues | 30 days from assessment |
| Remediation of exposed-credential issues | Immediate, ahead of all other work |

These are targets for a documentation repository, not a contractual service level. We will
tell you if a fix will take longer and why.

## Exposed credentials

If a credential is committed to this repository, the response order is fixed:

1. Revoke and rotate the credential. Rotation comes before cleanup — assume any committed
   secret is compromised, including in a private repository.
2. Remove it from the working tree.
3. Purge it from history if the repository has been shared or mirrored.
4. Record the event in the internal audit log.

Removing a secret from a file without rotating it is not a fix.

## Coordinated disclosure

We ask that you give us a reasonable opportunity to remediate before public disclosure. We
will credit reporters who wish to be credited once a fix is published. We do not currently
operate a paid bounty programme for this repository.

## Handling example code

Documentation examples are held to the same standards we ask of implementers:

- No real credentials, keys, tokens, or account identifiers. Use obvious placeholders.
- No examples that disable TLS verification, authentication, or authorisation checks
  without an explicit warning explaining the risk.
- No copy-and-paste commands that operate destructively without a stated precondition.
- Security-relevant defaults in examples must match the secure default we recommend in
  prose. An example that contradicts the guidance is a documentation bug.

See `security/overview` for the DevOS security model, and `security/incident-response` for
the product incident process.

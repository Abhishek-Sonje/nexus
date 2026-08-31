# Technology baseline

Verified on 2026-08-31 against official release documentation and resolved through the package registry.

| Area               | Selected baseline                                           |
| ------------------ | ----------------------------------------------------------- |
| Production runtime | Node.js 24 LTS container                                    |
| Workspace tooling  | Bun 1.4 target; Bun 1.3.5 available on the development host |
| Web                | Next.js 16.3.3, React 19.2.8                                |
| Styling            | Tailwind CSS 4.3.3                                          |
| Validation         | Zod 4.5.4                                                   |
| Persistence        | PostgreSQL 18.6, Drizzle ORM 0.45.2, node-postgres 8.23.0   |
| Graph              | Graphology 0.26.0, Louvain 2.0.2, Sigma.js 3.0.3            |
| Jobs               | pg-boss 12.29.0                                             |
| Narrative          | @google/genai 2.19.0, stable model code `gemini-3.7-flash`  |

The lockfile is authoritative for transitive versions. Pre-release dependencies are not accepted without a recorded architecture decision.

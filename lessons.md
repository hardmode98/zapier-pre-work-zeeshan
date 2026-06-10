# Lessons

Running log of lessons, decisions, and things to remember for this project.
When the user says "note this down" (or similar), append an entry here.
This file is injected into context at the start of every Claude Code session.

Format: `## YYYY-MM-DD — short title` followed by the lesson.

---

## 2026-06-10 — nodemon needs `--signal SIGTERM` with this server

nodemon's default restart signal is `SIGUSR2`, which `server.ts` doesn't handle —
the old process kept port 3000, the new one crashed with `EADDRINUSE`, and stale
code kept serving. `--signal SIGTERM` routes restarts through the existing
graceful-shutdown path.

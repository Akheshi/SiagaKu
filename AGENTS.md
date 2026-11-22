<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Aturan proyek SiagaKu (untuk semua agen: Claude Code, Codex)

- Dokumen proyek ada di folder induk (tidak masuk repo): `../AGENTS.md`, `../CLAUDE.md`, `../HANDOFF.md`, `../PRD.md`, `../DESAIN-UI.md`, `../RENCANA-KERJA.md`. **Baca `../AGENTS.md` dan `../HANDOFF.md` dulu.**
- Repo ini publik dan riwayat commit dinilai: jangan force-push, jangan rewrite history, jangan commit `.env*` selain `.env.example`.
- Sebelum push: `npm run lint`, `npm test`, `npm run build` harus lulus.
- Setelah tiap tugas, perbarui `../HANDOFF.md`.

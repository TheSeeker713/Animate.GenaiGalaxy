# Dependency upgrades (planned majors)

Patch and minor updates are applied with `npm update` as part of regular maintenance.

**Do not merge these in one PR with feature work.** After each upgrade: `npm run lint`, `npm run test`, `npm run build`, plus manual QA ([QA_CHECKLIST.md](./QA_CHECKLIST.md)).

| Target | Notes |
|--------|--------|
| TipTap 3.x | Story rich text in node inspectors; verify every inspector with TipTap |
| Vite 8.x + `@vitejs/plugin-react` 6.x | Pair in same PR; re-check `vite.config.ts` and chunk splits |
| `react-dropzone` 15 | Test media uploads in Story |

TipTap 2 → 3 migration guide: [https://tiptap.dev/docs/guides/upgrade-tiptap-v2](https://tiptap.dev/docs/guides/upgrade-tiptap-v2)

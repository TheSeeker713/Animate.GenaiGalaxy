# Dependency upgrades (planned majors)

Patch and minor updates are applied with `npm update` as part of regular maintenance.

**Do not merge these in one PR with feature work.** After each upgrade: `npm run lint`, `npm run test`, `npm run build`, plus manual QA ([QA_CHECKLIST.md](./QA_CHECKLIST.md)).

| Target | Notes |
|--------|--------|
| TipTap 3.x | **Done** — [`RichTextEditor`](../src/components/common/RichTextEditor.tsx) uses `@tiptap/extensions` + v3 packages |
| Vite 8.x + `@vitejs/plugin-react` 6.x | **Done** — `rolldownOptions.output.codeSplitting`; `@mediapipe/tasks-vision` aliased to `vision_bundle.mjs` for Rolldown |
| `react-dropzone` 15 | **Done** — verify Story/media uploads after changes |

TipTap 2 → 3 migration guide: [https://tiptap.dev/docs/guides/upgrade-tiptap-v2](https://tiptap.dev/docs/guides/upgrade-tiptap-v2)

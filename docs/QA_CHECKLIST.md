# Manual QA checklist

Run through after meaningful changes (routing, stores, canvas, or exports).

## Global

- [ ] `npm run lint`, `npm run test`, `npm run build`, and `npm run test:e2e` succeed (after `npm run build` for e2e)  
- [ ] Toasts appear for save/load failures (no raw `alert` for those paths)  
- [ ] Error boundary: trigger a render error in dev tools → studio fallback offers dashboard link  

## Dashboard

- [ ] Create raster / vector / story / character projects  
- [ ] Open each from Recent Projects  
- [ ] Delete story → graph gone from IndexedDB; delete character → storage cleared  
- [ ] Settings / Help modals open  

## Raster

- [ ] Draw, change frame, onion skin, save, refresh, reopen project  
- [ ] Export modal (GIF or other) shows toast on failure  

## Vector

- [ ] Add shapes and pen path, zoom/pan, save state across refresh if persisted  

## Character

- [ ] Template load, save, export PNG / JSON / GIF (Edit mode), toast on export failure  
- [ ] Test Live switches to playback mode  

## Story (branching narrative, infinite canvas)

- [ ] Export plain outline (.txt) downloads  
- [ ] Paste image (outside inputs) adds to media library  
- [ ] New story → URL becomes `/story/:id`  
- [ ] Pan and zoom across a large empty area; **Fit graph** and **100%** in canvas panel  
- [ ] `?` opens shortcuts; scroll/pinch zoom within min/max  
- [ ] Search result focuses node  
- [ ] Export story → success toast  

## Storage / privacy

- [ ] With IndexedDB disabled or private mode, app degrades gracefully (toasts or empty state)  

## Touch / tablet (follow-up)

- [ ] Story: two-finger pan, pinch zoom  
- [ ] Konva studios: pinch zoom if implemented  

## Performance (optional)

- [ ] Story: 500+ nodes — acceptable pan/zoom (virtualization at 100+)  
- [ ] Raster: many frames — timeline still usable  

## E2E (optional)

- [ ] Add Playwright/Cypress later: dashboard → create story → add node → save  

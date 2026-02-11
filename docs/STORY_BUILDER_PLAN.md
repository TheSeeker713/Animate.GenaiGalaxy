# Story Builder - Prototype & MVP Plan
**Created:** February 10, 2026  
**Version:** 1.0  
**Status:** Phase 3 Complete - Preview & Playback System Implemented

---

## 🎯 Vision & Purpose

**Story Builder** is the 4th studio in GenAI Galaxy Animate - a node-based interactive storytelling system that lets creators build branching narratives with animated characters, dialogue, and choices.

**Think:** Twine + Yarn + Visual Novel Engine, but integrated with our Character Studio for animated performances.

### Target Use Cases
1. **Visual Novels** - Anime-style interactive stories with character art and dialogue
2. **Game Narratives** - Branching quest dialogue for RPGs
3. **Interactive Comics** - Panel-to-panel storytelling with choices
4. **Educational Stories** - Choose-your-own-adventure learning content
5. **Marketing Narratives** - Interactive product stories/onboarding flows

---

## 🏗️ Architecture Overview

### Technology Stack
- **Canvas/Editor:** React Flow (react-flow-renderer) - Node-based editor with zoom/pan/connections
- **State Management:** Zustand (storyStore.ts) - Follow existing pattern
- **Rendering:** React + Tailwind - Match existing studio design
- **Export:** HTML5 + standalone JSON player
- **Character Integration:** Import from Character Studio via projectStore

### Core Philosophy
1. **Visual First** - Drag-to-connect nodes, no code required
2. **Preview-Driven** - Live preview of story flow as you build
3. **Character-Native** - First-class support for animated characters from Character Studio
4. **Export-Ready** - One-click export to playable HTML5
5. **Free Tier Included** - Unlimited nodes and branching in free tier

---

## 📦 MVP Feature Set (v1.0)

### Phase 1: Core Node System (Week 1-2)
**Goal:** Get the node editor working with basic flow

**Features:**
- ✅ Canvas with zoom/pan (React Flow)
- ✅ Node palette (sidebar with draggable node types)
- ✅ Connection system (drag from output to input ports)
- ✅ Delete nodes (backspace/delete key)
- ✅ Multi-select (Shift+Click, drag-select box)
- ✅ Auto-layout (organize nodes in clean flow)
- ✅ Minimap (top-right overview)
- ✅ Controls (zoom in/out, fit view, lock)

**Node Types (MVP):**
1. **Start Node** - Entry point (only one per story)
2. **Dialogue Node** - Character speaks with portrait
3. **Choice Node** - Present 2-4 options to player
4. **Branch Node** - Conditional logic (if/else based on variables)
5. **Set Variable** - Store player choices (name, score, flags)
6. **End Node** - Story conclusion

**Data Structure:**
```typescript
interface StoryNode {
  id: string
  type: 'start' | 'dialogue' | 'choice' | 'branch' | 'variable' | 'end'
  position: { x: number; y: number }
  data: NodeData
}

interface DialogueNodeData {
  characterId?: string // Reference to Character Studio character
  characterName: string
  text: string
  expression?: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised'
  animation?: string // Trigger character animation (wave, nod, etc.)
  backgroundImage?: string
  soundEffect?: string
}

interface ChoiceNodeData {
  prompt: string
  choices: Array<{
    id: string
    text: string
    condition?: string // e.g., "score > 10"
    setVariable?: { key: string; value: any }
  }>
}

interface BranchNodeData {
  condition: string // e.g., "inventory.hasKey === true"
  trueOutput: string // Node ID to connect on true
  falseOutput: string // Node ID to connect on false
}

interface VariableNodeData {
  key: string // e.g., "playerName", "score", "hasKey"
  value: any
  operation: 'set' | 'add' | 'subtract' | 'toggle'
}
```

---

### Phase 2: Dialogue Editor (Week 2-3)
**Goal:** Rich dialogue editing with character portraits

**Features:**
- ✅ Dialogue node inspector panel (right sidebar)
- ✅ Character selector (dropdown of imported characters)
- ✅ Text editor with markdown support (bold, italic, etc.)
- ✅ Expression selector (if character has expressions)
- ✅ Background image picker
- ✅ Preview pane (see dialogue as player would)

**UI Layout:**
```
┌─────────────────────────────────────────────────────┐
│  [Story Builder]             [Preview] [Export]     │
├───────┬─────────────────────────────────┬───────────┤
│ NODES │                                 │ INSPECTOR │
│       │                                 │           │
│ Start │        Canvas Area              │ Node:     │
│ ━━━━━ │       (React Flow)              │ Dialogue  │
│       │                                 │           │
│Dialog │                                 │Character: │
│ ━━━━━ │                                 │[Select..] │
│       │                                 │           │
│Choice │                                 │Text:      │
│ ━━━━━ │                                 │┌────────┐ │
│       │                                 ││        │ │
│Branch │                                 ││        │ │
│ ━━━━━ │                                 │└────────┘ │
│       │                                 │           │
│ Var   │                                 │Expr: [▼] │
│ ━━━━━ │                                 │Anim: [▼] │
│       │                                 │           │
│ End   │                                 │[Preview] │
│ ━━━━━ │                                 │           │
└───────┴─────────────────────────────────┴───────────┘
```

---

### Phase 3: Preview & Playback (Week 3-4)
**Goal:** Play story from any node to test flow

**Features:**
- ✅ Preview mode (full-screen story player)
- ✅ Start from any node (for testing branches)
- ✅ Visual novel UI (character portraits, dialogue box, choice buttons)
- ✅ Variable inspector (see current state)
- ✅ History panel (back button to replay choices)
- ✅ ESC to exit preview and return to editor

**Visual Novel Player UI:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              [Background Image]                     │
│                                                     │
│     ┌──────┐                                        │
│     │      │                                        │
│     │ Char │                                        │
│     │ Port │                                        │
│     │      │                                        │
│     └──────┘                                        │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Character Name                              │   │
│  │ ─────────────────────────────────────────── │   │
│  │ Dialogue text goes here. This is what the  │   │
│  │ character is saying.                    [▶] │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│     [Choice 1: Go left]    [Choice 2: Go right]    │
└─────────────────────────────────────────────────────┘
```

---

### Phase 4: Export System (Week 4)
**Goal:** Export to playable HTML5 file

**Features:**
- ✅ Export modal (settings for output)
- ✅ Standalone HTML5 file (single .html with embedded JSON)
- ✅ Project JSON export (for importing back into editor)
- ✅ Include character assets (embed images as base64)
- ✅ Download as .zip (html + assets folder for optimization)

**Export Format:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>My Interactive Story</title>
  <style>/* Embedded CSS */</style>
</head>
<body>
  <div id="story-player"></div>
  <script>
    // Embedded story data
    const STORY_DATA = {
      nodes: [...],
      characters: [...],
      variables: {...}
    };
    
    // Embedded visual novel engine (React-free, vanilla JS)
    class StoryPlayer {
      constructor(data) { /* Player logic */ }
      render() { /* DOM manipulation */ }
      handleChoice(choiceId) { /* Navigate graph */ }
    }
    
    new StoryPlayer(STORY_DATA).render();
  </script>
</body>
</html>
```

---

## 🗄️ State Management (storyStore.ts)

```typescript
interface StoryStore {
  // Core state
  currentStory: Story | null
  nodes: StoryNode[]
  connections: StoryConnection[]
  variables: Record<string, any>
  
  // UI state
  selectedNodeId: string | null
  inspectorOpen: boolean
  previewMode: boolean
  previewStartNodeId: string | null
  
  // Character integration
  importedCharacters: Array<{
    id: string
    name: string
    thumbnail: string
    expressions: string[]
    animations: string[]
  }>
  
  // Playback state (for preview)
  currentNodeId: string | null
  playbackHistory: string[]
  playbackVariables: Record<string, any>
  
  // Actions
  addNode: (type: NodeType, position: { x: number; y: number }) => void
  updateNode: (nodeId: string, data: Partial<NodeData>) => void
  deleteNode: (nodeId: string) => void
  connectNodes: (sourceId: string, targetId: string) => void
  disconnectNodes: (connectionId: string) => void
  
  importCharacter: (characterId: string) => Promise<void>
  
  startPreview: (startNodeId?: string) => void
  exitPreview: () => void
  navigateToNode: (nodeId: string) => void
  makeChoice: (choiceId: string) => void
  goBack: () => void
  
  exportToHTML: () => Promise<Blob>
  exportToJSON: () => string
  saveProject: () => void
  loadProject: (projectId: string) => void
}
```

---

## 🎨 UI/UX Design Philosophy

### Match Existing Studios
- **Same color scheme:** Slate/cyan from Dashboard/Raster/Vector
- **Same layout:** Toolbar top, panels left/right, canvas center
- **Same interactions:** Keyboard shortcuts (Ctrl+Z, Delete, etc.)
- **Same feedback:** Toast notifications, loading states, auto-save indicator

### Story-Specific Design
- **Node appearance:**
  - Rounded corners (16px)
  - Color-coded by type (Start=green, Dialogue=blue, Choice=purple, Branch=orange, End=red)
  - Icon + label (e.g., 💬 Dialogue, 🔀 Choice)
  - Input/output ports (circles on left/right edges)
  - Hover states (glow effect)
  
- **Connections:**
  - Bezier curves (smooth, animated)
  - Arrow heads on target end
  - Color matches source node
  - Dashed line for false/fallback paths
  
- **Inspector panel:**
  - Tabbed interface (Properties, Preview, Variables)
  - Markdown-enabled text editor (with formatting toolbar)
  - Character picker with thumbnail previews
  - Expression/animation dropdowns (populate from character data)

---

## 🔗 Character Studio Integration

### Import Flow
1. User clicks "Import Character" in Story Builder
2. Modal shows all saved characters from Character Studio
3. Select character → imports:
   - Thumbnail image
   - Available expressions (if rigged)
   - Available animations (if recorded)
4. Character appears in "Imported Characters" panel
5. Can be selected in any Dialogue Node

### Character Data Structure
```typescript
interface ImportedCharacter {
  id: string // From Character Studio
  name: string
  thumbnail: string // Base64 or URL
  
  // From Character Studio export
  expressions: Array<{
    name: string
    morphState: Record<string, number>
  }>
  
  animations: Array<{
    name: string
    duration: number
    spineData?: any // If exported as Spine JSON
  }>
}
```

### Display in Dialogue
- Character thumbnail shown in dialogue box
- Expression changes morph state (if available)
- Animations play in preview mode (using Pixi.js + Spine)

---

## 📁 File Structure

```
src/
  pages/
    StoryBuilder.tsx           # Main page (canvas + panels)
  
  components/
    story/
      StoryCanvas.tsx          # React Flow canvas wrapper
      NodePalette.tsx          # Left sidebar with draggable node types
      NodeInspector.tsx        # Right sidebar for editing selected node
      StoryPreview.tsx         # Preview mode player
      CharacterPicker.tsx      # Character import modal
      ExportModal.tsx          # Export settings & download
      
      nodes/
        StartNode.tsx          # Custom node component
        DialogueNode.tsx       # Custom node component
        ChoiceNode.tsx         # Custom node component
        BranchNode.tsx         # Custom node component
        VariableNode.tsx       # Custom node component
        EndNode.tsx            # Custom node component
  
  store/
    storyStore.ts              # Zustand state management
  
  types/
    story.ts                   # TypeScript interfaces
  
  utils/
    storyExporter.ts           # Export to HTML5
    storyPlayer.ts             # Vanilla JS player engine (for export)
    storyValidator.ts          # Check for orphaned nodes, missing connections
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal:** Node editor works, can add/delete/connect nodes

**Tasks:**
1. Install React Flow: `npm install reactflow`
2. Create `StoryBuilder.tsx` page
3. Create `storyStore.ts` with basic state
4. Create custom node components (basic rendering)
5. Implement node palette (drag to add)
6. Implement connections (drag from port to port)
7. Add keyboard shortcuts (Delete, Ctrl+Z)
8. Add minimap and controls

**Deliverable:** Node editor canvas where you can create a simple flow

---

### Phase 2: Dialogue System (Week 2-3)
**Goal:** Can create dialogue nodes with text and character portraits

**Tasks:**
1. Create `NodeInspector.tsx` (right sidebar)
2. Implement text editor (textarea with markdown toolbar)
3. Create `CharacterPicker.tsx` modal
4. Implement character import from Character Studio
5. Add expression selector
6. Add background image picker
7. Update dialogue node to show character thumbnail

**Deliverable:** Can build a linear story with character dialogue

---

### Phase 3: Branching & Logic (Week 3)
**Goal:** Choices and conditional branching

**Tasks:**
1. Implement Choice Node editor (dynamic choice list)
2. Implement Branch Node (condition input)
3. Implement Variable Node (key/value/operation)
4. Add variable inspector (see all story variables)
5. Add validation (warn about orphaned nodes)

**Deliverable:** Can create branching narratives with choices

---

### Phase 4: Preview & Playback (Week 3-4)
**Goal:** Can play story in preview mode

**Tasks:**
1. Create `StoryPreview.tsx` (visual novel player UI)
2. Implement graph traversal (follow connections)
3. Render dialogue with character portraits
4. Render choice buttons
5. Implement variable tracking
6. Add history/back button
7. Add exit to editor

**Deliverable:** Can play and test story flow

---

### Phase 5: Export System (Week 4)
**Goal:** Can export to standalone HTML5

**Tasks:**
1. Create `storyPlayer.ts` (vanilla JS engine)
2. Create `storyExporter.ts` (bundle to HTML)
3. Implement export modal with settings
4. Embed character images as base64
5. Generate single .html file
6. Test exported stories work standalone

**Deliverable:** Can export and share playable stories

---

## 🎯 Success Criteria (MVP)

### Must Have ✅
- [ ] Node editor with 6 node types
- [ ] Can create, edit, delete, connect nodes
- [ ] Dialogue nodes support character portraits
- [ ] Choice nodes support 2-4 options
- [ ] Preview mode plays story from start
- [ ] Export to HTML5 works
- [ ] Can import characters from Character Studio
- [ ] Variables track player state
- [ ] Undo/redo works
- [ ] Auto-save to localStorage

### Nice to Have 🎁
- [ ] Auto-layout (organize messy nodes)
- [ ] Node search/filter
- [ ] Duplicate nodes
- [ ] Copy/paste between projects
- [ ] Export to Yarn/Ink format (interop)
- [ ] Audio support (voice lines, music)
- [ ] Animated backgrounds
- [ ] Screen shake/effects
- [ ] Achievement system

### Future Enhancements 🔮
- [ ] Multiplayer stories (branching paths for 2+ players)
- [ ] AI dialogue generation (GPT-4 suggests responses)
- [ ] Voice cloning integration (characters speak in custom voices)
- [ ] Localization system (translate stories)
- [ ] Analytics dashboard (track player choices)
- [ ] Collaborative editing (real-time co-authoring)

---

## 📊 Technical Decisions

### Why React Flow?
- **Pros:**
  - Battle-tested node editor library
  - Handles zoom/pan/connections out of box
  - Customizable node components
  - Good performance (virtual rendering)
  - TypeScript support
- **Cons:**
  - Adds 100KB to bundle
  - Learning curve for custom nodes
- **Alternatives:**
  - Rete.js (heavier, more complex)
  - Custom canvas (weeks of work)
  - **Decision:** Use React Flow for MVP

### Export Strategy
- **Standalone HTML5:** Single file, works offline, no server needed
- **Embedded engine:** Vanilla JS player (no React in export)
- **Character assets:** Base64 encode images (simplicity over file size)
- **Future:** Could offer "optimized export" (separate assets folder)

### Character Animation in Preview
- **MVP:** Static character portraits (thumbnail from Character Studio)
- **v1.1:** Animate expressions (morph between states)
- **v1.2:** Play recorded animations (Pixi.js + Spine integration)

---

## 🧪 Testing Strategy

### Unit Tests
- Store actions (addNode, connectNodes, etc.)
- Graph traversal (findNextNode, evaluateCondition)
- Export logic (generateHTML, embedAssets)

### Integration Tests
- Full flow: Create story → Preview → Export → Open HTML
- Character import flow
- Variable persistence across nodes

### Manual Testing
- Create sample stories (linear, branching, complex)
- Test on different screen sizes
- Test exported HTML in different browsers
- Performance test (1000+ nodes)

---

## 📝 Documentation Plan

### User Documentation
1. **Getting Started** - Create your first story (5-minute tutorial)
2. **Node Types Reference** - Detailed docs for each node type
3. **Character Integration** - Import and use characters from Character Studio
4. **Variables & Logic** - Conditional branching guide
5. **Export Guide** - Publish your story
6. **Examples Gallery** - Sample stories with source files

### Developer Documentation
1. **Architecture Overview** - How Story Builder works internally
2. **State Management** - storyStore.ts deep dive
3. **Custom Nodes** - How to add new node types
4. **Export Format** - HTML5 bundle structure
5. **Character Protocol** - How character data flows between studios

---

## 🎉 Launch Plan

### Beta (Week 5)
- Invite 100 beta testers from Discord
- Collect feedback on UX/bugs
- Iterate on inspector panel design
- Add most-requested features

### MVP Launch (Week 6)
- Publish Story Builder to production
- Update Dashboard to enable Story button
- Write launch blog post
- Share on Reddit (r/gamedev, r/visualnovels)
- Demo video on YouTube

### Post-Launch (Week 7+)
- Monitor analytics (which node types used most?)
- Add most-requested features
- Create tutorial video series
- Build example story library
- Integrate with Character Studio face tracking (live performance mode)

---

## 💡 Inspiration & References

### Similar Tools (Learn From)
- **Twine** - Open source interactive fiction tool (node-based)
- **Yarn Spinner** - Unity narrative engine (simple syntax)
- **Ink** - Inkle Studios' scripting language (elegant conditionals)
- **Ren'Py** - Visual novel engine (Python-based)
- **Chat Mapper** - Professional dialogue tree editor ($$$)

### What Makes Us Different
- **Integrated Characters** - Use animated characters from Character Studio
- **Free & Unlimited** - No node limits, no watermarks
- **Web-Native** - No install, works in browser
- **Export to Web** - Shareable HTML5, not just game engine formats
- **Modern UI** - Tailwind design, not 2010-era gray boxes

---

## 🚀 Let's Build This!

Story Builder completes the "4 studios" vision:
1. **Raster Studio** - Frame-by-frame animation ✅
2. **Vector Studio** - Motion graphics ✅
3. **Character Studio** - Rigging & performance ✅
4. **Story Builder** - Interactive narratives 🚧

**Next Step:** Create the foundation files and start Phase 1.

Ready to implement? 🎬

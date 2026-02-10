# Archived Planning Documents

**Archived Date:** February 9, 2026  
**Reason:** Consolidated into [MASTER_PLAN.md](../MASTER_PLAN.md) and [TECHNICAL_ROADMAP.md](../TECHNICAL_ROADMAP.md)

---

## 📦 What's in This Archive

These 10 planning documents represent the evolution of GenAI Galaxy Animate from initial concept to current consolidated plan. They contain ~7,000 lines total with significant redundancy and some outdated material.

**Do not use these for current development.** Instead, refer to:
- [MASTER_PLAN.md](../MASTER_PLAN.md) - Complete business & product plan
- [TECHNICAL_ROADMAP.md](../TECHNICAL_ROADMAP.md) - Implementation guide

---

## 📚 Archive Contents

### plans.md (OUTDATED - Not Relevant)
**Original Concept:** Generic animation library (like GSAP/Anime.js)  
**Status:** ❌ Completely superseded by character creator focus  
**Historical Value:** Shows initial direction before pivot  

**Content:**
- Module structure for animation engine
- Easing functions, transforms, property animations
- Path animations, spring physics
- API examples for generic animations

**Why Archived:** Project pivoted to character creation suite, not generic animation library

---

### plans2.md
**Concept:** First character creator proposal  
**Date:** Early iteration  
**Status:** ⚠️ Foundation for current plan  

**Content:**
- Character workflow (5 steps: Import → Rig → Control → Record → Export)
- UI layout mockup
- Data structures (Character, Bone, Layer)
- Phases 1-5 implementation outline
- Integration with other studios

**Historical Value:** Established core character creator concept

---

### plans3.md
**Concept:** RPG-inspired character customization  
**Innovation:** Template system + shape morphing  
**Status:** ✅ Core ideas adopted into current plan  

**Content:**
- Base character templates (like Skyrim character creator)
- Customization layers (sliders + asset swapping)
- Shape morphing system ("morph nodes")
- Procedural generation (randomize, blend templates)
- Morph panel UI design

**Historical Value:** Introduced template-first approach and morphing system (now in TECHNICAL_ROADMAP.md)

---

### plans4.md
**Concept:** Technical implementation - asset integration  
**Status:** ✅ Merged into TECHNICAL_ROADMAP.md  

**Content:**
- Morph UI panel design
- Asset browser & swapping system
- Color customization
- Expression & mouth shape management
- Randomization & procedural generation
- Character preview & testing

**Historical Value:** Detailed UI/UX specifications for morphing and assets

---

### plans5.md
**Concept:** Deep technical dive - rigging & tracking  
**Status:** ✅ Merged into TECHNICAL_ROADMAP.md  

**Content:**
- Morph system architecture (MorphTarget interface)
- Bone hierarchy (17 bones - industry standard)
- Auto-rig from MediaPipe Pose
- 2-bone IK solver implementation
- Face tracking with Kalman filter
- 20 ARKit blend shapes (simplified)
- Performance recording system with compression

**Historical Value:** Most detailed technical specifications, foundation for current roadmap

---

### plans6.md
**Concept:** Workflow & export system  
**Status:** ✅ Merged into TECHNICAL_ROADMAP.md  

**Content:**
- Phase 8: Save, export & integration
- Export formats (.genai-char, PNG, SVG, PSD, GIF, MP4, Spine JSON)
- Technology stack decisions (Konva vs Pixi vs vector libraries)
- User flow summary
- UI/UX mockups
- Development timeline (8 weeks)
- Success metrics

**Historical Value:** Established export requirements and workflow integration

---

### plans7.md
**Concept:** Community features & revenue  
**Status:** ✅ Merged into MASTER_PLAN.md (marketplace section)  

**Content:**
- Phase 5: Universal export system (Spine JSON deep dive)
- Phase 6: Community & polish
- Template marketplace (70/30 split proposal)
- Revenue model (template sales, Pro subscription, asset packs)
- Implementation checklist

**Historical Value:** First revenue/marketplace discussion

---

### plans8.md
**Concept:** DaVinci Resolve model + ethical pricing  
**Innovation:** "Creator liberation" philosophy  
**Status:** ✅ Core philosophy adopted into MASTER_PLAN.md  

**Content:**
- DaVinci Resolve pricing comparison
- "Unlike Adobe" marketing page
- Free-first mindset
- Feature priority (free vs paid)
- Transparent revenue projections
- Open source philosophy
- Educational programs

**Historical Value:** Established anti-Adobe positioning and ethical business model

---

### plans9.md
**Concept:** 4-tier pricing system (initial version)  
**Status:** ✅ Refined and merged into MASTER_PLAN.md  

**Content:**
- Free, Creator, Pro, Ultra tiers
- Detailed feature comparison table
- AI credit system (500/month for Pro, unlimited for Ultra)
- Cloud storage tiers (10GB/50GB/Unlimited)
- Collaboration limits (2/5/Unlimited users)
- Support levels
- One-time vs monthly pricing options

**Historical Value:** Established 4-tier structure (improved in final plan)

---

### plans10.md
**Concept:** Pricing refinement + marketing  
**Status:** ✅ Final pricing version in MASTER_PLAN.md  

**Content:**
- 4-tier pricing with payment option comparison
- Tier naming analysis (Creator vs Plus, etc.)
- Revenue projections (Year 1 & Year 3)
- Special programs (educational, non-profit, beta tester)
- Upgrade incentives (clear value props per tier)
- Break-even analysis (10 months for one-time vs monthly)

**Historical Value:** Final pricing numbers and marketing copy

---

## 🔄 Evolution Summary

```
┌─────────────────────────────────────────────────────────┐
│ plans.md (OUTDATED)                                     │
│ Generic animation library → ❌ Scrapped                 │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ plans2.md                                               │
│ Character creator concept → ✅ Foundation               │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ plans3.md                                               │
│ Template system + morphing → ✅ Core innovation         │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ plans4-5 (Technical Deep Dive)                          │
│ Rigging, tracking, morphing details → ✅ Roadmap        │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ plans6-7 (Workflow & Community)                         │
│ Export system, marketplace → ✅ Product features        │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ plans8 (Philosophy Shift)                               │
│ DaVinci Resolve model → ✅ Business strategy            │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ plans9-10 (Pricing Refinement)                          │
│ 4-tier pricing, revenue model → ✅ Final pricing        │
└─────────────────────────────────────────────────────────┘
                      ↓
          ┌───────────────────────┐
          │   CONSOLIDATED INTO   │
          ├───────────────────────┤
          │ MASTER_PLAN.md        │ ← Business & Product
          │ TECHNICAL_ROADMAP.md  │ ← Implementation
          └───────────────────────┘
```

---

## 📊 Consolidation Statistics

**Original Documents:** 10 files  
**Total Lines:** ~7,000 lines  
**Redundancy:** ~60% (especially pricing, competitive analysis)  

**Consolidated Documents:** 2 files  
**Total Lines:** ~2,000 lines  
**Improvement:** 70% reduction while keeping all essential information  

**What Was Eliminated:**
- Duplicate pricing discussions (3 documents with minor variations)
- Multiple competitive analysis sections (same competitors, same conclusions)
- Redundant technical specifications (scattered morph/rig details)
- Outdated generic animation library concept
- Conflicting revenue projections

**What Was Preserved:**
- All unique technical specifications
- Latest pricing model (4-tier with payment options)
- DaVinci Resolve philosophy
- Template system design
- Morphing system architecture
- Face tracking integration details
- Export format specifications
- Marketplace & revenue model
- Educational programs
- Marketing strategy

---

## 🎯 Why Keep This Archive?

1. **Historical Context** - Shows evolution of product thinking
2. **Backup Reference** - In case we need to revisit old ideas
3. **Design Rationale** - Explains why certain decisions were made
4. **Team Onboarding** - New members can see thought process
5. **Audit Trail** - Documents decision-making timeline

---

## ⚠️ Important Notes

**DO NOT:**
- ❌ Use these for active development
- ❌ Update these files
- ❌ Reference in new documentation
- ❌ Copy pricing/features from here (may be outdated)

**DO:**
- ✅ Reference [MASTER_PLAN.md](../MASTER_PLAN.md) for current business plan
- ✅ Reference [TECHNICAL_ROADMAP.md](../TECHNICAL_ROADMAP.md) for implementation
- ✅ Use archive for historical context only
- ✅ Cite archive when explaining past decisions

---

## 🔍 Quick Search Guide

**Looking for...** | **Found in Archive** | **Current Location**
---|---|---
Original animation library concept | plans.md | ❌ Scrapped - not in current plan
Character creator workflow | plans2.md | MASTER_PLAN.md (Studio 4)
Template system | plans3.md | MASTER_PLAN.md + TECHNICAL_ROADMAP.md Phase 1
Morphing system | plans3-5 | TECHNICAL_ROADMAP.md Phase 2
Rigging & bones | plans5 | TECHNICAL_ROADMAP.md Phase 3
Face tracking | plans5 | TECHNICAL_ROADMAP.md Phase 5
Export formats | plans6-7 | TECHNICAL_ROADMAP.md Phase 6
Marketplace | plans7 | MASTER_PLAN.md (Revenue Streams)
DaVinci philosophy | plans8 | MASTER_PLAN.md (Core Philosophy)
4-tier pricing | plans9-10 | MASTER_PLAN.md (Pricing Strategy)
Revenue projections | plans8-10 | MASTER_PLAN.md (Revenue Streams)

---

## 📝 Lessons Learned

### What Worked:
- ✅ Iterative planning (10 documents = 10 refinements)
- ✅ Technical depth before coding
- ✅ Competitive analysis drove differentiation
- ✅ User-first thinking (30s to animation goal)

### What Could Be Improved:
- ⚠️ Too much redundancy (consolidate earlier next time)
- ⚠️ Conflicting pricing (settle on model sooner)
- ⚠️ Scattered technical specs (organize by phase from start)
- ⚠️ One outdated document (plans.md) lingered too long

### Applied to Next Project:
- Start with Master Plan template
- Update single doc instead of creating plan2, plan3, etc.
- Use version control (Git) instead of numbered files
- Consolidate every 3-4 major revisions

---

**For current documentation, return to [docs/README.md](../README.md)**

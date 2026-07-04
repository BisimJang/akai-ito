# Chalk

> Real-time AI tutoring on a live whiteboard. Not a chatbot — a tutor that writes, highlights, circles, and explains as it teaches.

---

## What it is

Chalk is a standalone prototype for a visual AI tutoring experience. The tutor streams its explanation onto a whiteboard in real time — text appears word by word, key terms get highlighted, concepts get circled and connected with arrows. Students can pause mid-lesson, rewind to any point, or interrupt with a question.

This prototype isolates the interaction design before it's integrated into Studyverse (`wagmi-dapp`).

---

## How it works

The session feels like sitting with a tutor at a physical whiteboard:

- **The tutor writes as it speaks.** Text streams onto the board character by character, with a chalk-on-blackboard animation.
- **It annotates visually.** Highlights, underlines, circles, and arrows appear over the content as the explanation progresses — triggered by the AI, or by the student clicking a term.
- **You can interrupt at any point.** Pause, rewind to a previous moment, ask a follow-up, or change the pacing. The tutor adapts and continues.

---

## Components

### Whiteboard
Scrollable content area where the lesson renders. Supports rich text (bold, italic, headings, code blocks) and inline annotations. All content is persistent — scroll up to review anything.

### Streaming engine
Word-by-word text reveal with a writing animation. Supports pause, resume, rewind, and speed control. Designed as an imperative JS class — no framework dependency.

### Annotation layer
SVG overlay that sits above the whiteboard. The AI (or student) can trigger:
- **Highlight** — background color on a text range
- **Underline** — decorative underline on a key term
- **Circle** — SVG ellipse drawn around an element
- **Arrow** — connector between two concepts

### Playback controls
Pause · Resume · Rewind · Speed (0.5× – 3×) · Ask (interrupt with a question)

### Student interaction
Click any highlighted term to request elaboration. Select any text range to ask the tutor to go deeper. Voice input planned for a later milestone.

---

## Stack

| Layer | Choice | Reason |
|---|---|---|
| App | Vite + Vanilla JS | Streaming and SVG overlays are imperative — no virtual DOM needed |
| Annotations | SVG overlay | Direct control over circles, arrows, ellipses |
| Animation | CSS + JS | Character-by-character reveal without framework overhead |
| Data | Mock lessons | No backend required to prototype the core UX |
| Later | `http://localhost:8001/v1/chat` | Wire once the interaction feels right |

---

## File structure

```
chalk/
├── index.html          entry point
├── style.css           whiteboard and animation styles
└── src/
    ├── main.js         app bootstrap
    ├── board.js        whiteboard canvas
    ├── stream.js       streaming text engine
    ├── annotate.js     highlight, circle, underline, arrow
    ├── controls.js     pause, rewind, speed
    └── mock-data.js    sample lessons for prototyping
```

---

## Integration (when ready)

1. Copy `src/` into `wagmi-dapp/src/components/Chalk/`
2. Wire streaming engine to the AI tutor endpoint
3. Pass auth token from Studyverse's `useAuth` hook
4. Trigger the session from the course lesson view

---

## Status

Planning — README written, starting prototype.
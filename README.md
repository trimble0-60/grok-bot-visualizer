# Grok Bot Visualizer

A local viewer for how a team of bots hands work to a person and to each other. The canvas shows a trigger, each bot as its own glyph, outlined results, and dashed early exits. A person approves where a human has to act.

Nothing is hosted, and there is no sign-in. The sample workflows are examples. Replace them with your own.

## Run

```bash
npm install && npm run dev
```

Open the URL Vite prints, usually [http://localhost:5173](http://localhost:5173).

The page is readable around 1280px wide. Drag to pan, use the zoom and fit controls at the bottom right, and click a step for its detail.

To check that the app compiles:

```bash
npm run build
```

## One HTML file

`npm run build:single` writes one self-contained page to `dist-single/index.html`. JavaScript, CSS, the workflow JSON, the font, and the avatar PNGs are all in that file. It does not request other files, so it can run with no network and inside an iframe.

To serve it from Google Apps Script:

1. Create an Apps Script project at [script.google.com](https://script.google.com).
2. Replace `Code.gs` with:

```javascript
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index').setXFrameOptionsMode(
    HtmlService.XFrameOptionsMode.ALLOWALL,
  );
}
```

`ALLOWALL` lets the page be shown in an iframe, which is how Apps Script serves a web app.

3. Add an HTML file named `index`. Paste the full contents of `dist-single/index.html` into it.
4. Deploy → New deployment → type Web app.
   - Execute as: **Me**
   - Who has access: anyone in your domain, or whoever you choose
5. Open the web app URL.

## What's on screen

- **Top bar.** A round logo, the title Visualizer, a back button, a workflow menu, and a static `Run: As written` control.
- **Bot row.** Each bot in the workflow, plus each person listed in `people`.
- **Legend.** Bot, Output, Early exit, Starts, Uses a tool, then Always (solid), Only when (dashed), and Asks and waits (curved). Hover a line to highlight it.
- **Summary card.** Title, a count, a short description, a Tools count, and View more.
- **Graph.** Edges are thin, with streaming dots, arrowheads, and pill labels. Dots stay still when the browser asks for reduced motion.

## Add a workflow

1. Add a JSON file in [`workflows/`](workflows/). The picker loads every `*.json` file there, in filename order.
2. Restart `npm run dev` if the new file does not appear.
3. Point each bot `avatar` at a file in `public/avatars/`, or add your own PNG there.

Do not put secrets or private customer data in a workflow file.

### Sample avatars

| Role in the samples | id | avatar | color |
| --- | --- | --- | --- |
| Chief of Staff | `chief-of-staff` | `/avatars/chief.png` | `#55B5A3` |
| Research | `research` | `/avatars/research.png` | `#59BE77` |
| Scout | `scout` | `/avatars/scout.png` | `#EC7332` |
| Inbox | `inbox` | `/avatars/intake.png` | `#996E42` |
| Coordinator | `coordinator` | `/avatars/event.png` | `#885CF1` |
| Writer | `writer` | `/avatars/content.png` | `#59BE77` |

People are not bots. Add them under `people` and use their id in `owners`. The app draws a person glyph. The samples use Alex, an approver.

`icon` is the tiny role mark in the bot row: `compass`, `book`, `search`, `inbox`, `calendar`, `pen`.

### File shape

```json
{
  "id": "example",
  "title": "Example",
  "description": "One or two sentences on how the bots hand this work across.",
  "people": [
    { "id": "alex", "name": "Alex", "role": "Approver", "color": "#E7C27A" }
  ],
  "bots": [
    {
      "id": "research",
      "name": "Research",
      "color": "#59BE77",
      "avatar": "/avatars/research.png",
      "role": "Writes sourced briefs",
      "icon": "book"
    }
  ],
  "nodes": [
    {
      "id": "start",
      "type": "start",
      "owners": [],
      "title": "A question arrives",
      "summary": "A sourced brief is needed.",
      "steps": ["Open a research pass."],
      "inputs": ["A question"],
      "outputs": ["A research run"],
      "stopsForUser": false,
      "usesTool": false
    }
  ],
  "edges": [
    { "from": "start", "to": "next", "label": "a question", "kind": "always" }
  ]
}
```

Node `type` is `start` (the pill trigger), `task`, `approval`, `output`, `early-exit`, `page`, or `hub`.

`owners` is usually one bot id or one person id. The canvas draws that glyph, the name, and `summary` as the muted line. `usesTool: true` adds the `+` badge. Optional `tools` lists plain-language source categories shown as small pills, such as `Web` and `News and reports`. `stopsForUser: true` on a person's approval.

`summary` on a bot node should be one short line. `steps` should be 2 to 4 short bullets.

Edge `label` is the pill on the arrow. `kind` is `always` (solid), `only-when` (dashed), or `asks-and-waits` (curved loop). Edges into an early exit are also curved. Dots travel in the sender's color.

Set `"direction": "TB"` for a top-down tree. Leave it unset for a left-to-right flow. Set `"direction": "HUB"` for columns of triggers, bots, one hub tile, and page tiles. Page and hub nodes use `icon`, `cadence`, what’s on the page in `steps`, who updates it in `inputs`, and what gets signed off in `outputs`. Optional `summaryCount` replaces the generated count. Optional `appearsIn` lists the workflows that person or bot shows up in.

## Sample workflows

1. The team (opens first)
2. Research brief
3. Outreach note
4. Status board

# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary and only user: the author's mother, an adult beginner in resistance training.
She trains alone at a commercial gym, twice a week, following a fixed A/B full-body
ficha prescribed with a professor. Her job during a session is narrow and repetitive:
find the next exercise, remember what weight she used last time, do the set, record
weight and reps, move on. She reads comfortably at normal adult type sizes (confirmed).

Secondary: the author, who edits the JSON content by hand in a text editor and commits
it. He is not a user of the interface.

## Product Purpose

Replace the paper sheet and the "how do I do this one again?" moment. The site must
(1) tell her exactly what to do today, (2) show her how each exercise is performed
safely, and (3) capture what she actually did with as little fiddling as possible.
Success is that she opens it every session and finishes the session without the app
ever getting in her way.

## Positioning

Not a general fitness tracker. It is one person's prescribed ficha, authored by
someone who knows her, with the safety notes and the "para que serve" written for her
specific life (getting off the sofa, off the toilet, out of the car without help).
No accounts, no social, no plans, no upsell. The content is versioned in git and edited
by hand; there is no admin UI and there will not be one.

## Operating Context

- **Device:** her phone, held in one hand, in a gym. Confirmed as the only use scene.
  Desktop is a courtesy layout for the author, not a designed surface.
- **Network:** gym wifi drops constantly. The app is local-first: every write lands in
  localStorage first and enters a queue flushed to the server when a connection exists.
  The app must never block on the network.
- **Hands:** possibly sweaty, possibly mid-set. Touch targets and recording actions must
  tolerate imprecision.
- **Rhythm:** 6 exercises per treino, 2-3 sets each, 1 to 2.5 minutes of rest between
  sets (long on the compound lifts, by prescription). She interacts in short bursts and
  locks the screen between them.

## Capabilities and Constraints

- Static frontend (`public/`) served by a ~4-route `node:http` server. **No build step,
  no npm install, no framework.** Node 22.5+ for the embedded SQLite.
- Vanilla ES modules, no bundler. Anything shipped must run as-is from the file.
- Content lives in versioned JSON: `data/exercicios.json` (catalogue: instructions,
  safety notes, muscles, YouTube id) and `data/fichas/*.json` (prescription: sets, reps,
  rest). The ficha references the catalogue by id.
- Session records go to SQLite. A day's session is created implicitly by the first set
  marked done — there is deliberately no "start workout" button.
- Auth is a token in the URL (`/?k=...`) saved to the home screen. No login screen.
- Conflict resolution is last-write-wins by timestamp, applied identically on both sides.
- Language is Brazilian Portuguese throughout.
- YouTube embeds are created lazily, only when the exercise's details are opened —
  12 simultaneous iframes would stall the phone and burn her mobile data.

## Brand Commitments

None. No name, logo, palette or typeface was ever committed. The interface is titled
simply "Treino".

## Evidence on Hand

- 12 real exercises with real instructions, safety notes and purpose text, written for
  this user (`public/data/exercicios.json`).
- One real ficha, A/B full body. Sets, reps, rest, warm-up and the training rules
  (`comoTreinar`) are derived from `docs/Treino Feminino Baseado Em Evidências.md`,
  a research report on resistance training for post-menopausal women — not guesses.
- **Absent and not to be invented:** the YouTube video ids are all `null`. Nothing may
  claim a video exists. No history data, no photos of the user, no testimonials.

## Product Principles

1. **Recording must cost less than remembering.** Any interaction that makes her think
   about the app instead of the set has failed.
2. **The device is the source of truth; the server is a backup.** Never block, never
   spin, never lose a value to a dropped connection.
3. **Content is authored, not configured.** New exercises and fichas arrive as JSON in
   a commit. No interface will ever be built to edit them.
4. **Say why, not just what.** Every exercise carries its purpose and its safety notes
   because she is training alone and nobody is watching her form.
5. **One person's app.** No generality that costs her a tap.

## Accessibility & Inclusion

Standard comfortable legibility (confirmed — she does not need enlarged type).
Touch-first: real targets, no hover-only affordances, no precision gestures.
Every custom control must remain reachable by keyboard and announce its value, and
motion must respect `prefers-reduced-motion`.

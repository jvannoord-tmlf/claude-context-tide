# context-tide

A Claude Code mod (desktop/mobile) that paints a translucent tide across the
bottom of the app and fills it as your context window fills. It reads the live
context percentage after every turn and redraws the backdrop, so the water line
rises as the session grows and the color shifts from calm blue to amber past
60% and to red past 85%. It is a quiet, at-a-glance signal that you are getting
close to auto-compact. For the exact figure, the status line reads
`tide N%` and updates after every turn.

The motion is a slow drifting wave at the water line, drawn at low opacity so
the conversation stays readable, and it holds still when the system is set to
reduce motion.

## How it works

- `session.start` registers the backdrop scene and seeds the current level.
- `session.measure` (fires after each turn) reads `$.session.usage()` and writes
  the context percentage into session state and onto the status line
  (`tide N%`).
- A `ui.render` hook on the `Backdrop` component draws the tide from that state,
  so the fill updates whenever the level changes.

Only the `desktop` and `mobile` surfaces draw a backdrop; on a terminal it does
nothing.

## Install

In the desktop app (where `/plugin` is not a command): click the **+** next to
the prompt box, choose **Plugins**, **Add marketplace** with
`jvannoord-tmlf/claude-context-tide`, then **Add plugin** and pick
`context-tide`.

At a terminal session prompt:

```
/plugin install context-tide --marketplace jvannoord-tmlf/claude-context-tide
```

From a shell:

```
claude plugin install context-tide --marketplace jvannoord-tmlf/claude-context-tide
```

This repository is private: installing it works only for GitHub accounts invited
to the repo whose machine already holds a git credential for github.com (an SSH
key, or `gh auth login` followed by `gh auth setup-git`). The install never
prompts for one.

## Tuning

Everything is in `hooks/register.tsx`. The `scene()` function holds the colors,
the 60/85 thresholds, the fill opacity, and the wave shape; edit it and the mod
hot-reloads.

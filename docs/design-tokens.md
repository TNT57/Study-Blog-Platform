# Design tokens: from the canvas to the code

The [Claude Design canvas](https://claude.ai/artifact/5yqJ2ZRvBvbeVYDgq4ccMC) style guide is the source of truth.
This page shows where each design value lives in the code (`src/app/globals.css`) and which Tailwind class uses it.

Some names are different in the design and in the code, because shadcn/ui and Tailwind already use some names.
The tables below are the "translation dictionary".

## Colors

| Design name | Hex                 | CSS variable                                      | Tailwind class               | Used for                         |
| ----------- | ------------------- | ------------------------------------------------- | ---------------------------- | -------------------------------- |
| Ink         | `#14161A`           | `--foreground`                                    | `text-foreground`            | Text, headings                   |
| Muted       | `#5B6270`           | `--muted-foreground`                              | `text-muted-foreground`      | Secondary text (6.1:1)           |
| Paper       | `#F7F8FA`           | `--background`                                    | `bg-background`              | Page background                  |
| Surface     | `#FFFFFF`           | `--card`                                          | `bg-card`                    | Cards, inputs                    |
| Border      | `#E3E6EB`           | `--border`                                        | `border-border`              | Lines and dividers only          |
| Input line  | `#878E9B`           | `--input`                                         | `border-input`               | Input borders (3.3:1)            |
| Focus       | `#2F5BEA`           | `--primary`                                       | `bg-primary`, `text-primary` | Main buttons, links, focus timer |
| Focus dark  | `#1F44C4`           | `--primary-hover`                                 | `hover:bg-primary-hover`     | Hover on main buttons (7.8:1)    |
| Focus soft  | `#EAF0FF`           | `--focus-soft`                                    | `bg-focus-soft`              | Badges, selected rows            |
| Focus ring  | `#2F5BEA`, 2px      | `--ring`                                          | `outline-ring` (automatic)   | Keyboard focus (5.5:1)           |
| Break       | `#B45309`           | `--break`                                         | `bg-break`, `text-break`     | Break timer                      |
| Danger      | `#B42318`           | `--destructive`                                   | `bg-destructive`             | Delete, errors                   |
| Success     | `#157F3C`           | `--success`                                       | `text-success`               | "Saved" messages                 |
| Soft colors | `#FEF3E2` and so on | `--break-soft`, `--danger-soft`, `--success-soft` | `bg-break-soft` and so on    | Badge backgrounds                |
| Skeleton    | `#E9ECF0`           | `--skeleton`                                      | `bg-skeleton`                | Loading placeholders             |

Why two grays for lines? WCAG says the border of an **input** must have 3:1 contrast, so people can see where to type.
`#E3E6EB` is only 1.25:1, so it is for decoration (dividers, card edges) only.

## Text sizes

| Design name | Size / line height | Tailwind class                   |
| ----------- | ------------------ | -------------------------------- |
| Display     | 40 / 48, 600       | `text-display`                   |
| Heading 1   | 32 / 40, 600       | `text-h1`                        |
| Heading 2   | 24 / 32, 600       | `text-h2`                        |
| Heading 3   | 18 / 28, 600       | `text-h3`                        |
| Reading     | 17 / 30            | `text-reading`                   |
| Body        | 16 / 26            | `text-body`                      |
| Label       | 15 / 20            | `text-label`                     |
| Small       | 14 / 20            | `text-small`                     |
| Caption     | 13 / 16            | `text-caption`                   |
| Timer       | 96 (72 on phones)  | `text-timer`, `text-timer-phone` |

These names are also listed in `src/lib/utils.ts`, so `cn()` knows they are sizes, not colors.
**If you add a new text size, add it in both places.**

## Corner radius

| Design name | Size | Tailwind class                                  | Used for        |
| ----------- | ---- | ----------------------------------------------- | --------------- |
| sm          | 6px  | `rounded-sm`                                    | Badges          |
| md          | 8px  | `rounded-lg` (shadcn's default) or `rounded-md` | Buttons, inputs |
| lg          | 12px | `rounded-xl`                                    | Cards           |
| full        | pill | `rounded-full`                                  | Avatars, chips  |

All of them are calculated from one value, `--radius: 0.5rem` (8px). Change it, and every corner changes together.

## Widths and sizes

| Design value         | Tailwind class                   |
| -------------------- | -------------------------------- |
| Content width 1120px | `max-w-content`                  |
| Reading width 720px  | `max-w-reading`                  |
| Touch target 44px    | `h-11` (Button `size="default"`) |
| Large button 48px    | `h-12` (Button `size="lg"`)      |

## Buttons

| Design name | Code                             |
| ----------- | -------------------------------- |
| Primary     | `<Button>`                       |
| Secondary   | `<Button variant="outline">`     |
| Ghost       | `<Button variant="ghost">`       |
| Danger      | `<Button variant="destructive">` |

# Reverse_wordle

Static reverse Wordle for GitHub Pages.
https://bluemoon012905.github.io/Reverse_wordle/

## Pages

- `index.html`: level selector with 100 puzzle cards
- `level.html`: puzzle page where you fill a full board with 2 to 6 rows

## Puzzle Rules

- Each puzzle shows only color rows
- Fill every row with valid five-letter English words
- The bottom row must evaluate to all green against itself
- A board is valid when every row matches the shown colors against the bottom row
- The 100 levels are spread across board heights from 2 rows to 6 rows
- Levels can have many valid solutions, and found solutions are saved locally in the browser

## Deploy

Push this repo to GitHub and enable GitHub Pages from the default branch root. No build step is needed.

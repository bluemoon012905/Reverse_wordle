import fs from "node:fs";

const SOURCE_PATH = "/tmp/words_alpha.txt";
const OUTPUT_PATH = new URL("../levels.js", import.meta.url);
const PUZZLE_COUNT = 100;
const MIN_TOTAL_ROWS = 2;
const MAX_TOTAL_ROWS = 6;
const TARGETS_BY_TOTAL_ROWS = new Map(
  Array.from({ length: MAX_TOTAL_ROWS - MIN_TOTAL_ROWS + 1 }, function (_, index) {
    return [MIN_TOTAL_ROWS + index, PUZZLE_COUNT / (MAX_TOTAL_ROWS - MIN_TOTAL_ROWS + 1)];
  })
);

function createRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const random = createRng(20260403);

function pick(array) {
  return array[Math.floor(random() * array.length)];
}

function shuffle(array) {
  for (let index = array.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const value = array[index];
    array[index] = array[swapIndex];
    array[swapIndex] = value;
  }

  return array;
}

function evaluateGuess(guess, answer) {
  const result = Array(guess.length).fill("0");
  const answerChars = answer.split("");

  for (let index = 0; index < guess.length; index += 1) {
    if (guess[index] === answer[index]) {
      result[index] = "2";
      answerChars[index] = null;
    }
  }

  for (let index = 0; index < guess.length; index += 1) {
    if (result[index] !== "0") {
      continue;
    }

    const matchIndex = answerChars.indexOf(guess[index]);
    if (matchIndex !== -1) {
      result[index] = "1";
      answerChars[matchIndex] = null;
    }
  }

  return result.join("");
}

function getLetterCounts(word) {
  const counts = Object.create(null);

  for (const letter of word) {
    counts[letter] = (counts[letter] || 0) + 1;
  }

  return counts;
}

function buildHardModeState(guesses, patterns) {
  const fixed = Array(5).fill(null);
  const bannedPositions = Object.create(null);
  const minCounts = Object.create(null);
  const maxCounts = Object.create(null);

  guesses.forEach(function (guess, rowIndex) {
    const pattern = patterns[rowIndex];
    const nonGrayCounts = Object.create(null);
    const grayLetters = new Set();

    for (let index = 0; index < guess.length; index += 1) {
      const letter = guess[index];
      const color = pattern[index];

      if (color === "2") {
        fixed[index] = letter;
        nonGrayCounts[letter] = (nonGrayCounts[letter] || 0) + 1;
      } else if (color === "1") {
        if (!bannedPositions[letter]) {
          bannedPositions[letter] = new Set();
        }
        bannedPositions[letter].add(index);
        nonGrayCounts[letter] = (nonGrayCounts[letter] || 0) + 1;
      } else {
        grayLetters.add(letter);
      }
    }

    Object.keys(nonGrayCounts).forEach(function (letter) {
      minCounts[letter] = Math.max(minCounts[letter] || 0, nonGrayCounts[letter]);
    });

    grayLetters.forEach(function (letter) {
      const count = nonGrayCounts[letter] || 0;

      if (count === 0) {
        maxCounts[letter] = 0;
      } else {
        maxCounts[letter] = Math.min(
          maxCounts[letter] === undefined ? Number.POSITIVE_INFINITY : maxCounts[letter],
          count
        );
      }
    });
  });

  return {
    fixed: fixed,
    bannedPositions: bannedPositions,
    minCounts: minCounts,
    maxCounts: maxCounts
  };
}

function isHardModeLegal(guess, state) {
  const counts = getLetterCounts(guess);

  for (let index = 0; index < guess.length; index += 1) {
    const fixedLetter = state.fixed[index];
    if (fixedLetter && guess[index] !== fixedLetter) {
      return false;
    }

    const banned = state.bannedPositions[guess[index]];
    if (banned && banned.has(index)) {
      return false;
    }
  }

  Object.keys(state.minCounts).forEach(function (letter) {
    if ((counts[letter] || 0) < state.minCounts[letter]) {
      counts.__invalid = true;
    }
  });

  if (counts.__invalid) {
    return false;
  }

  return !Object.keys(state.maxCounts).some(function (letter) {
    return (counts[letter] || 0) > state.maxCounts[letter];
  });
}

function boardRespectsHardMode(rows, answer) {
  const guesses = [];
  const patterns = [];

  for (let index = 0; index < rows.length - 1; index += 1) {
    if (index > 0) {
      const state = buildHardModeState(guesses, patterns);
      if (!isHardModeLegal(rows[index], state)) {
        return false;
      }
    }

    guesses.push(rows[index]);
    patterns.push(evaluateGuess(rows[index], answer));
  }

  if (rows.length > 1) {
    const finalState = buildHardModeState(guesses, patterns);
    if (!isHardModeLegal(answer, finalState)) {
      return false;
    }
  }

  return true;
}

function loadWords() {
  return [...new Set(
    fs.readFileSync(SOURCE_PATH, "utf8")
      .split(/\r?\n/)
      .map(function (word) {
        return word.trim().toLowerCase();
      })
      .filter(function (word) {
        return word.length === 5 && /^[a-z]+$/.test(word);
      })
  )].sort();
}

function findSolutionRows(patterns, candidateAnswer, words) {
  const matches = Array(patterns.length).fill(null);

  for (const word of words) {
    const pattern = evaluateGuess(word, candidateAnswer);

    for (let index = 0; index < patterns.length; index += 1) {
      if (matches[index] === null && pattern === patterns[index]) {
        matches[index] = word;
      }
    }

    if (matches.every(Boolean)) {
      return matches;
    }
  }

  return null;
}

function getPatternStats(pattern) {
  const counts = { green: 0, yellow: 0, gray: 0 };

  for (const value of pattern) {
    if (value === "2") {
      counts.green += 1;
    } else if (value === "1") {
      counts.yellow += 1;
    } else {
      counts.gray += 1;
    }
  }

  return counts;
}

function isComplexEnough(patterns) {
  let score = 0;
  let richRows = 0;
  let mixedRows = 0;

  for (const pattern of patterns) {
    const stats = getPatternStats(pattern);
    const nonGray = stats.green + stats.yellow;

    if (nonGray === 0 || nonGray === 5) {
      return false;
    }

    if (nonGray >= 3) {
      richRows += 1;
    }

    if (stats.green > 0 && stats.yellow > 0) {
      mixedRows += 1;
    }

    score += nonGray;
    score += stats.green;
    if (stats.green > 0 && stats.yellow > 0) {
      score += 2;
    }
    if (stats.gray > 0 && nonGray > 0) {
      score += 1;
    }
  }

  return (
    score >= (patterns.length * 5) + 1 &&
    richRows >= Math.max(1, Math.floor(patterns.length / 2)) &&
    mixedRows >= Math.max(1, patterns.length - 2)
  );
}

function createPuzzle(sourceAnswer, sourceClues, words) {
  const patterns = sourceClues.map(function (guess) {
    return evaluateGuess(guess, sourceAnswer);
  });

  if (!isComplexEnough(patterns)) {
    return null;
  }

  const candidateAnswers = shuffle(words.slice());
  const discovered = [];
  const seenBoards = new Set();

  for (const candidateAnswer of candidateAnswers) {
    const rows = findSolutionRows(patterns, candidateAnswer, words);

    if (!rows) {
      continue;
    }

    const boardRows = rows.concat(candidateAnswer);
    const key = boardRows.join("|");

    if (seenBoards.has(key)) {
      continue;
    }

    seenBoards.add(key);
    discovered.push(boardRows);

    if (discovered.length >= 3) {
      break;
    }
  }

  if (discovered.length < 3) {
    return null;
  }

  return {
    rows: patterns.concat("22222"),
    seed: discovered[0]
  };
}

function buildPuzzles(words) {
  const puzzles = [];
  const seenPatterns = new Set();
  const totals = new Map(TARGETS_BY_TOTAL_ROWS);
  let attempts = 0;

  while (puzzles.length < PUZZLE_COUNT && attempts < 250000) {
    attempts += 1;
    const totalRows = pick(
      Array.from(totals.entries())
        .filter(function (entry) {
          return entry[1] > 0;
        })
        .map(function (entry) {
          return entry[0];
        })
    );
    const clueRows = totalRows - 1;

    const answer = pick(words);
    const clues = [];

    while (clues.length < clueRows) {
      const candidate = pick(words);
      if (candidate !== answer && !clues.includes(candidate)) {
        clues.push(candidate);
      }
    }

    const puzzle = createPuzzle(answer, clues, words);
    if (!puzzle) {
      continue;
    }

    const key = puzzle.rows.join("|");
    if (seenPatterns.has(key)) {
      continue;
    }

    seenPatterns.add(key);
    puzzles.push(puzzle);
    totals.set(totalRows, totals.get(totalRows) - 1);
  }

  if (puzzles.length !== PUZZLE_COUNT) {
    throw new Error("Unable to generate enough multi-solution puzzles.");
  }

  return puzzles;
}

function toColorPattern(pattern) {
  return pattern.split("").map(function (value) {
    if (value === "2") {
      return "green";
    }

    if (value === "1") {
      return "yellow";
    }

    return "gray";
  });
}

const words = loadWords();
const puzzles = buildPuzzles(words).sort(function (left, right) {
  return left.rows.length - right.rows.length;
}).map(function (puzzle) {
  return {
    totalRows: puzzle.rows.length,
    rows: puzzle.rows.map(toColorPattern),
    seed: puzzle.seed
  };
});

  const output = `(function () {
  const WORDS = ${JSON.stringify(words)};

  const PUZZLES = ${JSON.stringify(puzzles, null, 2)};

  function evaluateGuess(guess, answer) {
    const result = Array(guess.length).fill("gray");
    const answerChars = answer.split("");

    for (let index = 0; index < guess.length; index += 1) {
      if (guess[index] === answer[index]) {
        result[index] = "green";
        answerChars[index] = null;
      }
    }

    for (let index = 0; index < guess.length; index += 1) {
      if (result[index] !== "gray") {
        continue;
      }

      const matchIndex = answerChars.indexOf(guess[index]);
      if (matchIndex !== -1) {
        result[index] = "yellow";
        answerChars[matchIndex] = null;
      }
    }

    return result;
  }

  function getLetterCounts(word) {
    const counts = Object.create(null);

    for (const letter of word) {
      counts[letter] = (counts[letter] || 0) + 1;
    }

    return counts;
  }

  function buildHardModeState(guesses, patterns) {
    const fixed = Array(5).fill(null);
    const bannedPositions = Object.create(null);
    const minCounts = Object.create(null);
    const maxCounts = Object.create(null);

    guesses.forEach(function (guess, rowIndex) {
      const pattern = patterns[rowIndex];
      const nonGrayCounts = Object.create(null);
      const grayLetters = new Set();

      for (let index = 0; index < guess.length; index += 1) {
        const letter = guess[index];
        const color = pattern[index];

        if (color === "green") {
          fixed[index] = letter;
          nonGrayCounts[letter] = (nonGrayCounts[letter] || 0) + 1;
        } else if (color === "yellow") {
          if (!bannedPositions[letter]) {
            bannedPositions[letter] = new Set();
          }
          bannedPositions[letter].add(index);
          nonGrayCounts[letter] = (nonGrayCounts[letter] || 0) + 1;
        } else {
          grayLetters.add(letter);
        }
      }

      Object.keys(nonGrayCounts).forEach(function (letter) {
        minCounts[letter] = Math.max(minCounts[letter] || 0, nonGrayCounts[letter]);
      });

      grayLetters.forEach(function (letter) {
        const count = nonGrayCounts[letter] || 0;

        if (count === 0) {
          maxCounts[letter] = 0;
        } else {
          maxCounts[letter] = Math.min(
            maxCounts[letter] === undefined ? Number.POSITIVE_INFINITY : maxCounts[letter],
            count
          );
        }
      });
    });

    return {
      fixed: fixed,
      bannedPositions: bannedPositions,
      minCounts: minCounts,
      maxCounts: maxCounts
    };
  }

  function isHardModeLegal(guess, state) {
    const counts = getLetterCounts(guess);

    for (let index = 0; index < guess.length; index += 1) {
      const fixedLetter = state.fixed[index];
      if (fixedLetter && guess[index] !== fixedLetter) {
        return false;
      }

      const banned = state.bannedPositions[guess[index]];
      if (banned && banned.has(index)) {
        return false;
      }
    }

    const failsMinimum = Object.keys(state.minCounts).some(function (letter) {
      return (counts[letter] || 0) < state.minCounts[letter];
    });

    if (failsMinimum) {
      return false;
    }

    return !Object.keys(state.maxCounts).some(function (letter) {
      return (counts[letter] || 0) > state.maxCounts[letter];
    });
  }

  function getSolvedLevels() {
    try {
      return JSON.parse(localStorage.getItem("reverse-wordle-solved") || "[]");
    } catch (error) {
      return [];
    }
  }

  function saveSolvedLevel(levelNumber) {
    const current = new Set(getSolvedLevels());
    current.add(levelNumber);
    localStorage.setItem("reverse-wordle-solved", JSON.stringify(Array.from(current).sort(function (a, b) {
      return a - b;
    })));
  }

  function getStoredSolutions(levelNumber) {
    try {
      return JSON.parse(localStorage.getItem("reverse-wordle-solutions-" + levelNumber) || "[]");
    } catch (error) {
      return [];
    }
  }

  function saveStoredSolution(levelNumber, rows) {
    const current = getStoredSolutions(levelNumber);
    const key = rows.join("|");

    if (current.some(function (entry) {
      return entry.key === key;
    })) {
      return false;
    }

    current.push({ key: key, rows: rows });
    localStorage.setItem("reverse-wordle-solutions-" + levelNumber, JSON.stringify(current));
    return true;
  }

  window.ReverseWordle = {
    WORDS: WORDS,
    WORD_SET: new Set(WORDS),
    PUZZLES: PUZZLES,
    evaluateGuess: evaluateGuess,
    buildHardModeState: buildHardModeState,
    isHardModeLegal: isHardModeLegal,
    getSolvedLevels: getSolvedLevels,
    saveSolvedLevel: saveSolvedLevel,
    getStoredSolutions: getStoredSolutions,
    saveStoredSolution: saveStoredSolution
  };
}());
`;

fs.writeFileSync(OUTPUT_PATH, output);
console.log(JSON.stringify({ words: words.length, puzzles: puzzles.length, totalsByRows: Object.fromEntries(TARGETS_BY_TOTAL_ROWS) }, null, 2));

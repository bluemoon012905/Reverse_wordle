(function () {
  const game = window.ReverseWordle;

  if (!game) {
    return;
  }

  const bodyPage = document.body.dataset.page;

  function createSquare(color, large) {
    const square = document.createElement("div");
    square.className = "square " + color + (large ? " big" : "");
    return square;
  }

  function createSquares(pattern, large) {
    const row = document.createElement("div");
    row.className = "squares";

    pattern.forEach(function (color) {
      row.appendChild(createSquare(color, large));
    });

    return row;
  }

  function getLevelNumber() {
    const params = new URLSearchParams(window.location.search);
    const levelNumber = Number(params.get("level"));

    if (!Number.isInteger(levelNumber) || levelNumber < 1 || levelNumber > game.PUZZLES.length) {
      return 1;
    }

    return levelNumber;
  }

  function collectWords(inputsByRow) {
    return inputsByRow.map(function (row) {
      return row.map(function (input) {
        return input.value.toLowerCase();
      }).join("");
    });
  }

  function samePattern(left, right) {
    return left.length === right.length && left.every(function (value, index) {
      return value === right[index];
    });
  }

  function clearInputClasses(input) {
    input.classList.remove("green", "yellow", "gray", "mismatch");
  }

  function getTier(count) {
    if (count >= 10) {
      return { label: "Gold", className: "gold" };
    }

    if (count >= 5) {
      return { label: "Silver", className: "silver" };
    }

    if (count >= 1) {
      return { label: "Bronze", className: "bronze" };
    }

    return { label: "None", className: "" };
  }

  function renderSelectorPage() {
    const levelGrid = document.getElementById("levelGrid");
    const solved = new Set(game.getSolvedLevels());

    game.PUZZLES.forEach(function (puzzle, index) {
      const levelNumber = index + 1;
      const card = document.createElement("a");
      const board = document.createElement("div");
      const label = document.createElement("span");
      const tier = document.createElement("div");
      const solutions = game.getStoredSolutions(levelNumber);
      const tierInfo = getTier(solutions.length);

      card.href = "level.html?level=" + levelNumber;
      card.className = "level-card" + (solved.has(levelNumber) ? " is-solved" : "");
      card.setAttribute("aria-label", "Level " + levelNumber);

      board.className = "mini-board";
      puzzle.rows.forEach(function (row) {
        board.appendChild(createSquares(row, false));
      });

      label.textContent = "Level " + levelNumber;
      tier.className = "tier-badge selector-tier" + (tierInfo.className ? " " + tierInfo.className : "");
      tier.textContent = tierInfo.label;

      card.appendChild(board);
      card.appendChild(label);
      card.appendChild(tier);
      levelGrid.appendChild(card);
    });
  }

  function renderStoredSolutions(levelNumber) {
    const solutionCount = document.getElementById("solutionCount");
    const tierBadge = document.getElementById("tierBadge");
    const solutionList = document.getElementById("solutionList");
    const solutions = game.getStoredSolutions(levelNumber);
    const tierInfo = getTier(solutions.length);

    solutionCount.textContent = String(solutions.length);
    tierBadge.className = "tier-badge" + (tierInfo.className ? " " + tierInfo.className : "");
    tierBadge.textContent = tierInfo.label;
    solutionList.innerHTML = "";

    if (!solutions.length) {
      const empty = document.createElement("p");
      empty.className = "solution-empty";
      empty.textContent = "No valid solutions saved yet.";
      solutionList.appendChild(empty);
      return;
    }

    solutions.forEach(function (entry) {
      const item = document.createElement("article");
      item.className = "solution-card";

      entry.rows.forEach(function (row) {
        const line = document.createElement("div");
        line.className = "solution-row";
        line.textContent = row.toUpperCase();
        item.appendChild(line);
      });

      solutionList.appendChild(item);
    });
  }

  function renderLevelPage() {
    const levelNumber = getLevelNumber();
    const puzzle = game.PUZZLES[levelNumber - 1];
    const clueBoard = document.getElementById("clueBoard");
    const levelLabel = document.getElementById("levelNumber");
    const form = document.getElementById("answerForm");
    const checkButton = document.getElementById("checkBoardButton");
    const statusText = document.getElementById("statusText");
    const nextLink = document.getElementById("nextLink");
    const inputBoard = document.getElementById("inputBoard");
    const inputs = [];
    const rowEntries = [];

    function setCheckButtonState(state) {
      checkButton.classList.remove("is-success", "is-failure");
      if (state) {
        checkButton.classList.add(state);
      }
    }

    function triggerFailureFeedback() {
      setCheckButtonState(null);
      void checkButton.offsetWidth;
      setCheckButtonState("is-failure");
    }

    function launchConfetti() {
      const layer = document.createElement("div");
      const colors = ["#6aaa64", "#c9b458", "#edf1f5", "#cd7f32", "#aeb8c2"];

      layer.className = "confetti-layer";

      for (let index = 0; index < 28; index += 1) {
        const piece = document.createElement("div");
        piece.className = "confetti-piece";
        piece.style.left = Math.random() * 100 + "vw";
        piece.style.background = colors[index % colors.length];
        piece.style.animationDuration = (2.1 + Math.random() * 1.2) + "s";
        piece.style.animationDelay = (Math.random() * 0.16) + "s";
        piece.style.setProperty("--drift", ((Math.random() * 140) - 70) + "px");
        layer.appendChild(piece);
      }

      document.body.appendChild(layer);
      window.setTimeout(function () {
        layer.remove();
      }, 3600);
    }

    levelLabel.textContent = "Level " + levelNumber;

    puzzle.rows.forEach(function (row) {
      const boardRow = document.createElement("div");
      boardRow.className = "clue-row clue-only";
      boardRow.appendChild(createSquares(row, true));
      clueBoard.appendChild(boardRow);
    });

    puzzle.rows.forEach(function (_, rowIndex) {
      const rowInputs = [];
      const rowWrap = document.createElement("div");
      const row = document.createElement("div");
      const status = document.createElement("div");

      rowWrap.className = "input-row";
      row.className = "letter-slots";
      status.className = "row-status";
      status.textContent = "Valid word: -";

      for (let columnIndex = 0; columnIndex < 5; columnIndex += 1) {
        const input = document.createElement("input");
        input.className = "letter-slot";
        input.type = "text";
        input.inputMode = "text";
        input.maxLength = 1;
        input.autocomplete = "off";
        input.setAttribute("aria-label", "Row " + (rowIndex + 1) + " letter " + (columnIndex + 1));

        input.addEventListener("input", function () {
          input.value = input.value.replace(/[^a-zA-Z]/g, "").slice(0, 1).toUpperCase();
          setCheckButtonState(null);
          if (input.value) {
            const next = inputs[(rowIndex * 5) + columnIndex + 1];
            if (next) {
              next.focus();
            }
          }
          updateBoardState();
        });

        input.addEventListener("keydown", function (event) {
          if (event.key === "Backspace" && !input.value) {
            const previous = inputs[(rowIndex * 5) + columnIndex - 1];
            if (previous) {
              previous.focus();
            }
          }
        });

        rowInputs.push(input);
        inputs.push(input);
        row.appendChild(input);
      }

      rowWrap.appendChild(row);
      rowWrap.appendChild(status);
      inputBoard.appendChild(rowWrap);
      rowEntries.push({ inputs: rowInputs, status: status });
    });

    function updateBoardState() {
      const words = rowEntries.map(function (entry) {
        return entry.inputs.map(function (input) {
          return input.value.toLowerCase();
        }).join("");
      });
      const answer = words[words.length - 1];
      const answerReady = answer.length === 5 && game.WORD_SET.has(answer);
      const priorGuesses = [];
      const priorPatterns = [];

      rowEntries.forEach(function (entry, rowIndex) {
        const word = words[rowIndex];
        const isComplete = word.length === 5;
        const isValidWord = isComplete && game.WORD_SET.has(word);
        const targetPattern = puzzle.rows[rowIndex];
        const actualPattern = answerReady ? game.evaluateGuess(word, answer) : null;
        const hardModeReady = answerReady && rowIndex > 0;
        const hardModeLegal = hardModeReady && isValidWord
          ? game.isHardModeLegal(word, game.buildHardModeState(priorGuesses, priorPatterns))
          : true;

        entry.status.className = "row-status";

        if (!isComplete) {
          entry.status.textContent = "Valid word: -";
        } else if (isValidWord && hardModeReady && !hardModeLegal) {
          entry.status.textContent = "Valid word: yes, hard mode: no";
          entry.status.classList.add("bad");
        } else if (isValidWord) {
          entry.status.textContent = hardModeReady ? "Valid word: yes, hard mode: yes" : "Valid word: yes";
          entry.status.classList.add("ok");
        } else {
          entry.status.textContent = "Valid word: no";
          entry.status.classList.add("bad");
        }

        entry.inputs.forEach(function (input, columnIndex) {
          clearInputClasses(input);

          if (!input.value) {
            return;
          }

          if (!answerReady || !isComplete) {
            return;
          }

          input.classList.add(actualPattern[columnIndex]);
          if (actualPattern[columnIndex] !== targetPattern[columnIndex]) {
            input.classList.add("mismatch");
          } else if (!hardModeLegal) {
            input.classList.add("mismatch");
          }
        });

        if (answerReady && isValidWord) {
          priorGuesses.push(word);
          priorPatterns.push(actualPattern);
        }
      });
    }

    renderStoredSolutions(levelNumber);
    updateBoardState();

    form.addEventListener("submit", function (event) {
      const words = collectWords(
        rowEntries.map(function (entry) {
          return entry.inputs;
        })
      );
      const answer = words[words.length - 1];

      event.preventDefault();
      setCheckButtonState(null);

      if (words.some(function (word) { return word.length !== 5; })) {
        statusText.textContent = "Fill every square first.";
        triggerFailureFeedback();
        return;
      }

      if (words.some(function (word) { return !game.WORD_SET.has(word); })) {
        statusText.textContent = "Every row must be a valid five-letter English word.";
        triggerFailureFeedback();
        return;
      }

      const hardModeGuesses = [];
      const hardModePatterns = [];

      for (let index = puzzle.rows.length - 1; index >= 0; index -= 1) {
        const actualPattern = game.evaluateGuess(words[index], answer);
        if (!samePattern(actualPattern, puzzle.rows[index])) {
          statusText.textContent = "That board does not match the clue pattern.";
          updateBoardState();
          triggerFailureFeedback();
          return;
        }
      }

      for (let index = 0; index < words.length; index += 1) {
        if (index > 0) {
          const state = game.buildHardModeState(hardModeGuesses, hardModePatterns);
          if (!game.isHardModeLegal(words[index], state)) {
            statusText.textContent = "That board breaks Wordle hard mode.";
            updateBoardState();
            triggerFailureFeedback();
            return;
          }
        }

        hardModeGuesses.push(words[index]);
        hardModePatterns.push(game.evaluateGuess(words[index], answer));
      }

      if (game.saveStoredSolution(levelNumber, words)) {
        statusText.textContent = "Valid solution saved.";
        setCheckButtonState("is-success");
        launchConfetti();
      } else {
        statusText.textContent = "Valid, but you already saved that solution.";
        setCheckButtonState("is-success");
      }

      game.saveSolvedLevel(levelNumber);
      renderStoredSolutions(levelNumber);

      if (levelNumber < game.PUZZLES.length) {
        nextLink.href = "level.html?level=" + (levelNumber + 1);
        nextLink.textContent = "Next level";
      } else {
        nextLink.href = "index.html";
        nextLink.textContent = "Back to levels";
      }
      nextLink.classList.remove("hidden");
    });

    if (inputs[0]) {
      inputs[0].focus();
    }
  }

  if (bodyPage === "selector") {
    renderSelectorPage();
  }

  if (bodyPage === "level") {
    renderLevelPage();
  }
}());

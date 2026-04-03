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

    if (!Number.isInteger(levelNumber) || levelNumber < 1 || levelNumber > game.LEVELS.length) {
      return 1;
    }

    return levelNumber;
  }

  function renderSelectorPage() {
    const levelGrid = document.getElementById("levelGrid");
    const solved = new Set(game.getSolvedLevels());

    game.LEVELS.forEach(function (answer, index) {
      const levelNumber = index + 1;
      const card = document.createElement("a");
      const board = document.createElement("div");
      const label = document.createElement("span");
      const clues = game.getClues(answer);

      card.href = "level.html?level=" + levelNumber;
      card.className = "level-card" + (solved.has(levelNumber) ? " is-solved" : "");
      card.setAttribute("aria-label", "Level " + levelNumber);

      board.className = "mini-board";
      clues.forEach(function (clue) {
        board.appendChild(createSquares(clue.pattern, false));
      });

      label.textContent = "Level " + levelNumber;

      card.appendChild(board);
      card.appendChild(label);
      levelGrid.appendChild(card);
    });
  }

  function renderLevelPage() {
    const levelNumber = getLevelNumber();
    const answer = game.LEVELS[levelNumber - 1];
    const clues = game.getClues(answer);
    const clueBoard = document.getElementById("clueBoard");
    const levelLabel = document.getElementById("levelNumber");
    const form = document.getElementById("answerForm");
    const statusText = document.getElementById("statusText");
    const nextLink = document.getElementById("nextLink");
    const letterSlots = document.getElementById("letterSlots");
    const inputs = [];

    levelLabel.textContent = "Level " + levelNumber;

    clues.forEach(function (clue) {
      const row = document.createElement("div");
      const guessWord = document.createElement("div");

      row.className = "clue-row";
      guessWord.className = "guess-word";
      guessWord.textContent = clue.guess;

      row.appendChild(guessWord);
      row.appendChild(createSquares(clue.pattern, true));
      clueBoard.appendChild(row);
    });

    for (let index = 0; index < 5; index += 1) {
      const input = document.createElement("input");
      input.className = "letter-slot";
      input.type = "text";
      input.inputMode = "text";
      input.maxLength = 1;
      input.autocomplete = "off";
      input.setAttribute("aria-label", "Letter " + (index + 1));

      input.addEventListener("input", function () {
        input.value = input.value.replace(/[^a-zA-Z]/g, "").slice(0, 1).toUpperCase();
        if (input.value && index < 4) {
          inputs[index + 1].focus();
        }
      });

      input.addEventListener("keydown", function (event) {
        if (event.key === "Backspace" && !input.value && index > 0) {
          inputs[index - 1].focus();
        }
      });

      inputs.push(input);
      letterSlots.appendChild(input);
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const guess = inputs.map(function (input) {
        return input.value.toLowerCase();
      }).join("");

      if (guess.length !== 5) {
        statusText.textContent = "Enter all five letters.";
        return;
      }

      if (guess === answer) {
        game.saveSolvedLevel(levelNumber);
        statusText.textContent = "Correct.";
        if (levelNumber < game.LEVELS.length) {
          nextLink.href = "level.html?level=" + (levelNumber + 1);
          nextLink.textContent = "Next level";
        } else {
          nextLink.href = "index.html";
          nextLink.textContent = "Back to levels";
        }
        nextLink.classList.remove("hidden");
        return;
      }

      statusText.textContent = "Not the word.";
    });

    inputs[0].focus();
  }

  if (bodyPage === "selector") {
    renderSelectorPage();
  }

  if (bodyPage === "level") {
    renderLevelPage();
  }
}());

(function () {
  const STARTER_GUESSES = ["chair", "empty", "false", "bound"];

  const LEVELS = [
    "about", "above", "abuse", "actor", "acute", "admit", "adopt", "adult", "after", "again",
    "agent", "agree", "ahead", "alarm", "album", "alert", "alike", "alive", "allow", "alone",
    "along", "alter", "among", "anger", "angle", "angry", "apart", "apple", "apply", "arena",
    "argue", "arise", "armed", "array", "aside", "asset", "audio", "audit", "avoid", "award",
    "aware", "badly", "baker", "bases", "basic", "basis", "beach", "began", "begin", "begun",
    "being", "below", "bench", "birth", "black", "blame", "blind", "block", "blood", "board",
    "boost", "booth", "bound", "brain", "brand", "bread", "break", "breed", "brief", "bring",
    "broad", "broke", "brown", "build", "built", "buyer", "cable", "calif", "carry", "catch",
    "cause", "chain", "chair", "chart", "chase", "cheap", "check", "chest", "chief", "child",
    "china", "chose", "civil", "claim", "class", "clean", "clear", "click", "clock", "close",
    "coach", "coast", "could", "count", "court", "cover", "craft", "crash", "cream", "crime",
    "cross", "crowd", "crown", "curve", "cycle", "daily", "dance", "dated", "dealt", "death",
    "debut", "delay", "depth", "doing", "doubt", "dozen", "draft", "drama", "drawn", "dream",
    "dress", "drill", "drink", "drive", "drove", "dying", "eager", "early", "earth", "eight",
    "elite", "empty", "enemy", "enjoy", "enter", "entry", "equal", "error", "event", "every",
    "exact", "exist", "extra", "faith", "false", "fault", "fiber", "field", "fifth", "fifty",
    "fight", "final", "first", "fixed", "flash", "fleet", "floor", "fluid", "focus", "force",
    "forth", "forty", "forum", "found", "frame", "frank", "fraud", "fresh", "front", "fruit",
    "fully", "funny", "giant", "given", "glass", "globe", "going", "grace", "grade", "grand",
    "grant", "grass", "great", "green", "gross", "group", "grown", "guard", "guess", "guest",
    "guide", "happy", "harry", "heart", "heavy", "hence", "henry", "horse", "hotel", "house",
    "human", "ideal", "image", "index", "inner", "input", "issue", "japan", "jimmy", "joint",
    "jones", "judge", "known", "label", "large", "laser", "later", "laugh", "layer", "learn",
    "lease", "least", "leave", "legal", "level", "lewis", "light", "limit", "links", "lives",
    "local", "logic", "loose", "lower", "lucky", "lunch", "major", "maker", "march", "maria",
    "match", "maybe", "mayor", "meant", "media", "metal", "might", "minor", "minus", "mixed",
    "model", "money", "month", "moral", "motor", "mount", "mouse", "mouth", "movie", "music",
    "needs", "never", "newly", "night", "noise", "north", "noted", "novel", "nurse", "occur",
    "ocean", "offer", "often", "order", "other", "ought", "paint", "panel", "paper", "party",
    "peace", "peter", "phase", "phone", "photo", "piece", "pilot", "pitch", "place", "plain"
  ];

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

  function getClues(answer) {
    return STARTER_GUESSES.map(function (guess) {
      return {
        guess: guess,
        pattern: evaluateGuess(guess, answer)
      };
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

  window.ReverseWordle = {
    LEVELS: LEVELS,
    STARTER_GUESSES: STARTER_GUESSES,
    getClues: getClues,
    getSolvedLevels: getSolvedLevels,
    saveSolvedLevel: saveSolvedLevel
  };
}());

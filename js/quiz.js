export function initQuiz(app) {
  const state = {
    direction: 'h-to-t', // 'h-to-t' or 't-to-h'
    scope: 'all',        // 'all' or 'favorites'
    questions: [],
    currentIndex: 0,
    score: 0,
    currentStreak: 0,
    maxStreak: 0,
    canAnswer: true
  };

  const encouragingPhrases = [
    "बहुत बढ़िया! (Excellent!)",
    "शानदार! (Fantastic!)",
    "अद्भुत! (Amazing!)",
    "सही जवाब! (Correct!)",
    "लाजवाब! (Excellent!)",
    "वाह! (Wow!)",
    "अति सुंदर! (Very Beautiful / Great!)"
  ];

  // DOM Elements
  const setupPanel = document.getElementById('quiz-setup-panel');
  const gamePanel = document.getElementById('quiz-game-panel');
  const resultsPanel = document.getElementById('quiz-results-panel');

  const startBtn = document.getElementById('start-quiz-btn');
  const restartBtn = document.getElementById('restart-quiz-btn');

  // Active game DOM
  const currentIdxEl = document.getElementById('quiz-current-idx');
  const totalQuestionsEl = document.getElementById('quiz-total-questions');
  const streakCountEl = document.getElementById('quiz-streak-count');
  const progressBar = document.getElementById('quiz-progress-bar');
  const promptLabel = document.getElementById('quiz-prompt-label');
  const questionText = document.getElementById('quiz-question-text');
  const questionPron = document.getElementById('quiz-question-pronunciation');
  const optionsContainer = document.getElementById('quiz-options-container');
  const statusFeedback = document.getElementById('quiz-status-feedback');

  // Results DOM
  const resEmoji = document.getElementById('quiz-result-emoji');
  const resTitle = document.getElementById('quiz-result-title');
  const resFeedback = document.getElementById('quiz-result-feedback');
  const resScore = document.getElementById('quiz-result-score');
  const resTotal = document.getElementById('quiz-result-total');
  const resAccuracy = document.getElementById('quiz-result-accuracy');
  const resMaxStreak = document.getElementById('quiz-result-maxstreak');

  // Tile Selection Interactions
  setupRadioTiles('name', 'quiz-dir', 'tile-dir');
  setupRadioTiles('name', 'quiz-scope', 'tile-scope');

  function setupRadioTiles(attrName, attrVal, idPrefix) {
    const tiles = document.querySelectorAll(`[name="${attrVal}"]`);
    tiles.forEach(radio => {
      const tile = radio.closest('.radio-tile');
      
      // Make entire tile clickable
      tile.addEventListener('click', () => {
        // Unselect others
        document.querySelectorAll(`[name="${attrVal}"]`).forEach(r => {
          r.checked = false;
          r.closest('.radio-tile').classList.remove('selected');
        });
        
        // Select this
        radio.checked = true;
        tile.classList.add('selected');
      });
    });
  }

  // Fisher-Yates Shuffle
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Start Quiz trigger
  startBtn.addEventListener('click', () => {
    // Determine selections
    const selectedDir = document.querySelector('input[name="quiz-dir"]:checked').closest('.radio-tile').dataset.direction;
    const selectedScope = document.querySelector('input[name="quiz-scope"]:checked').closest('.radio-tile').dataset.scope;

    let targetWords = [];
    if (selectedScope === 'favorites') {
      targetWords = app.vocabList.filter(w => app.isFavorite(w.id));
      if (targetWords.length < 4) {
        app.showToast('Please star at least 4 words to start a favorite-only quiz! ⭐');
        return;
      }
    } else {
      targetWords = [...app.vocabList];
    }

    // Initialize state
    state.direction = selectedDir;
    state.scope = selectedScope;
    state.questions = shuffle(targetWords);
    state.currentIndex = 0;
    state.score = 0;
    state.currentStreak = 0;
    state.maxStreak = 0;
    state.canAnswer = true;

    // UI swap
    setupPanel.style.display = 'none';
    resultsPanel.style.display = 'none';
    gamePanel.style.display = 'flex';

    loadNextQuestion();
  });

  // Restart Button
  restartBtn.addEventListener('click', () => {
    resultsPanel.style.display = 'none';
    setupPanel.style.display = 'flex';
  });

  function getTranslationString(word) {
    return word.english ? `${word.malayalam} (${word.english})` : word.malayalam;
  }

  function loadNextQuestion() {
    state.canAnswer = true;
    statusFeedback.textContent = '';
    statusFeedback.className = 'quiz-status-feedback';

    const currentWord = state.questions[state.currentIndex];
    
    // Update stats
    currentIdxEl.textContent = state.currentIndex + 1;
    totalQuestionsEl.textContent = state.questions.length;
    streakCountEl.textContent = `${state.currentStreak} 🔥`;
    
    const progressPercent = (state.currentIndex / state.questions.length) * 100;
    progressBar.style.width = `${progressPercent}%`;

    // Render Question based on direction
    if (state.direction === 'h-to-t') {
      promptLabel.textContent = "Select translation for:";
      questionText.textContent = currentWord.hindi;
      questionText.className = "quiz-question-hindi";
      questionPron.textContent = currentWord.pronunciation;
      questionPron.style.display = 'inline-block';
    } else {
      promptLabel.textContent = "Select Hindi word for:";
      questionText.textContent = currentWord.english ? `${currentWord.malayalam} / ${currentWord.english}` : currentWord.malayalam;
      questionText.className = "quiz-question-lang";
      questionPron.style.display = 'none';
    }

    // Generate options: 1 correct + 3 distractors
    const correctVal = state.direction === 'h-to-t' ? getTranslationString(currentWord) : currentWord.hindi;
    
    // Pick 3 random distractors from ALL words
    const distractors = [];
    const pool = app.vocabList.filter(w => w.id !== currentWord.id);
    shuffle(pool);

    for (let i = 0; i < pool.length && distractors.length < 3; i++) {
      const optionVal = state.direction === 'h-to-t' ? getTranslationString(pool[i]) : pool[i].hindi;
      
      // Ensure unique distractors (avoid duplicates if multiple words translate similarly)
      if (optionVal !== correctVal && !distractors.includes(optionVal)) {
        distractors.push(optionVal);
      }
    }

    // Combined options
    const allOptions = [correctVal, ...distractors];
    shuffle(allOptions);

    // Draw buttons
    optionsContainer.innerHTML = '';
    allOptions.forEach((option) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-btn';
      
      // Layout depending on script font
      if (state.direction === 't-to-h') {
        btn.innerHTML = `<span style="font-family: var(--font-hindi); font-size: 1.3rem;">${option}</span>`;
      } else {
        btn.textContent = option;
      }

      btn.addEventListener('click', () => handleAnswer(btn, option, correctVal));
      optionsContainer.appendChild(btn);
    });
  }

  function handleAnswer(selectedBtn, chosenValue, correctValue) {
    if (!state.canAnswer) return;
    state.canAnswer = false;

    const isCorrect = (chosenValue === correctValue);

    // Highlight correct & incorrect choices
    const optionBtns = optionsContainer.querySelectorAll('.quiz-option-btn');
    optionBtns.forEach(btn => {
      btn.disabled = true;
      const text = btn.textContent.trim();
      const hindiChild = btn.querySelector('span');
      const val = hindiChild ? hindiChild.textContent.trim() : text;
      
      if (val === correctValue) {
        btn.classList.add('correct');
      }
    });

    if (isCorrect) {
      state.score++;
      state.currentStreak++;
      if (state.currentStreak > state.maxStreak) {
        state.maxStreak = state.currentStreak;
      }
      
      // Encouraging toast and sounds
      const phrase = encouragingPhrases[Math.floor(Math.random() * encouragingPhrases.length)];
      statusFeedback.textContent = phrase;
      statusFeedback.classList.add('correct');
      
      // Trigger subtle mini-confetti burst on correct
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 15,
          angle: 60,
          spread: 55,
          origin: { x: 0.1, y: 0.8 }
        });
        confetti({
          particleCount: 15,
          angle: 120,
          spread: 55,
          origin: { x: 0.9, y: 0.8 }
        });
      }
    } else {
      selectedBtn.classList.add('incorrect');
      state.currentStreak = 0;
      statusFeedback.textContent = "गलत जवाब (Wrong answer)";
      statusFeedback.classList.add('incorrect');
    }

    streakCountEl.textContent = `${state.currentStreak} 🔥`;

    // Wait 1.6 seconds, then load next question or finish
    setTimeout(() => {
      state.currentIndex++;
      if (state.currentIndex < state.questions.length) {
        loadNextQuestion();
      } else {
        showResults();
      }
    }, 1600);
  }

  function showResults() {
    gamePanel.style.display = 'none';
    resultsPanel.style.display = 'flex';

    const total = state.questions.length;
    const accuracy = Math.round((state.score / total) * 100);

    resScore.textContent = state.score;
    resTotal.textContent = total;
    resAccuracy.textContent = `${accuracy}%`;
    resMaxStreak.textContent = `${state.maxStreak} 🔥`;

    // Custom feedback details
    if (accuracy === 100) {
      resEmoji.textContent = "🏆";
      resTitle.textContent = "Perfect Score!";
      resFeedback.textContent = "Amazing! You didn't make a single mistake. 🥳";
    } else if (accuracy >= 80) {
      resEmoji.textContent = "🎉";
      resTitle.textContent = "Excellent Job!";
      resFeedback.textContent = "Fantastic! You have a great handle on vocabulary.";
    } else if (accuracy >= 50) {
      resEmoji.textContent = "👍";
      resTitle.textContent = "Good Attempt!";
      resFeedback.textContent = "Nicely done. Keep practicing to get a perfect score!";
    } else {
      resEmoji.textContent = "💪";
      resTitle.textContent = "Keep Practicing!";
      resFeedback.textContent = "Good try! Practice makes perfect. Review cards and try again.";
    }

    // Trigger big Confetti shower
    if (typeof confetti === 'function' && accuracy >= 50) {
      const duration = 2 * 1000;
      const end = Date.now() + duration;

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }
  }

  return {
    state
  };
}

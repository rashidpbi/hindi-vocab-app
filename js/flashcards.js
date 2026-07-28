export function initFlashcards(app) {
  const state = {
    currentIndex: 0,
    shuffledList: [...app.vocabList],
    isShuffled: false,
    direction: app.cardDirection // 'h-to-t' or 't-to-h'
  };

  // DOM Elements
  const wrapper = document.getElementById('vocab-card-wrapper');
  const cardDirectionBtn = document.getElementById('card-direction-btn');
  
  // Front face elements
  const indexFront = document.getElementById('card-index-front');
  const favFront = document.getElementById('favorite-btn-front');
  const labelFront = document.getElementById('card-label-front');
  const wordFront = document.getElementById('card-word-front');
  const pronFront = document.getElementById('card-pronunciation-front');
  const speakFront = document.getElementById('speak-btn-front');

  // Back face elements
  const indexBack = document.getElementById('card-index-back');
  const favBack = document.getElementById('favorite-btn-back');
  const labelBack = document.getElementById('card-label-back');
  const wordBackMalayalam = document.getElementById('card-word-back-malayalam');
  const wordBackEnglish = document.getElementById('card-word-back-english');

  // Controllers
  const prevBtn = document.getElementById('prev-card-btn');
  const randomBtn = document.getElementById('random-card-btn');
  const nextBtn = document.getElementById('next-card-btn');

  // Fisher-Yates Shuffle
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function getActiveWord() {
    return state.shuffledList[state.currentIndex];
  }

  function updateCard() {
    const currentWord = getActiveWord();
    if (!currentWord) return;

    const total = state.shuffledList.length;
    const indexText = `${state.currentIndex + 1} / ${total}`;
    
    // Reset flip status
    wrapper.classList.remove('flipped');

    // Update indexes on both sides
    indexFront.textContent = indexText;
    indexBack.textContent = indexText;

    // Update star button icons
    updateCardFavoriteState();

    if (state.direction === 'h-to-t') {
      // FRONT: Hindi Word
      labelFront.textContent = "Hindi";
      wordFront.textContent = currentWord.hindi;
      wordFront.className = "card-word-hindi";
      pronFront.textContent = currentWord.pronunciation;
      pronFront.style.display = "inline-block";
      speakFront.style.display = "flex";

      // BACK: Meaning (Malayalam / English)
      labelBack.textContent = "Meaning";
      wordBackMalayalam.textContent = currentWord.malayalam;
      wordBackEnglish.textContent = currentWord.english || "";
    } else {
      // FRONT: Meaning (Malayalam / English)
      labelFront.textContent = "Meaning";
      wordFront.textContent = currentWord.malayalam;
      wordFront.className = "card-word-malayalam";
      pronFront.style.display = "none";
      speakFront.style.display = "none";

      // BACK: Hindi Word
      labelBack.textContent = "Hindi";
      wordBackMalayalam.textContent = currentWord.hindi;
      wordBackMalayalam.className = "card-word-hindi";
      wordBackEnglish.textContent = currentWord.pronunciation;
      wordBackEnglish.className = "card-pronunciation";
    }
  }

  function updateCardFavoriteState() {
    const currentWord = getActiveWord();
    if (!currentWord) return;
    
    const isFav = app.isFavorite(currentWord.id);
    if (isFav) {
      favFront.classList.add('active');
      favBack.classList.add('active');
    } else {
      favFront.classList.remove('active');
      favBack.classList.remove('active');
    }
  }

  // --- Event Listeners ---

  // Card Flip Click
  wrapper.addEventListener('click', (e) => {
    // Avoid flipping when clicking action buttons (favorite, speak)
    if (e.target.closest('.favorite-btn') || e.target.closest('.speak-btn')) {
      return;
    }
    wrapper.classList.toggle('flipped');
  });

  // Favorite toggles
  favFront.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentWord = getActiveWord();
    app.toggleFavorite(currentWord.id);
  });

  favBack.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentWord = getActiveWord();
    app.toggleFavorite(currentWord.id);
  });

  // TTS audio trigger
  speakFront.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentWord = getActiveWord();
    app.speakHindi(currentWord.hindi);
  });

  // Next & Prev card sliders
  nextBtn.addEventListener('click', () => {
    state.currentIndex = (state.currentIndex + 1) % state.shuffledList.length;
    updateCard();
  });

  prevBtn.addEventListener('click', () => {
    state.currentIndex = (state.currentIndex - 1 + state.shuffledList.length) % state.shuffledList.length;
    updateCard();
  });

  // Shuffle toggle
  randomBtn.addEventListener('click', () => {
    if (state.isShuffled) {
      // Revert to original order
      state.shuffledList = [...app.vocabList];
      state.isShuffled = false;
      app.showToast("Ordered sequence restored");
    } else {
      shuffleArray(state.shuffledList);
      state.isShuffled = true;
      app.showToast("Deck shuffled! 🔀");
    }
    state.currentIndex = 0;
    updateCard();
  });

  // Direction Switcher
  cardDirectionBtn.addEventListener('click', () => {
    if (state.direction === 'h-to-t') {
      state.direction = 't-to-h';
      cardDirectionBtn.textContent = 'Translation → Hindi';
    } else {
      state.direction = 'h-to-t';
      cardDirectionBtn.textContent = 'Hindi → Translation';
    }
    app.cardDirection = state.direction;
    localStorage.setItem('card_direction', state.direction);
    updateCard();
  });

  // First draw
  updateCard();

  return {
    updateCard,
    updateCardFavoriteState,
    state
  };
}

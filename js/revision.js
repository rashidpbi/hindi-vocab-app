export function initRevision(app) {
  const state = {
    searchQuery: '',
    filterStarredOnly: false,
    sortMode: 'original', // 'original', 'alpha', 'random'
    showMeanings: true,
    randomizedList: []
  };

  const encouragingHindiQuotes = [
    '"मेहनत का फल मीठा होता है।" (The fruit of hard work is sweet.)',
    '"कोशिश करने वालों की कभी हार नहीं होती।" (Those who try never lose.)',
    '"धीरे-धीरे रे मना, धीरे सब कुछ होय।" (Slowly, slowly, oh mind, everything happens in due time.)',
    '"ज्ञान ही शक्ति है।" (Knowledge is power.)',
    '"एक नया दिन, एक नई शुरुआत।" (A new day, a new beginning.)',
    '"सीखना कभी बंद न करें।" (Never stop learning.)'
  ];

  // DOM Elements
  const searchInput = document.getElementById('revision-search');
  const filterAllChip = document.getElementById('chip-filter-all');
  const filterStarredChip = document.getElementById('chip-filter-starred');
  const sortModeChip = document.getElementById('chip-sort-mode');
  const toggleMeaningsChip = document.getElementById('chip-toggle-meanings');
  const bannerText = document.getElementById('revision-banner-text');
  const wordListContainer = document.getElementById('revision-word-list');
  const emptyState = document.getElementById('revision-empty-state');

  // Set initial random randomizedList for sorting
  state.randomizedList = [...app.vocabList];

  // Pick random quote
  rotateQuote();

  function rotateQuote() {
    const randomQuote = encouragingHindiQuotes[Math.floor(Math.random() * encouragingHindiQuotes.length)];
    bannerText.textContent = randomQuote;
  }

  function getSortedList() {
    let list = [...app.vocabList];

    // Filter starred if active
    if (state.filterStarredOnly) {
      list = list.filter(w => app.isFavorite(w.id));
    }

    // Filter by search query
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter(w => 
        w.hindi.toLowerCase().includes(q) || 
        w.pronunciation.toLowerCase().includes(q) || 
        w.malayalam.toLowerCase().includes(q) || 
        (w.english && w.english.toLowerCase().includes(q))
      );
    }

    // Apply Sorting Mode
    if (state.sortMode === 'alpha') {
      // Sort alphabetically by Hindi script
      list.sort((a, b) => a.hindi.localeCompare(b.hindi, 'hi'));
    } else if (state.sortMode === 'random') {
      // Keep alignment with randomizedList but filter down
      const ids = new Set(list.map(w => w.id));
      list = state.randomizedList.filter(w => ids.has(w.id));
    }

    return list;
  }

  function render() {
    const activeList = getSortedList();
    wordListContainer.innerHTML = '';

    if (activeList.length === 0) {
      emptyState.style.display = 'flex';
      return;
    }
    emptyState.style.display = 'none';

    activeList.forEach((word) => {
      const isFav = app.isFavorite(word.id);
      
      const row = document.createElement('div');
      row.className = 'word-row';
      row.dataset.id = word.id;

      row.innerHTML = `
        <div class="word-row-left">
          <span class="word-row-num">#${word.id}</span>
          <div class="word-row-details">
            <div class="word-row-hindi-group">
              <span class="word-row-hindi">${word.hindi}</span>
              <span class="word-row-pronunciation">${word.pronunciation}</span>
            </div>
            <div class="word-row-meanings ${state.showMeanings ? '' : 'hidden'}" id="meanings-${word.id}">
              <span class="word-row-malayalam">${word.malayalam}</span>
              ${word.english ? `<span class="word-row-english">${word.english}</span>` : ''}
            </div>
          </div>
        </div>
        
        <div class="word-row-actions">
          <button class="word-row-btn speak-row-btn" aria-label="Pronounce">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          </button>
          <button class="word-row-btn fav-row-btn ${isFav ? 'favorited' : ''}" aria-label="Favorite">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          </button>
        </div>
      `;

      // Event handlers on row actions
      const speakBtn = row.querySelector('.speak-row-btn');
      speakBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        app.speakHindi(word.hindi);
      });

      const favBtn = row.querySelector('.fav-row-btn');
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        app.toggleFavorite(word.id);
      });

      // Clicking row toggles individual meaning visibility if globally hidden
      row.addEventListener('click', () => {
        if (!state.showMeanings) {
          const meaningsContainer = row.querySelector(`.word-row-meanings`);
          meaningsContainer.classList.toggle('hidden');
        }
      });

      wordListContainer.appendChild(row);
    });
  }

  // Fisher-Yates shuffle helper
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // --- Filter Listeners ---

  // Live Search
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    render();
  });

  // Star filtering chips
  filterAllChip.addEventListener('click', () => {
    filterAllChip.classList.add('active');
    filterStarredChip.classList.remove('active');
    state.filterStarredOnly = false;
    render();
  });

  filterStarredChip.addEventListener('click', () => {
    filterStarredChip.classList.add('active');
    filterAllChip.classList.remove('active');
    state.filterStarredOnly = true;
    render();
  });

  // Sorting mode toggler
  sortModeChip.addEventListener('click', () => {
    if (state.sortMode === 'original') {
      state.sortMode = 'alpha';
      sortModeChip.textContent = 'A-Z Order';
      sortModeChip.classList.add('active');
    } else if (state.sortMode === 'alpha') {
      state.sortMode = 'random';
      sortModeChip.textContent = 'Random Order';
      // Reshuffle randomisedList
      state.randomizedList = shuffle([...app.vocabList]);
      sortModeChip.classList.add('active');
      rotateQuote();
    } else {
      state.sortMode = 'original';
      sortModeChip.textContent = 'Original Order';
      sortModeChip.classList.remove('active');
    }
    render();
  });

  // Meaning toggle (Show/Hide meanings globally)
  toggleMeaningsChip.addEventListener('click', () => {
    state.showMeanings = !state.showMeanings;
    if (state.showMeanings) {
      toggleMeaningsChip.textContent = 'Meanings: Show';
      toggleMeaningsChip.classList.add('active');
    } else {
      toggleMeaningsChip.textContent = 'Meanings: Hide';
      toggleMeaningsChip.classList.remove('active');
      app.showToast('Meanings hidden! Tap any row to reveal.');
    }
    render();
  });

  return {
    render,
    state
  };
}

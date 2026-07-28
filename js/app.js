import { vocabData } from './data.js';
import { initFlashcards } from './flashcards.js';
import { initQuiz } from './quiz.js';
import { initRevision } from './revision.js';

class App {
  constructor() {
    this.vocabList = vocabData;
    this.favorites = this.loadFavorites();
    this.theme = this.loadTheme();
    this.cardDirection = localStorage.getItem('card_direction') || 'h-to-t';
    
    this.initDOM();
    this.initTheme();
    this.initTabs();
    this.initAdmin();
    
    // Initialize component controllers
    this.flashcards = initFlashcards(this);
    this.quiz = initQuiz(this);
    this.revision = initRevision(this);
    
    this.updateStats();
    
    // Load Web Speech synthesis voices list in background
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }
  
  loadFavorites() {
    const favs = localStorage.getItem('vocab_favorites');
    return favs ? new Set(JSON.parse(favs)) : new Set();
  }
  
  saveFavorites() {
    localStorage.setItem('vocab_favorites', JSON.stringify(Array.from(this.favorites)));
    this.updateStats();
    if (this.revision) this.revision.render();
    if (this.flashcards) this.flashcards.updateCardFavoriteState();
  }
  
  toggleFavorite(id) {
    // Parse ID to number
    const numId = Number(id);
    if (this.favorites.has(numId)) {
      this.favorites.delete(numId);
      this.showToast('Removed from starred');
    } else {
      this.favorites.add(numId);
      this.showToast('Starred word! ⭐');
    }
    this.saveFavorites();
  }
  
  isFavorite(id) {
    return this.favorites.has(Number(id));
  }
  
  loadTheme() {
    return localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  
  initDOM() {
    this.themeToggleBtn = document.getElementById('theme-toggle-btn');
    this.sunIcon = document.getElementById('sun-icon');
    this.moonIcon = document.getElementById('moon-icon');
    this.adminBtn = document.getElementById('admin-panel-btn');
    this.adminModal = document.getElementById('admin-modal');
    this.closeAdminBtn = document.getElementById('close-admin-btn');
    this.toast = document.getElementById('app-toast');
  }
  
  initTheme() {
    this.setTheme(this.theme);
    this.themeToggleBtn.addEventListener('click', () => {
      const nextTheme = this.theme === 'light' ? 'dark' : 'light';
      this.setTheme(nextTheme);
    });
  }
  
  setTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      this.sunIcon.style.display = 'block';
      this.moonIcon.style.display = 'none';
    } else {
      this.sunIcon.style.display = 'none';
      this.moonIcon.style.display = 'block';
    }
  }
  
  initTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.target;
        this.switchTab(target, tab);
      });
    });
  }
  
  switchTab(targetId, tabEl) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    if (tabEl) {
      tabEl.classList.add('active');
    } else {
      const correspondingTab = document.querySelector(`.nav-tab[data-target="${targetId}"]`);
      if (correspondingTab) correspondingTab.classList.add('active');
    }
    
    const contentEl = document.getElementById(targetId);
    if (contentEl) contentEl.classList.add('active');
    
    // Route focus calls
    if (targetId === 'revision-screen') {
      if (this.revision) this.revision.render();
    } else if (targetId === 'flashcard-screen') {
      if (this.flashcards) {
        this.flashcards.updateCard();
      }
    }
  }
  
  updateStats() {
    const favCountEl = document.getElementById('flashcard-favorites-count');
    if (favCountEl) {
      favCountEl.textContent = this.favorites.size;
    }
  }
  
  showToast(message) {
    this.toast.textContent = message;
    this.toast.classList.add('show');
    setTimeout(() => {
      this.toast.classList.remove('show');
    }, 2000);
  }
  
  speakHindi(word) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.85; // slightly slower for clearer pronunciation
      
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(v => v.lang.startsWith('hi'));
      if (hindiVoice) utterance.voice = hindiVoice;
      
      window.speechSynthesis.speak(utterance);
    } else {
      this.showToast('Speech synthesis not supported in this browser');
    }
  }
  
  initAdmin() {
    this.adminBtn.addEventListener('click', () => {
      this.adminModal.classList.add('open');
    });
    
    this.closeAdminBtn.addEventListener('click', () => {
      this.adminModal.classList.remove('open');
    });
    
    // Auth Panel Elements
    const authPanel = document.getElementById('admin-auth-panel');
    const formPanel = document.getElementById('admin-form-panel');
    const passwordInput = document.getElementById('admin-password');
    const loginBtn = document.getElementById('admin-login-btn');
    
    loginBtn.addEventListener('click', () => {
      if (passwordInput.value.trim() === 'shabdkosh') {
        authPanel.style.display = 'none';
        formPanel.style.display = 'flex';
        this.showToast('Admin helper unlocked!');
      } else {
        this.showToast('Invalid Password! ❌');
      }
    });
    
    // Code Generator Elements
    const hindiIn = document.getElementById('new-word-hindi');
    const pronIn = document.getElementById('new-word-pronunciation');
    const malIn = document.getElementById('new-word-malayalam');
    const engIn = document.getElementById('new-word-english');
    const genBtn = document.getElementById('generate-code-btn');
    
    const outputGroup = document.getElementById('code-output-group');
    const outputBox = document.getElementById('generated-code-box');
    const copyBtn = document.getElementById('copy-code-btn');
    
    genBtn.addEventListener('click', () => {
      const hindi = hindiIn.value.trim();
      const pron = pronIn.value.trim();
      const mal = malIn.value.trim();
      const eng = engIn.value.trim();
      
      if (!hindi || !pron || !mal) {
        this.showToast('Fields marked with * are required');
        return;
      }
      
      const newId = this.vocabList.length + 1;
      const codeObj = {
        id: newId,
        hindi: hindi,
        pronunciation: pron,
        malayalam: mal,
        english: eng || undefined
      };
      
      const formattedJson = JSON.stringify(codeObj, null, 2);
      
      // Display snippet block
      outputBox.textContent = `  ${formattedJson},`;
      outputGroup.style.display = 'flex';
    });
    
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(outputBox.textContent)
        .then(() => this.showToast('Code block copied! Copy-paste into js/data.js'))
        .catch(() => this.showToast('Failed to copy to clipboard'));
    });
    
    // Check URL parameters for fast admin bypass
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
      this.adminModal.classList.add('open');
    }
  }
}

// Boot up app on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});

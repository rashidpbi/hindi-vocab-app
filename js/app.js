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
    
    // Word Entry Elements
    const hindiIn = document.getElementById('new-word-hindi');
    const pronIn = document.getElementById('new-word-pronunciation');
    const malIn = document.getElementById('new-word-malayalam');
    const engIn = document.getElementById('new-word-english');
    const genBtn = document.getElementById('generate-code-btn');
    
    const outputGroup = document.getElementById('code-output-group');
    const outputBox = document.getElementById('generated-code-box');
    const copyBtn = document.getElementById('copy-code-btn');
    
    // GitHub API Config Elements
    const githubPatIn = document.getElementById('github-pat');
    const githubRepoIn = document.getElementById('github-repo');
    const githubBranchIn = document.getElementById('github-branch');
    const githubDetails = document.getElementById('github-config-details');
    const addToGithubBtn = document.getElementById('add-to-github-btn');
    
    // Load config from localStorage
    githubPatIn.value = localStorage.getItem('github_pat') || '';
    githubRepoIn.value = localStorage.getItem('github_repo') || '';
    githubBranchIn.value = localStorage.getItem('github_branch') || 'main';
    
    // Auto-detect repo if hosted on GitHub pages and repo isn't set yet
    if (!githubRepoIn.value && window.location.hostname.endsWith('.github.io')) {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const owner = window.location.hostname.split('.')[0];
      const repo = parts[0] || '';
      if (owner && repo) {
        githubRepoIn.value = `${owner}/${repo}`;
        localStorage.setItem('github_repo', githubRepoIn.value);
      }
    }
    
    // Event listeners to save configs
    githubPatIn.addEventListener('change', () => {
      localStorage.setItem('github_pat', githubPatIn.value.trim());
    });
    githubRepoIn.addEventListener('change', () => {
      localStorage.setItem('github_repo', githubRepoIn.value.trim());
    });
    githubBranchIn.addEventListener('change', () => {
      localStorage.setItem('github_branch', githubBranchIn.value.trim());
    });

    // Offline Generate Code listener
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
      outputGroup.scrollIntoView({ behavior: 'smooth' });
    });
    
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(outputBox.textContent)
        .then(() => this.showToast('Code block copied! Copy-paste into js/data.js'))
        .catch(() => this.showToast('Failed to copy to clipboard'));
    });

    // Add to GitHub listener
    addToGithubBtn.addEventListener('click', async () => {
      const hindi = hindiIn.value.trim();
      const pron = pronIn.value.trim();
      const mal = malIn.value.trim();
      const eng = engIn.value.trim();
      
      if (!hindi || !pron || !mal) {
        this.showToast('Fields marked with * are required');
        return;
      }
      
      const pat = githubPatIn.value.trim();
      const repo = githubRepoIn.value.trim();
      const branch = githubBranchIn.value.trim() || 'main';
      
      if (!pat || !repo) {
        githubDetails.open = true;
        this.showToast('Please configure GitHub Settings first!');
        githubDetails.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      
      // Disable UI elements during write
      const inputs = [hindiIn, pronIn, malIn, engIn, githubPatIn, githubRepoIn, githubBranchIn];
      const buttons = [addToGithubBtn, genBtn];
      
      inputs.forEach(i => i.disabled = true);
      buttons.forEach(b => b.disabled = true);
      const originalText = addToGithubBtn.innerHTML;
      addToGithubBtn.innerHTML = `
        <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
        Adding Word...
      `;
      
      try {
        const url = `https://api.github.com/repos/${repo}/contents/js/data.js?ref=${branch}`;
        
        // 1. Fetch current file content and SHA
        const getRes = await fetch(url, {
          headers: {
            'Authorization': `token ${pat}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        if (!getRes.ok) {
          throw new Error(`Failed to fetch js/data.js from repo. Status: ${getRes.status} ${getRes.statusText}`);
        }
        
        const fileData = await getRes.json();
        const sha = fileData.sha;
        const base64Content = fileData.content.replace(/\s/g, '');
        const decodedText = decodeURIComponent(escape(window.atob(base64Content)));
        
        // 2. Parse existing array from file content
        const startIdx = decodedText.indexOf('[');
        const endIdx = decodedText.lastIndexOf(']');
        if (startIdx === -1 || endIdx === -1) {
          throw new Error('Could not parse vocabData array syntax from js/data.js');
        }
        
        const arrayStr = decodedText.substring(startIdx, endIdx + 1);
        let list;
        try {
          list = new Function(`return ${arrayStr};`)();
        } catch (e) {
          throw new Error(`Failed to parse vocabulary array syntax: ${e.message}`);
        }
        
        if (!Array.isArray(list)) {
          throw new Error('Fetched vocabulary is not an array.');
        }
        
        // 3. Increment ID and push new word
        const newId = Math.max(...list.map(w => w.id), 0) + 1;
        const newWordObj = {
          id: newId,
          hindi,
          pronunciation: pron,
          malayalam: mal,
          english: eng || undefined
        };
        list.push(newWordObj);
        
        // 4. Format and base64-encode updated file content
        const updatedContent = `export const vocabData = ${JSON.stringify(list, null, 2)};\n`;
        const encodedContent = window.btoa(unescape(encodeURIComponent(updatedContent)));
        
        // 5. Commit changes to GitHub
        const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/js/data.js`, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${pat}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            message: `Add vocabulary word: ${hindi} (${pron})`,
            content: encodedContent,
            sha: sha,
            branch: branch
          })
        });
        
        if (!putRes.ok) {
          const errBody = await putRes.json().catch(() => ({}));
          throw new Error(errBody.message || `Failed to commit to GitHub (Status ${putRes.status})`);
        }
        
        // 6. Update local memory states so changes are immediately visible
        this.vocabList = list;
        
        // Update state in revision module
        if (this.revision) {
          this.revision.vocabList = list; 
          this.revision.state.randomizedList = [...list];
          this.revision.render();
        }
        
        // Update state in flashcards module
        if (this.flashcards) {
          this.flashcards.vocabList = list;
          if (this.flashcards.state.isShuffled) {
            this.flashcards.state.shuffledList.push(newWordObj);
          } else {
            this.flashcards.state.shuffledList = [...list];
          }
          this.flashcards.updateCard();
        }
        
        // Update stats
        this.updateStats();
        
        // Show success and reset form
        this.showToast('Word added to live site! Rebuild triggered 🚀');
        
        // Clean fields
        hindiIn.value = '';
        pronIn.value = '';
        malIn.value = '';
        engIn.value = '';
        if (outputGroup) outputGroup.style.display = 'none';
        
      } catch (error) {
        console.error(error);
        alert(`Failed to add word:\n${error.message}`);
      } finally {
        // Re-enable everything
        inputs.forEach(i => i.disabled = false);
        buttons.forEach(b => b.disabled = false);
        addToGithubBtn.innerHTML = originalText;
      }
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

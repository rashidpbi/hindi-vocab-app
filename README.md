# Hindi Shabdkosh (हिन्दी शब्दकोश)

A simple, modern, and creative vocabulary learning web application designed for WhatsApp study groups. Built with semantic HTML5, custom CSS3, and ES6+ JavaScript.

## Features
- **Flashcard Mode**: Bidirectional flip cards (Hindi ↔ Malayalam/English) with high-fidelity 3D flip effects.
- **Audio Pronunciation**: Text-to-Speech synthesis using native Hindi browser voices.
- **Interactive Quizzes**: Randomized question sequences with distractor generators, streak trackers, and canvas confetti celebrations.
- **Revision Board**: Searchable and sortable vocabulary lists, with options to hide translations for active self-assessment.
- **Admin Code Helper**: Password-protected utility (`shabdkosh`) to generate clean vocabulary object code blocks without formatting mistakes.

---

## 🛠 Running Locally

To run the application locally on your computer:
1. Open a terminal and navigate to the project directory:
   ```bash
   cd hindi-vocab-app
   ```
2. Start a local server (e.g., using Python):
   ```bash
   python3 -m http.server 8080
   ```
3. Open `http://localhost:8080` in your web browser.

---

## ✍ Adding New Words

Adding new words is simple:
1. Open the app in your browser and click the **Key/Settings** icon in the header.
2. Enter the admin password: `shabdkosh`
3. Fill out the form fields (Hindi Word, Pronunciation Transliteration, Malayalam Meaning, English Meaning).
4. Click **Generate Object Code** and copy the generated snippet.
5. Open `js/data.js` in your text editor.
6. Append the copied object block to the end of the `vocabData` array.
7. Save the file and commit it to Git.

---

## 🚀 Hosting Online (GitHub Pages)

Whenever you push modifications to `main` branch on GitHub, the site rebuilds automatically:
1. Initialize local git and add files:
   ```bash
   git init
   git add .
   git commit -m "Initialize Hindi Shabdkosh"
   ```
2. Connect to your GitHub repository:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/hindi-shabdkosh.git
   git branch -M main
   git push -u origin main
   ```
3. Turn on GitHub Pages under **Settings** → **Pages** → **Deploy from a branch** (select `main` and `/root`).

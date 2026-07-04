import { Board } from './board.js';
import { StreamEngine } from './stream.js';
import { Annotator } from './annotate.js';
import { AnimationEngine } from './animate.engine.js';
import { PhysicsEngine } from './physics.engine.js';
import { Controls } from './controls.js';
import { AkaiItoAPI } from './api.js';

class ChalkApp {
  constructor() {
    this.board = null;
    this.stream = null;
    this.annotator = null;
    this.animator = null;
    this.physics = null;
    this.controls = null;
    this.api = new AkaiItoAPI();
  }

  init() {
    this._createLayout();

    // Init components
    this.stream = new StreamEngine({ baseDelay: 35, speed: 1 });
    this.board = new Board(document.getElementById('whiteboard'), document.getElementById('visual-panel'));
    this.annotator = new Annotator(document.getElementById('whiteboard'));
    this.animator = new AnimationEngine(this.board, this.annotator);
    this.physics = new PhysicsEngine(document.getElementById('visual-panel'));
    this.controls = new Controls(document.getElementById('controls'), this.stream);

    // --- Wire stream events to board ---

    this.stream.on('segmentstart', ({ segment, segmentIndex }) => {
      this.board.startSegment(segment, segmentIndex);
    });

    this.stream.on('char', ({ char, segment }) => {
      this.board.appendChar(char, segment);
    });

    this.stream.on('bulk', ({ text, segment, segmentIndex }) => {
      this.board.appendBulk(text, segment, segmentIndex);
    });

    this.stream.on('segmentend', ({ segment, segmentIndex }) => {
      this.board.endSegment(segment, segmentIndex);
    });

    // --- Wire annotation events ---

    this.stream.on('annotation', (ann) => {
      const spans = this.board.findText(ann.target);
      if (!spans) return;

      switch (ann.action) {
        case 'highlight':
          this.annotator.highlight(spans, ann.color || 'accent');
          break;
        case 'underline':
          this.annotator.underline(spans);
          break;
        case 'circle':
          this.annotator.circle(spans);
          break;
        case 'arrow':
          break;
      }
    });

    // --- Wire animation events ---

    this.stream.on('animate', (animSegment) => {
      this.animator.run(animSegment);
    });

    this.stream.on('scene', (sceneSegment) => {
      this.physics.run(sceneSegment);
    });

    // --- Wire interrupt flow ---

    this.stream.on('interrupt', () => {
      this.board.setDimmed(true);
      const input = this.board.showInterruptInput();

      // Handle Enter — submit question
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
          e.preventDefault();
          this._handleStudentQuestion(input.value.trim());
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this._resumeFromInterrupt();
        }
      });
    });

    this.stream.on('resumeecho', ({ text }) => {
      this.board.showResumeEcho(text);
    });

    this.stream.on('statechange', ({ state }) => {
      if (state === 'done') {
        this.api.saveSession();
      }
    });

    // --- Wire controls ---

    this.controls.onAsk = () => {
      if (this.stream.state === 'playing' || this.stream.state === 'paused') {
        this.stream.interrupt();
      }
    };

    this.controls.onResumeFromInterrupt = () => {
      this._resumeFromInterrupt();
    };

    this.controls.onEndSession = async () => {
      if (this.stream.state === 'playing' || this.stream.state === 'paused') {
        this.stream.interrupt();
      }
      this.board.setDimmed(false);
      this.board.addAgentNote('Saving session history to Cognee and generating optional quiz...');
      
      const currentIndex = this.stream.segmentIndex;
      this.stream.segments = this.stream.segments.slice(0, currentIndex);
      this.board.clearAfter(currentIndex);
      this.stream.resumeWithEcho('Session saved! Here is a quick quiz to test your knowledge:');

      try {
        const generator = await this.api.investigate('The session is over. Summarize the key findings, persons of interest, and recommended next steps as a closing case brief.');
        for await (const segment of generator) {
          this.stream.append(segment);
        }
      } catch (e) {
        console.error(e);
        this.board.addAgentNote('Error communicating with backend.');
      }
    };

    // --- Keyboard shortcuts ---

    document.addEventListener('keydown', (e) => {
      // Allow typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (this.stream.state === 'interrupted') {
            this._resumeFromInterrupt();
          } else {
            this.stream.togglePlayPause();
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (this.stream.state === 'interrupted') {
            this._resumeFromInterrupt();
          } else if (this.stream.state === 'playing' || this.stream.state === 'paused') {
            this.stream.interrupt();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.stream.skipSegment();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.stream.setSpeed(Math.min(3, this.stream.speed + 0.25));
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.stream.setSpeed(Math.max(0.5, this.stream.speed - 0.25));
          break;
      }
    });

    this._setupStudyBubbleModal();
  }

  // --- Interrupt handling ---

  async _handleStudentQuestion(question) {
    // 1. Render student message on the board
    this.board.addStudentMessage(question);

    // 2. Un-dim the board
    this.board.setDimmed(false);

    // 3. Agent acknowledges inline
    this.board.addAgentNote('Thinking...');

    // 4. Pin as side note
    this.board.addSideNote(question);

    // 5. Clear the upcoming segments in the stream
    // Since we are replacing the stream with a dynamic response, we remove 
    // any unplayed segments and wait for new ones.
    const currentIndex = this.stream.segmentIndex;
    this.stream.segments = this.stream.segments.slice(0, currentIndex);
    this.board.clearAfter(currentIndex);

    // 6. Resume stream (it will idle because there are no segments)
    const context = this.stream.getInterruptContext();
    const echoText = context
      ? `As I was saying ${context} —`
      : 'Continuing where I left off —';
    this.stream.resumeWithEcho(echoText);

    // 7. Fetch the answer from the LLM
    try {
      const generator = await this.api.askQuestion(question);
      for await (const segment of generator) {
        this.stream.append(segment);
      }
    } catch (e) {
      console.error(e);
      this.board.addAgentNote('Error communicating with backend.');
    }
  }

  _resumeFromInterrupt() {
    this.board.removeInterruptInput();
    this.board.setDimmed(false);
    const context = this.stream.getInterruptContext();
    const echoText = context
      ? `Continuing ${context} —`
      : 'Continuing —';
    this.stream.resumeWithEcho(echoText);
  }

  // --- Lesson loading ---

  async loadLesson(topic) {
    const titleEl = document.getElementById('lesson-title');
    const subjectEl = document.getElementById('lesson-subject');
    if (titleEl) titleEl.textContent = topic;
    if (subjectEl) subjectEl.textContent = 'AI TUTOR';

    // Reset everything
    this.annotator.clearAll();
    this.animator.clearAll();
    this.physics.clearAll();
    this.board.clear();
    
    // Hide visual panel at start of new lesson
    document.getElementById('visual-panel').style.display = 'none';
    
    this.stream.load([]);

    try {
      const generator = await this.api.openCase(topic);
      for await (const segment of generator) {
        this.stream.append(segment);
      }
    } catch (e) {
      console.error(e);
      this.board.addAgentNote('Error: Make sure the local backend is running.');
    }
  }

  _createLayout() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="chalk-app">
        <header class="header">
          <div class="header__brand">
            <span class="header__logo">◉</span>
            <span class="header__name">Akai Ito</span>
          </div>
          <div class="header__lesson-info">
            <span class="header__subject" id="lesson-subject">AI TUTOR</span>
            <span class="header__title" id="lesson-title">Ready</span>
          </div>
          <div class="header__shortcuts">
            <span class="shortcut-hint" title="Play / Pause">Space</span>
            <span class="shortcut-hint" title="Interrupt / Ask">Esc</span>
            <span class="shortcut-hint" title="Skip segment">→</span>
            <span class="shortcut-hint" title="Speed ↑↓">↑↓</span>
          </div>
        </header>
        <main class="main">
          <div class="whiteboard" id="whiteboard"></div>
          <div class="visual-panel" id="visual-panel" style="display: none;"></div>
        </main>
        <footer class="footer">
          <div id="controls"></div>
        </footer>
      </div>

      <!-- Outline Overlay -->
      <div id="outline-overlay" class="outline-overlay outline-overlay--hidden">
        <div class="outline__header">
          <h1 class="outline__title" id="outline-title">Investigation Board</h1>
          <p class="outline__subtitle">Select a case file to begin analysis</p>
        </div>
        <div class="outline__list" id="outline-list"></div>
      </div>

      <!-- Landing Page -->
      <div id="landing-page" class="landing-overlay">
        <div class="landing-content">
          <p class="landing-eyebrow">AKAI ITO</p>
          <h1 class="landing-title">When Memory Fails,<br>Evidence Speaks.</h1>
          <p class="landing-pitch">Lawyers and investigators deal with mountains of documents, witnesses, and timelines. Akai Ito ingests all of it — case files, transcripts, news articles, audio, video — and builds a living knowledge graph so you can ask any question and get answers, instantly.</p>
          <div class="landing-use-cases">
            <span class="landing-tag">Defense Counsel</span>
            <span class="landing-tag">Prosecution</span>
            <span class="landing-tag">Private Investigators</span>
            <span class="landing-tag">Journalists</span>
          </div>
          <button id="landing-enter-btn" class="landing-cta">Open an Investigation</button>
        </div>
      </div>

      <!-- Investigation Modal -->
      <div id="study-bubble-modal" class="modal-overlay" style="display: none;">
        <div class="modal">
          <h2 class="modal__title">Open a Case</h2>
          <p class="modal__subtitle">Upload evidence files or paste a URL. We'll extract and map everything for you.</p>
          
          <div class="modal__form-group">
            <label class="modal__label">Case Name</label>
            <input type="text" id="modal-topic" class="modal__input" placeholder="e.g. John Doe — Missing Person, The Meridian Fraud">
          </div>

          <div class="modal__form-group">
            <label class="modal__label">Upload Evidence</label>
            <input type="file" id="modal-file" accept="*/*" style="display: none;">
            <div id="modal-dropzone" class="modal__dropzone">
              <p class="modal__dropzone-text" id="modal-dropzone-text">Drop any file here — PDF, Word, images, audio, video, or text. Or <strong>browse.</strong></p>
            </div>
          </div>

          <div class="modal__form-group">
            <label class="modal__label">Or paste a URL</label>
            <input type="text" id="modal-url" class="modal__input" placeholder="e.g. https://news.com/article">
          </div>

          <button id="modal-start-btn" class="modal__btn">Open Case</button>
        </div>
      </div>
    `;
  }

  _setupStudyBubbleModal() {
    const landingPage = document.getElementById('landing-page');
    const landingEnterBtn = document.getElementById('landing-enter-btn');
    const modal = document.getElementById('study-bubble-modal');
    const outlineOverlay = document.getElementById('outline-overlay');
    const outlineTitle = document.getElementById('outline-title');
    const outlineList = document.getElementById('outline-list');
    const topicInput = document.getElementById('modal-topic');
    const fileInput = document.getElementById('modal-file');
    const dropzone = document.getElementById('modal-dropzone');
    const dropzoneText = document.getElementById('modal-dropzone-text');
    const startBtn = document.getElementById('modal-start-btn');
    const urlInput = document.getElementById('modal-url');

    let selectedFile = null;

    if (landingEnterBtn) {
      landingEnterBtn.addEventListener('click', () => {
        landingPage.style.display = 'none';
        modal.style.display = 'flex';
      });
    }

    dropzone.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        selectedFile = e.target.files[0];
        dropzoneText.innerHTML = `File: <strong>${selectedFile.name}</strong>`;
        dropzone.classList.add('modal__dropzone--active');
      }
    });

    const handleStart = async () => {
      const topic = topicInput.value.trim();
      if (!topic) return;

      startBtn.disabled = true;

      if (selectedFile) {
        startBtn.textContent = 'Parsing File & Generating Outline...';
      } else {
        startBtn.textContent = 'Generating Outline...';
      }
      
      const result = await this.api.submitEvidence(topic, selectedFile, urlInput?.value?.trim() || null);
      const outline = result?.brief ? [
        result.brief.summary,
        ...(result.brief.keyFacts || []),
        ...(result.brief.leads || [])
      ] : [topic];
      
      modal.classList.add('modal-overlay--hidden');
      
      if (outline && outline.length > 0) {
        outlineTitle.textContent = topic;
        outlineList.innerHTML = outline.map((item, i) => `
          <div class="outline__card" data-topic="${item}">
            <div class="outline__card-number">${i + 1}</div>
            <div class="outline__card-title">${item}</div>
          </div>
        `).join('');
        
        outlineOverlay.classList.remove('outline-overlay--hidden');
        
        document.querySelectorAll('.outline__card').forEach(card => {
          card.addEventListener('click', () => {
            const subTopic = card.getAttribute('data-topic');
            outlineOverlay.classList.add('outline-overlay--hidden');
            this.loadLesson(`${topic}: ${subTopic}`);
          });
        });
      } else {
        this.loadLesson(topic);
      }
    };

    startBtn.addEventListener('click', handleStart);
    topicInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleStart();
    });
  }
}

// Boot
const app = new ChalkApp();
app.init();

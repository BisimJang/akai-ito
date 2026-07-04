// Whiteboard canvas — renders streamed content into the DOM
// Handles character-by-character insertion, segment starts, scrolling,
// interrupt flow (inline input, student messages, side notes, resume echo)

import katex from 'katex';
import 'katex/dist/katex.min.css';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false, theme: 'dark', background: 'transparent' });

export class Board {
  constructor(containerEl, visualPanelEl) {
    this.container = containerEl;
    this.visualPanel = visualPanelEl;
    this.contentArea = null;
    this.currentBlock = null;
    this.segmentBlocks = new Map(); // segmentIndex → DOM element
    this.sideNotes = []; // pinned side notes
    this.interruptInput = null; // current interrupt input element
    this.init();
  }

  init() {
    this.container.innerHTML = '';

    // Scrollable content wrapper
    this.contentArea = document.createElement('div');
    this.contentArea.className = 'board__content';
    this.container.appendChild(this.contentArea);

    // Side notes panel (right margin)
    this.sideNotesPanel = document.createElement('div');
    this.sideNotesPanel.className = 'board__side-notes';
    this.container.appendChild(this.sideNotesPanel);

    // Cursor element
    this.cursor = document.createElement('span');
    this.cursor.className = 'board__cursor';
    this.cursor.textContent = '▎';
  }

  // Called when a new segment begins streaming
  startSegment(segment, segmentIndex) {
    const el = this._createBlockElement(segment);
    el.dataset.segmentIndex = segmentIndex;
    this.contentArea.appendChild(el);
    this.currentBlock = el;
    this.segmentBlocks.set(segmentIndex, el);

    // For math blocks, show a LaTeX source area while streaming
    if (segment.type === 'math') {
      const sourceEl = document.createElement('span');
      sourceEl.className = 'board__math-source board__text';
      el.appendChild(sourceEl);
    } else if (segment.type === 'diagram') {
      const sourceEl = document.createElement('span');
      sourceEl.className = 'board__diagram-source board__text';
      el.appendChild(sourceEl);
    }

    // Append cursor
    el.appendChild(this.cursor);

    this._scrollToBottom();
  }

  // Called for each streamed character
  appendChar(char, segment) {
    if (!this.currentBlock) return;

    // For math segments, stream into the source display
    if (segment.type === 'math') {
      const sourceEl = this.currentBlock.querySelector('.board__math-source');
      if (sourceEl) {
        const charSpan = document.createElement('span');
        charSpan.className = 'board__char';
        charSpan.textContent = char;
        sourceEl.appendChild(charSpan);
      }
      this._scrollToBottom();
      return;
    } else if (segment.type === 'diagram') {
      const sourceEl = this.currentBlock.querySelector('.board__diagram-source');
      if (sourceEl) {
        const charSpan = document.createElement('span');
        charSpan.className = 'board__char';
        charSpan.textContent = char;
        sourceEl.appendChild(charSpan);
      }
      this._scrollToBottom();
      return;
    }

    // Get or create the text container within the block
    let textNode = this.currentBlock.querySelector('.board__text');
    if (!textNode) {
      textNode = document.createElement('span');
      textNode.className = 'board__text';
      this.currentBlock.insertBefore(textNode, this.cursor);
    }

    if (char === '\n') {
      textNode.appendChild(document.createElement('br'));
    } else {
      const charSpan = document.createElement('span');
      charSpan.className = 'board__char';
      charSpan.textContent = char;
      textNode.appendChild(charSpan);
    }

    this._scrollToBottom();
  }

  // Called when a segment finishes streaming (bulk emit for skip)
  appendBulk(text, segment, segmentIndex) {
    if (!this.currentBlock) {
      this.startSegment(segment, segmentIndex);
    }

    if (segment.type === 'math') {
      const sourceEl = this.currentBlock.querySelector('.board__math-source');
      if (sourceEl) {
        for (const char of text) {
          const charSpan = document.createElement('span');
          charSpan.className = 'board__char board__char--instant';
          charSpan.textContent = char;
          sourceEl.appendChild(charSpan);
        }
      }
      this._scrollToBottom();
      return;
    } else if (segment.type === 'diagram') {
      const sourceEl = this.currentBlock.querySelector('.board__diagram-source');
      if (sourceEl) {
        for (const char of text) {
          const charSpan = document.createElement('span');
          charSpan.className = 'board__char board__char--instant';
          charSpan.textContent = char;
          sourceEl.appendChild(charSpan);
        }
      }
      this._scrollToBottom();
      return;
    }

    let textNode = this.currentBlock.querySelector('.board__text');
    if (!textNode) {
      textNode = document.createElement('span');
      textNode.className = 'board__text';
      this.currentBlock.insertBefore(textNode, this.cursor);
    }

    const frag = document.createDocumentFragment();
    for (const char of text) {
      if (char === '\n') {
        frag.appendChild(document.createElement('br'));
      } else {
        const charSpan = document.createElement('span');
        charSpan.className = 'board__char board__char--instant';
        charSpan.textContent = char;
        frag.appendChild(charSpan);
      }
    }
    textNode.appendChild(frag);
    this._scrollToBottom();
  }

  // Called when a segment finishes
  endSegment(segment, segmentIndex) {
    if (this.cursor.parentNode) {
      this.cursor.remove();
    }

    const el = this.segmentBlocks.get(segmentIndex);

    // For math segments, replace source text with rendered KaTeX
    if (segment.type === 'math' && el) {
      this._renderMath(el, segment.text);
    } else if (segment.type === 'diagram' && el) {
      this._renderDiagram(el, segment.text, segmentIndex);
    }

    // For text segments, render any inline math ($...$)
    if (segment.type === 'text' && el) {
      this._renderInlineMath(el);
    }

    if (el) el.classList.add('board__block--complete');
    this.currentBlock = null;
  }

  // --- Interrupt flow ---

  // Dim the board content (everything fades except the interrupt input)
  setDimmed(dimmed) {
    if (dimmed) {
      this.contentArea.classList.add('board__content--dimmed');
    } else {
      this.contentArea.classList.remove('board__content--dimmed');
    }
  }

  // Show an inline input on the board for the student to type their question
  showInterruptInput() {
    // Remove any existing interrupt input
    this.removeInterruptInput();

    const wrapper = document.createElement('div');
    wrapper.className = 'board__interrupt';

    const label = document.createElement('span');
    label.className = 'board__interrupt-label';
    label.textContent = 'You';
    wrapper.appendChild(label);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'board__interrupt-input';
    input.id = 'interrupt-input';
    input.placeholder = 'Ask a question...';
    input.autocomplete = 'off';
    wrapper.appendChild(input);

    const hint = document.createElement('span');
    hint.className = 'board__interrupt-hint';
    hint.textContent = 'Enter to send · Esc to resume';
    wrapper.appendChild(hint);

    this.contentArea.appendChild(wrapper);
    this.interruptInput = wrapper;

    this._scrollToBottom();

    // Focus the input after a frame (so the board can settle)
    requestAnimationFrame(() => {
      input.focus();
    });

    return input;
  }

  removeInterruptInput() {
    if (this.interruptInput) {
      this.interruptInput.remove();
      this.interruptInput = null;
    }
  }

  // Render the student's question as a message on the board
  addStudentMessage(text) {
    this.removeInterruptInput();

    const msg = document.createElement('div');
    msg.className = 'board__student-msg';

    const label = document.createElement('span');
    label.className = 'board__student-msg-label';
    label.textContent = 'You';

    const content = document.createElement('span');
    content.className = 'board__student-msg-text';
    content.textContent = text;

    msg.appendChild(label);
    msg.appendChild(content);
    this.contentArea.appendChild(msg);

    this._scrollToBottom();
  }

  // Render a brief agent acknowledgment inline
  addAgentNote(text) {
    const note = document.createElement('div');
    note.className = 'board__agent-note';

    const label = document.createElement('span');
    label.className = 'board__agent-note-label';
    label.textContent = 'Chalk';

    const content = document.createElement('span');
    content.className = 'board__agent-note-text';
    content.textContent = text;

    note.appendChild(label);
    note.appendChild(content);
    this.contentArea.appendChild(note);

    this._scrollToBottom();
  }

  // Pin a concept to the right margin as a side note
  addSideNote(text) {
    const note = document.createElement('div');
    note.className = 'board__side-note';
    note.textContent = text;

    // Animate in
    note.style.opacity = '0';
    note.style.transform = 'translateX(20px)';
    this.sideNotesPanel.appendChild(note);
    this.sideNotes.push(note);

    requestAnimationFrame(() => {
      note.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      note.style.opacity = '1';
      note.style.transform = 'translateX(0)';
    });
  }

  // Show a resume echo — brief italic text showing where we left off
  showResumeEcho(text) {
    const echo = document.createElement('div');
    echo.className = 'board__resume-echo';
    echo.textContent = text;
    this.contentArea.appendChild(echo);
    this._scrollToBottom();
  }

  // --- Rewind / Clear ---

  clearAfter(segmentIndex) {
    const toRemove = [];
    this.segmentBlocks.forEach((el, idx) => {
      if (idx >= segmentIndex) {
        toRemove.push(idx);
        el.remove();
      }
    });
    toRemove.forEach(idx => this.segmentBlocks.delete(idx));
    this.currentBlock = null;
  }

  clear() {
    this.contentArea.innerHTML = '';
    this.segmentBlocks.clear();
    this.currentBlock = null;
    this.sideNotesPanel.innerHTML = '';
    this.sideNotes = [];
    this.interruptInput = null;
  }

  // Find text within the board for annotation targeting
  findText(searchText) {
    const allChars = this.contentArea.querySelectorAll('.board__char');
    const charSpans = Array.from(allChars);
    let builtText = '';
    const charMap = [];
    for (const span of charSpans) {
      charMap.push({ span, index: builtText.length });
      builtText += span.textContent;
    }

    const idx = builtText.indexOf(searchText);
    if (idx === -1) return null;

    const endIdx = idx + searchText.length;
    const result = [];
    for (const { span, index } of charMap) {
      if (index >= idx && index < endIdx) {
        result.push(span);
      }
    }

    return result.length > 0 ? result : null;
  }

  // --- internal ---

  _createBlockElement(segment) {
    const el = document.createElement('div');

    switch (segment.type) {
      case 'heading':
        el.className = `board__block board__heading board__heading--h${segment.level || 1}`;
        break;
      case 'math':
        el.className = 'board__block board__math';
        break;
      case 'diagram':
        el.className = 'board__block board__diagram';
        break;
      case 'code':
        el.className = 'board__block board__code';
        break;
      case 'text':
      default:
        el.className = 'board__block board__paragraph';
        break;
    }

    return el;
  }

  _renderMath(el, latex) {
    const sourceEl = el.querySelector('.board__math-source');
    if (sourceEl) sourceEl.remove();

    const mathEl = document.createElement('div');
    mathEl.className = 'board__math-rendered';

    try {
      katex.render(latex, mathEl, {
        displayMode: true,
        throwOnError: false,
        strict: false,
        trust: true,
        macros: {
          '\\R': '\\mathbb{R}',
          '\\N': '\\mathbb{N}',
        }
      });
    } catch (e) {
      mathEl.textContent = latex;
      mathEl.className = 'board__math-rendered board__math-rendered--fallback';
    }

    mathEl.style.opacity = '0';
    mathEl.style.transform = 'scale(0.95)';
    el.appendChild(mathEl);

    requestAnimationFrame(() => {
      mathEl.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      mathEl.style.opacity = '1';
      mathEl.style.transform = 'scale(1)';
    });
  }

  async _renderDiagram(el, code, index) {
    const sourceEl = el.querySelector('.board__diagram-source');
    if (sourceEl) sourceEl.remove();

    // Ensure visual panel is visible
    if (this.visualPanel && this.visualPanel.style.display === 'none') {
      this.visualPanel.style.display = 'flex';
    }

    const diagramEl = document.createElement('div');
    diagramEl.className = 'board__diagram-rendered';

    try {
      const { svg } = await mermaid.render(`mermaid-svg-${index}`, code);
      diagramEl.innerHTML = svg;
    } catch (e) {
      diagramEl.textContent = "Failed to render diagram:\\n" + code;
      diagramEl.className = 'board__diagram-rendered board__diagram-rendered--fallback';
    }

    diagramEl.style.opacity = '0';
    diagramEl.style.transform = 'scale(0.95)';
    
    // Clear previous diagrams in visual panel
    if (this.visualPanel) {
      // Remove any previous diagram (but keep physics canvas)
      Array.from(this.visualPanel.children).forEach(child => {
        if (child.classList.contains('board__diagram-rendered')) {
          child.remove();
        }
      });
      this.visualPanel.appendChild(diagramEl);
      
      // Inline block just gets a note
      const note = document.createElement('span');
      note.className = 'board__text';
      note.style.color = 'var(--chalk-cool)';
      note.textContent = '(See diagram on the right)';
      el.appendChild(note);
    } else {
      el.appendChild(diagramEl);
    }

    requestAnimationFrame(() => {
      diagramEl.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      diagramEl.style.opacity = '1';
      diagramEl.style.transform = 'scale(1)';
      this._scrollToBottom();
    });
  }

  _renderInlineMath(el) {
    const textNode = el.querySelector('.board__text');
    if (!textNode) return;

    const charSpans = Array.from(textNode.querySelectorAll('.board__char'));
    let fullText = '';
    const charMap = [];
    for (const span of charSpans) {
      charMap.push({ span, index: fullText.length });
      fullText += span.textContent;
    }

    const mathRegex = /\$([^$]+)\$/g;
    let match;
    const replacements = [];

    while ((match = mathRegex.exec(fullText)) !== null) {
      const startIdx = match.index;
      const endIdx = match.index + match[0].length;
      const latex = match[1];
      replacements.push({ startIdx, endIdx, latex });
    }

    for (let i = replacements.length - 1; i >= 0; i--) {
      const { startIdx, endIdx, latex } = replacements[i];

      const matchSpans = [];
      for (const { span, index } of charMap) {
        if (index >= startIdx && index < endIdx) {
          matchSpans.push(span);
        }
      }

      if (matchSpans.length === 0) continue;

      const mathSpan = document.createElement('span');
      mathSpan.className = 'board__inline-math';
      try {
        katex.render(latex, mathSpan, {
          displayMode: false,
          throwOnError: false,
          strict: false,
        });
      } catch (e) {
        mathSpan.textContent = latex;
      }

      const firstSpan = matchSpans[0];
      firstSpan.parentNode.insertBefore(mathSpan, firstSpan);

      for (const span of matchSpans) {
        span.remove();
      }
    }
  }

  _scrollToBottom() {
    requestAnimationFrame(() => {
      this.container.scrollTo({
        top: this.container.scrollHeight,
        behavior: 'smooth'
      });
    });
  }
}

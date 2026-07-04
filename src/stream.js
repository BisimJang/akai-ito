// Streaming text engine
// Plays through lesson segments character by character
// Emits events: 'char', 'word', 'segmentstart', 'segmentend',
//               'annotation', 'animate', 'interrupt', 'done'

export class StreamEngine {
  constructor(options = {}) {
    this.segments = [];
    this.segmentIndex = 0;
    this.charIndex = 0;
    this.speed = options.speed || 1; // multiplier
    this.baseDelay = options.baseDelay || 35; // ms per character
    this.state = 'idle'; // idle | playing | paused | interrupted | done
    this.timer = null;
    this.listeners = {};
    this.history = []; // for rewind — stores rendered segment indices
    this._injectedSegments = []; // segments injected mid-stream (echo, etc.)
  }

  load(segments) {
    this.segments = segments;
    this.segmentIndex = 0;
    this.charIndex = 0;
    this.state = 'idle';
    this.history = [];
    this._injectedSegments = [];
    this.emit('load', { segments });
  }

  append(segment) {
    this.segments.push(segment);
    // If it was done, but now has new segments, resume ticking
    if (this.state === 'done') {
      this.state = 'playing';
      this.emit('statechange', { state: 'playing' });
      this._tick();
    } else if (this.state === 'idle') {
      this.play();
    }
  }

  play() {
    if (this.state === 'done') return;
    this.state = 'playing';
    this.emit('statechange', { state: 'playing' });
    this._tick();
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    clearTimeout(this.timer);
    this.emit('statechange', { state: 'paused' });
  }

  resume() {
    if (this.state !== 'paused' && this.state !== 'interrupted') return;
    this.play();
  }

  // Interrupt — stops mid-word, not at a boundary.
  // This is a conversational cut-in, not a UI pause.
  interrupt() {
    if (this.state !== 'playing' && this.state !== 'paused') return;
    clearTimeout(this.timer);
    const prevState = this.state;
    this.state = 'interrupted';

    this.emit('interrupt', {
      segmentIndex: this.segmentIndex,
      charIndex: this.charIndex,
      segment: this.segments[this.segmentIndex],
      prevState
    });
    this.emit('statechange', { state: 'interrupted' });
  }

  // Resume with an echo — injects a brief "where we were" text segment
  // before continuing from the interrupted position.
  resumeWithEcho(echoText) {
    if (this.state !== 'interrupted') return;

    // Emit a special 'resumeecho' event that the board renders as an italic recap
    this.emit('resumeecho', { text: echoText });

    // Brief delay, then continue streaming from where we stopped
    this.state = 'paused';
    setTimeout(() => {
      this.resume();
    }, 800);
  }

  togglePlayPause() {
    if (this.state === 'playing') this.pause();
    else if (this.state === 'paused') this.resume();
    else if (this.state === 'idle') this.play();
    else if (this.state === 'interrupted') {
      // If interrupted, a simple toggle resumes without echo
      this.state = 'paused';
      this.resume();
    }
  }

  setSpeed(multiplier) {
    this.speed = Math.max(0.5, Math.min(3, multiplier));
    this.emit('speedchange', { speed: this.speed });
  }

  rewind(toSegmentIndex = 0) {
    clearTimeout(this.timer);
    this.segmentIndex = Math.max(0, Math.min(toSegmentIndex, this.segments.length - 1));
    this.charIndex = 0;
    this.state = 'paused';
    this.emit('rewind', { toSegmentIndex: this.segmentIndex });
    this.emit('statechange', { state: 'paused' });
  }

  // Skip to end of current segment
  skipSegment() {
    if (this.state === 'done') return;
    if (this.segmentIndex >= this.segments.length) return;
    clearTimeout(this.timer);
    const seg = this.segments[this.segmentIndex];
    if (seg && seg.text) {
      // Emit all remaining characters at once
      const remaining = seg.text.slice(this.charIndex);
      if (remaining) {
        this.emit('bulk', { text: remaining, segment: seg, segmentIndex: this.segmentIndex });
      }
    }
    this._completeSegment();
  }

  // Get context around the current interrupt point for resume echo
  getInterruptContext() {
    // Walk backwards from current position to find the last few words
    const seg = this.segments[this.segmentIndex];
    if (!seg || !seg.text) return '';

    const textSoFar = seg.text.slice(0, this.charIndex);
    const words = textSoFar.trim().split(/\s+/);
    const lastWords = words.slice(-6).join(' ');
    return lastWords ? `...${lastWords}` : '';
  }

  on(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
    return () => {
      this.listeners[event] = this.listeners[event].filter(f => f !== fn);
    };
  }

  emit(event, data) {
    (this.listeners[event] || []).forEach(fn => fn(data));
  }

  destroy() {
    clearTimeout(this.timer);
    this.listeners = {};
    this.state = 'idle';
  }

  // --- internal ---

  _tick() {
    if (this.state !== 'playing') return;
    if (this.segmentIndex >= this.segments.length) {
      this.state = 'done';
      this.emit('done', {});
      this.emit('statechange', { state: 'done' });
      return;
    }

    const seg = this.segments[this.segmentIndex];

    // Annotation segments fire immediately, no character streaming
    if (seg.type === 'annotation') {
      this.emit('annotation', { ...seg, segmentIndex: this.segmentIndex });
      this.history.push(this.segmentIndex);
      this.segmentIndex++;
      this.charIndex = 0;
      // Small pause after annotation for visual breathing room
      this.timer = setTimeout(() => this._tick(), 200 / this.speed);
      return;
    }

    // Animate segments fire immediately, like annotations
    if (seg.type === 'animate') {
      this.emit('animate', { ...seg, segmentIndex: this.segmentIndex });
      this.history.push(this.segmentIndex);
      this.segmentIndex++;
      this.charIndex = 0;
      // Slightly longer pause for animation to register
      this.timer = setTimeout(() => this._tick(), 350 / this.speed);
      return;
    }

    // Scene (physics) segments fire immediately
    if (seg.type === 'scene') {
      this.emit('scene', { ...seg, segmentIndex: this.segmentIndex });
      this.history.push(this.segmentIndex);
      this.segmentIndex++;
      this.charIndex = 0;
      this.timer = setTimeout(() => this._tick(), 100 / this.speed);
      return;
    }

    // Text/heading/math/code segments — stream chars
    if (this.charIndex === 0) {
      this.emit('segmentstart', { segment: seg, segmentIndex: this.segmentIndex });
    }

    const text = seg.text || '';
    if (this.charIndex < text.length) {
      const char = text[this.charIndex];
      this.emit('char', {
        char,
        charIndex: this.charIndex,
        segment: seg,
        segmentIndex: this.segmentIndex
      });

      // Check if we just completed a word
      if (char === ' ' || char === '\n' || this.charIndex === text.length - 1) {
        this.emit('word', { segmentIndex: this.segmentIndex, charIndex: this.charIndex });
      }

      this.charIndex++;

      // Vary delay for natural feel
      let delay = this.baseDelay / this.speed;
      if (char === '.' || char === '!' || char === '?') delay *= 6;
      else if (char === ',') delay *= 3;
      else if (char === '—' || char === ':' || char === ';') delay *= 2.5;
      else if (char === '\n') delay *= 4;

      this.timer = setTimeout(() => this._tick(), delay);
    } else {
      this._completeSegment();
    }
  }

  _completeSegment() {
    if (this.segmentIndex >= this.segments.length) return;
    const seg = this.segments[this.segmentIndex];
    this.history.push(this.segmentIndex);
    this.emit('segmentend', { segment: seg, segmentIndex: this.segmentIndex });
    this.segmentIndex++;
    this.charIndex = 0;

    // Brief pause between segments
    const pause = (seg.type === 'heading' ? 400 : 250) / this.speed;
    this.timer = setTimeout(() => this._tick(), pause);
  }
}

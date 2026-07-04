// Playback controls — Pause, Resume, Skip, Ask, Speed
// Renders the control bar and wires it to the StreamEngine

export class Controls {
  constructor(containerEl, streamEngine) {
    this.container = containerEl;
    this.engine = streamEngine;
    this.elements = {};
    this.init();
  }

  init() {
    this.container.innerHTML = '';
    this.container.className = 'controls';

    // Left group — playback
    const leftGroup = document.createElement('div');
    leftGroup.className = 'controls__group controls__group--left';

    // Play/Pause button
    this.elements.playPause = this._createButton('play-pause', '▶', 'Play / Pause');
    this.elements.playPause.addEventListener('click', () => {
      if (this.engine.state === 'interrupted') {
        // If interrupted, clicking play resumes without echo
        if (this.onResumeFromInterrupt) this.onResumeFromInterrupt();
      } else {
        this.engine.togglePlayPause();
      }
    });
    leftGroup.appendChild(this.elements.playPause);

    // Skip button
    this.elements.skip = this._createButton('skip', '⏭', 'Skip segment');
    this.elements.skip.addEventListener('click', () => {
      this.engine.skipSegment();
    });
    leftGroup.appendChild(this.elements.skip);

    // Ask button — triggers interrupt
    this.elements.ask = this._createButton('ask', '✋', 'Ask a question (Esc)');
    this.elements.ask.addEventListener('click', () => {
      if (this.onAsk) this.onAsk();
    });
    leftGroup.appendChild(this.elements.ask);

    this.container.appendChild(leftGroup);

    // Center group — speed
    const centerGroup = document.createElement('div');
    centerGroup.className = 'controls__group controls__group--center';

    const speedLabel = document.createElement('span');
    speedLabel.className = 'controls__speed-label';
    speedLabel.textContent = 'Speed';
    centerGroup.appendChild(speedLabel);

    this.elements.speedSlider = document.createElement('input');
    this.elements.speedSlider.type = 'range';
    this.elements.speedSlider.className = 'controls__speed-slider';
    this.elements.speedSlider.id = 'speed-slider';
    this.elements.speedSlider.min = '0.5';
    this.elements.speedSlider.max = '3';
    this.elements.speedSlider.step = '0.25';
    this.elements.speedSlider.value = '1';
    this.elements.speedSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.engine.setSpeed(val);
      this.elements.speedValue.textContent = `${val}×`;
    });
    centerGroup.appendChild(this.elements.speedSlider);

    this.elements.speedValue = document.createElement('span');
    this.elements.speedValue.className = 'controls__speed-value';
    this.elements.speedValue.textContent = '1×';
    centerGroup.appendChild(this.elements.speedValue);

    this.container.appendChild(centerGroup);

    // Right group — status
    const rightGroup = document.createElement('div');
    rightGroup.className = 'controls__group controls__group--right';

    this.elements.status = document.createElement('span');
    this.elements.status.className = 'controls__status';
    this.elements.status.id = 'playback-status';
    this.elements.status.textContent = 'Ready';
    rightGroup.appendChild(this.elements.status);

    this.elements.endSession = document.createElement('button');
    this.elements.endSession.className = 'controls__btn';
    this.elements.endSession.style.width = 'auto';
    this.elements.endSession.style.padding = '0 12px';
    this.elements.endSession.style.fontSize = '13px';
    this.elements.endSession.style.border = '1px solid var(--chalk-accent)';
    this.elements.endSession.style.color = 'var(--chalk-accent)';
    this.elements.endSession.textContent = 'Save Session to Memory';
    this.elements.endSession.addEventListener('click', () => {
      if (this.onEndSession) this.onEndSession();
    });
    rightGroup.appendChild(this.elements.endSession);

    this.container.appendChild(rightGroup);

    // Wire engine state changes
    this.engine.on('statechange', ({ state }) => this._updateState(state));
    this.engine.on('speedchange', ({ speed }) => {
      this.elements.speedSlider.value = speed;
      this.elements.speedValue.textContent = `${speed}×`;
    });
  }

  _createButton(id, icon, title) {
    const btn = document.createElement('button');
    btn.className = `controls__btn controls__btn--${id}`;
    btn.id = `btn-${id}`;
    btn.title = title;
    btn.innerHTML = `<span class="controls__btn-icon">${icon}</span>`;
    return btn;
  }

  _updateState(state) {
    const { playPause, status, ask } = this.elements;

    switch (state) {
      case 'playing':
        playPause.querySelector('.controls__btn-icon').textContent = '⏸';
        playPause.title = 'Pause';
        status.textContent = 'Teaching...';
        status.className = 'controls__status controls__status--playing';
        ask.classList.remove('controls__btn--active');
        break;
      case 'paused':
        playPause.querySelector('.controls__btn-icon').textContent = '▶';
        playPause.title = 'Resume';
        status.textContent = 'Paused';
        status.className = 'controls__status controls__status--paused';
        ask.classList.remove('controls__btn--active');
        break;
      case 'interrupted':
        playPause.querySelector('.controls__btn-icon').textContent = '▶';
        playPause.title = 'Resume';
        status.textContent = 'Listening...';
        status.className = 'controls__status controls__status--interrupted';
        ask.classList.add('controls__btn--active');
        break;
      case 'done':
        playPause.querySelector('.controls__btn-icon').textContent = '✓';
        playPause.title = 'Lesson complete';
        status.textContent = 'Lesson complete';
        status.className = 'controls__status controls__status--done';
        ask.classList.remove('controls__btn--active');
        break;
      default:
        playPause.querySelector('.controls__btn-icon').textContent = '▶';
        status.textContent = 'Ready';
        status.className = 'controls__status';
    }
  }

  // Callback hooks
  onAsk = null;
  onResumeFromInterrupt = null;
}

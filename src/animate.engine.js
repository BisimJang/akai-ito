// Animation engine — pedagogical animations triggered by content
// Animations are the teaching, not the UI. When the lesson says
// "the interval shrinks", the circle on the board actually shrinks.
//
// Supported actions:
//   shrink   — target scales down (e.g. circle tightening)
//   grow     — target scales up
//   crossout — strikethrough line draws across target text
//   connect  — arrow draws between two targets
//   pulse    — target glows/pulses to draw attention
//   fade     — target fades to lower opacity

export class AnimationEngine {
  constructor(board, annotator) {
    this.board = board;
    this.annotator = annotator;
    this.activeAnimations = [];
  }

  // Called when an 'animate' segment fires from the stream
  run(animSegment) {
    const { action, target, target2, params = {} } = animSegment;

    switch (action) {
      case 'shrink':
        this._shrink(target, params);
        break;
      case 'grow':
        this._grow(target, params);
        break;
      case 'crossout':
        this._crossout(target, params);
        break;
      case 'connect':
        this._connect(target, target2, params);
        break;
      case 'pulse':
        this._pulse(target, params);
        break;
      case 'fade':
        this._fade(target, params);
        break;
      default:
        console.warn(`AnimationEngine: unknown action "${action}"`);
    }
  }

  // --- Animation implementations ---

  _shrink(target, params) {
    // Find the SVG circle annotation that wraps this target text
    const ann = this._findAnnotation(target, 'circle');
    if (ann) {
      const ellipse = this.annotator.svg.querySelector(`[data-group-id="${ann.groupId}"]`);
      if (ellipse) {
        const to = params.to || 0.6;
        const duration = params.duration || 1200;
        ellipse.style.transition = `rx ${duration}ms ease, ry ${duration}ms ease, opacity ${duration}ms ease`;
        const rx = parseFloat(ellipse.getAttribute('rx'));
        const ry = parseFloat(ellipse.getAttribute('ry'));
        ellipse.setAttribute('rx', rx * to);
        ellipse.setAttribute('ry', ry * to);
        this.activeAnimations.push({ type: 'shrink', element: ellipse });
        return;
      }
    }

    // Fallback: apply shrink to the text spans themselves
    const spans = this.board.findText(target);
    if (spans) {
      const to = params.to || 0.85;
      const duration = params.duration || 800;
      spans.forEach(span => {
        span.classList.add('anim--shrink');
        span.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;
        span.style.transform = `scale(${to})`;
        span.style.opacity = `${to}`;
      });
      this.activeAnimations.push({ type: 'shrink', elements: spans });
    }
  }

  _grow(target, params) {
    const spans = this.board.findText(target);
    if (!spans) return;

    const to = params.to || 1.15;
    const duration = params.duration || 800;
    spans.forEach(span => {
      span.classList.add('anim--grow');
      span.style.transition = `transform ${duration}ms ease`;
      span.style.transform = `scale(${to})`;
      span.style.transformOrigin = 'center bottom';
    });
    this.activeAnimations.push({ type: 'grow', elements: spans });
  }

  _crossout(target, params) {
    const spans = this.board.findText(target);
    if (!spans || spans.length === 0) return;

    const duration = params.duration || 600;

    // Wrap all target spans in a crossout container
    const firstSpan = spans[0];
    const parent = firstSpan.parentNode;
    const wrapper = document.createElement('span');
    wrapper.className = 'anim--crossout-wrapper';

    // Insert wrapper before first span
    parent.insertBefore(wrapper, firstSpan);

    // Move all target spans into wrapper
    spans.forEach(span => {
      wrapper.appendChild(span);
      span.classList.add('anim--crossout-text');
    });

    // Create the strikethrough line
    const line = document.createElement('span');
    line.className = 'anim--crossout-line';
    line.style.animationDuration = `${duration}ms`;
    wrapper.appendChild(line);

    this.activeAnimations.push({ type: 'crossout', element: wrapper });
  }

  _connect(target, target2, params) {
    if (!target2) return;
    const fromSpans = this.board.findText(target);
    const toSpans = this.board.findText(target2);
    if (fromSpans && toSpans) {
      this.annotator.arrow(fromSpans, toSpans);
    }
  }

  _pulse(target, params) {
    const spans = this.board.findText(target);
    if (!spans) return;

    const duration = params.duration || 1500;
    const count = params.count || 3;

    spans.forEach(span => {
      span.classList.add('anim--pulse');
      span.style.animationDuration = `${duration / count}ms`;
      span.style.animationIterationCount = `${count}`;
    });

    // Remove pulse class after animation completes
    setTimeout(() => {
      spans.forEach(span => span.classList.remove('anim--pulse'));
    }, duration);

    this.activeAnimations.push({ type: 'pulse', elements: spans });
  }

  _fade(target, params) {
    const spans = this.board.findText(target);
    if (!spans) return;

    const to = params.to || 0.3;
    const duration = params.duration || 800;
    spans.forEach(span => {
      span.classList.add('anim--fade');
      span.style.transition = `opacity ${duration}ms ease`;
      span.style.opacity = `${to}`;
    });
    this.activeAnimations.push({ type: 'fade', elements: spans });
  }

  // --- Helpers ---

  _findAnnotation(targetText, type) {
    // Search annotator's stored annotations for one that matches this target text
    for (const ann of this.annotator.annotations) {
      if (ann.type !== type) continue;

      // Check if the annotation's elements contain the target text
      const annText = ann.elements.map(el => el.textContent).join('');
      if (annText.includes(targetText) || targetText.includes(annText)) {
        return ann;
      }
    }
    return null;
  }

  clearAll() {
    // Remove all animation classes
    document.querySelectorAll('[class*="anim--"]').forEach(el => {
      el.style.transform = '';
      el.style.opacity = '';
      el.style.transition = '';
      el.classList.forEach(cls => {
        if (cls.startsWith('anim--')) el.classList.remove(cls);
      });
    });

    // Unwrap crossout wrappers
    document.querySelectorAll('.anim--crossout-wrapper').forEach(wrapper => {
      const parent = wrapper.parentNode;
      while (wrapper.firstChild) {
        if (wrapper.firstChild.classList?.contains('anim--crossout-line')) {
          wrapper.firstChild.remove();
        } else {
          parent.insertBefore(wrapper.firstChild, wrapper);
        }
      }
      wrapper.remove();
    });

    this.activeAnimations = [];
  }
}

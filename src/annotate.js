// Annotation layer — SVG overlay for highlights, underlines, circles, arrows
// Works with the Board's findText() to locate elements, then draws overlays

export class Annotator {
  constructor(boardContainer) {
    this.boardContainer = boardContainer;
    this.svg = null;
    this.annotations = [];
    this.resizeObserver = null;
    this.init();
  }

  init() {
    // Create SVG overlay
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.classList.add('annotation-layer');
    this.svg.setAttribute('pointer-events', 'none');
    this.boardContainer.appendChild(this.svg);

    // Resize observer to update annotations on scroll/resize
    this.resizeObserver = new ResizeObserver(() => this.redraw());
    this.resizeObserver.observe(this.boardContainer);

    // Also redraw on scroll
    this.boardContainer.addEventListener('scroll', () => this.redraw(), { passive: true });
  }

  highlight(charSpans, color = 'accent') {
    if (!charSpans || charSpans.length === 0) return;

    const colorClass = `annotation--${color}`;
    charSpans.forEach(span => {
      span.classList.add('annotated', 'annotated--highlight', colorClass);
    });

    this.annotations.push({ type: 'highlight', elements: charSpans, color });
  }

  underline(charSpans) {
    if (!charSpans || charSpans.length === 0) return;

    charSpans.forEach(span => {
      span.classList.add('annotated', 'annotated--underline');
    });

    this.annotations.push({ type: 'underline', elements: charSpans });
  }

  circle(charSpans) {
    if (!charSpans || charSpans.length === 0) return;

    // Get bounding rect of the span group relative to the SVG
    const groupId = `circle-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // Add a wrapper class to the spans for styling
    charSpans.forEach(span => {
      span.classList.add('annotated', 'annotated--circled');
      span.dataset.circleGroup = groupId;
    });

    this.annotations.push({ type: 'circle', elements: charSpans, groupId });
    this._drawCircle(charSpans, groupId);
  }

  arrow(fromSpans, toSpans) {
    if (!fromSpans || !toSpans || fromSpans.length === 0 || toSpans.length === 0) return;

    const arrowId = `arrow-${Date.now()}`;
    this.annotations.push({ type: 'arrow', from: fromSpans, to: toSpans, arrowId });
    this._drawArrow(fromSpans, toSpans, arrowId);
  }

  // Redraw all SVG annotations (circles, arrows)
  redraw() {
    // Clear SVG
    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild);
    }

    // Re-add defs
    this._ensureDefs();

    // Redraw
    for (const ann of this.annotations) {
      if (ann.type === 'circle') {
        this._drawCircle(ann.elements, ann.groupId);
      } else if (ann.type === 'arrow') {
        this._drawArrow(ann.from, ann.to, ann.arrowId);
      }
    }
  }

  clearAll() {
    // Remove CSS classes
    this.boardContainer.querySelectorAll('.annotated').forEach(el => {
      el.classList.remove(
        'annotated', 'annotated--highlight', 'annotated--underline',
        'annotated--circled',
        'annotation--accent', 'annotation--warm', 'annotation--cool'
      );
    });

    // Clear SVG
    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild);
    }

    this.annotations = [];
  }

  destroy() {
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.svg) this.svg.remove();
  }

  // --- internal SVG drawing ---

  _ensureDefs() {
    let defs = this.svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

      // Arrowhead marker
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      marker.setAttribute('id', 'arrowhead');
      marker.setAttribute('markerWidth', '10');
      marker.setAttribute('markerHeight', '7');
      marker.setAttribute('refX', '10');
      marker.setAttribute('refY', '3.5');
      marker.setAttribute('orient', 'auto');

      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
      polygon.setAttribute('fill', 'var(--chalk-annotation-circle)');

      marker.appendChild(polygon);
      defs.appendChild(marker);
      this.svg.appendChild(defs);
    }
  }

  _getGroupBounds(elements) {
    const containerRect = this.boardContainer.getBoundingClientRect();
    const scrollTop = this.boardContainer.scrollTop;
    const scrollLeft = this.boardContainer.scrollLeft;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      const x = rect.left - containerRect.left + scrollLeft;
      const y = rect.top - containerRect.top + scrollTop;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + rect.width);
      maxY = Math.max(maxY, y + rect.height);
    }

    return {
      x: minX, y: minY,
      width: maxX - minX,
      height: maxY - minY,
      cx: (minX + maxX) / 2,
      cy: (minY + maxY) / 2
    };
  }

  _drawCircle(elements, groupId) {
    const bounds = this._getGroupBounds(elements);
    const padding = 8;

    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', bounds.cx);
    ellipse.setAttribute('cy', bounds.cy);
    ellipse.setAttribute('rx', bounds.width / 2 + padding);
    ellipse.setAttribute('ry', bounds.height / 2 + padding);
    ellipse.setAttribute('class', 'annotation-circle');
    ellipse.dataset.groupId = groupId;

    this.svg.appendChild(ellipse);
  }

  _drawArrow(fromEls, toEls, arrowId) {
    const fromBounds = this._getGroupBounds(fromEls);
    const toBounds = this._getGroupBounds(toEls);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', fromBounds.cx + fromBounds.width / 2 + 5);
    line.setAttribute('y1', fromBounds.cy);
    line.setAttribute('x2', toBounds.cx - toBounds.width / 2 - 5);
    line.setAttribute('y2', toBounds.cy);
    line.setAttribute('class', 'annotation-arrow');
    line.setAttribute('marker-end', 'url(#arrowhead)');
    line.dataset.arrowId = arrowId;

    this.svg.appendChild(line);
  }
}

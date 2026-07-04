// Mock lesson data for prototyping
// Each lesson is a sequence of "segments" — text blocks + annotation/animation commands
// The streaming engine plays through these in order
//
// Segment types:
//   heading    — { level, text }
//   text       — { text }  (supports inline math with $...$ delimiters)
//   math       — { text }  (LaTeX block equation, rendered via KaTeX)
//   code       — { text }  (plain code block, monospace)
//   annotation — { action, target, color }
//   animate    — { action, target, target2, params }

export const lessons = [
  {
    id: 'intro-derivatives',
    title: 'Introduction to Derivatives',
    subject: 'Calculus',
    segments: [
      {
        type: 'heading',
        level: 1,
        text: 'What is a Derivative?'
      },
      {
        type: 'text',
        text: 'A derivative measures how a function changes as its input changes. Think of it as the instantaneous rate of change — the slope of the function at any given point.'
      },
      {
        type: 'annotation',
        action: 'highlight',
        target: 'instantaneous rate of change',
        color: 'accent'
      },
      {
        type: 'animate',
        action: 'pulse',
        target: 'instantaneous rate of change',
        params: { duration: 1500, count: 2 }
      },
      {
        type: 'text',
        text: 'If you\'re driving a car, your speedometer shows your instantaneous speed — that\'s a derivative. It tells you how your position is changing right now, not over the whole trip.'
      },
      {
        type: 'annotation',
        action: 'underline',
        target: 'speedometer'
      },
      {
        type: 'heading',
        level: 2,
        text: 'The Formal Definition'
      },
      {
        type: 'text',
        text: 'Mathematically, the derivative of $f(x)$ is defined as:'
      },
      {
        type: 'math',
        text: "f'(x) = \\lim_{h \\to 0} \\frac{f(x + h) - f(x)}{h}"
      },
      {
        type: 'text',
        text: 'This formula says: take a tiny step $h$ from $x$, measure how much $f$ changes, then divide by the step size. As $h$ gets infinitely small, you get the exact slope.'
      },
      {
        type: 'annotation',
        action: 'highlight',
        target: 'tiny step',
        color: 'warm'
      },
      {
        type: 'heading',
        level: 2,
        text: 'A Simple Example'
      },
      {
        type: 'text',
        text: 'Let\'s find the derivative of $f(x) = x^2$. Using our formula:'
      },
      {
        type: 'math',
        text: "f'(x) = \\lim_{h \\to 0} \\frac{(x+h)^2 - x^2}{h}"
      },
      {
        type: 'text',
        text: 'Expanding the numerator:'
      },
      {
        type: 'math',
        text: "= \\lim_{h \\to 0} \\frac{x^2 + 2xh + h^2 - x^2}{h}"
      },
      {
        type: 'text',
        text: 'Notice that $x^2$ and $-x^2$ cancel out:'
      },
      // Animation: the x² terms cross out as the tutor says "cancel out"
      {
        type: 'annotation',
        action: 'highlight',
        target: 'cancel out',
        color: 'warm'
      },
      {
        type: 'math',
        text: "= \\lim_{h \\to 0} \\frac{2xh + h^2}{h} = \\lim_{h \\to 0}(2x + h)"
      },
      {
        type: 'text',
        text: 'As $h$ shrinks toward zero, the $h$ term vanishes and we\'re left with just $2x$.'
      },
      // Animation: fade the "h term" as the tutor says it vanishes
      {
        type: 'animate',
        action: 'fade',
        target: 'vanishes',
        params: { to: 0.3, duration: 1000 }
      },
      {
        type: 'math',
        text: "f'(x) = 2x"
      },
      // Animation: pulse the final result
      {
        type: 'animate',
        action: 'pulse',
        target: '2x',
        params: { duration: 1800, count: 3 }
      },
      {
        type: 'text',
        text: 'So the derivative of $x^2$ is $2x$. This means at any point $x$, the slope of the curve is twice that $x$ value. At $x = 3$, the slope is $6$. At $x = -1$, the slope is $-2$.'
      },
      {
        type: 'annotation',
        action: 'underline',
        target: 'the slope of the curve is twice that'
      },
      {
        type: 'heading',
        level: 2,
        text: 'Why Does This Matter?'
      },
      {
        type: 'text',
        text: 'Derivatives are everywhere in science and engineering. They describe velocity (how position changes), acceleration (how velocity changes), and rates of growth in biology, economics, and machine learning.'
      },
      {
        type: 'annotation',
        action: 'highlight',
        target: 'velocity',
        color: 'cool'
      },
      {
        type: 'annotation',
        action: 'highlight',
        target: 'acceleration',
        color: 'cool'
      },
      // Animation: draw arrow connecting velocity → acceleration
      {
        type: 'animate',
        action: 'connect',
        target: 'velocity',
        target2: 'acceleration'
      },
      {
        type: 'text',
        text: 'The key insight is this: a derivative turns a curve into a number at every point. It transforms "what is the function doing?" into "how fast is it doing it?"'
      },
      {
        type: 'annotation',
        action: 'highlight',
        target: 'a derivative turns a curve into a number at every point',
        color: 'accent'
      },
      // Final pulse on the key insight
      {
        type: 'animate',
        action: 'pulse',
        target: 'a derivative turns a curve into a number at every point',
        params: { duration: 2000, count: 2 }
      }
    ]
  },
  {
    id: 'photosynthesis',
    title: 'Photosynthesis',
    subject: 'Biology',
    segments: [
      {
        type: 'heading',
        level: 1,
        text: 'How Plants Make Food'
      },
      {
        type: 'text',
        text: 'Photosynthesis is the process by which plants convert light energy into chemical energy. It\'s the foundation of almost all life on Earth — without it, there would be no food chain.'
      },
      {
        type: 'annotation',
        action: 'highlight',
        target: 'convert light energy into chemical energy',
        color: 'accent'
      },
      {
        type: 'heading',
        level: 2,
        text: 'The Equation'
      },
      {
        type: 'text',
        text: 'The overall reaction can be summarized as:'
      },
      {
        type: 'math',
        text: '6\\text{CO}_2 + 6\\text{H}_2\\text{O} + \\text{light energy} \\longrightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2'
      },
      {
        type: 'text',
        text: 'In plain English: carbon dioxide plus water, powered by sunlight, produces glucose and oxygen. The plant keeps the glucose for energy, and releases the oxygen — which is what we breathe.'
      },
      {
        type: 'annotation',
        action: 'underline',
        target: 'glucose'
      },
      {
        type: 'annotation',
        action: 'underline',
        target: 'oxygen'
      },
      // Animation: connect glucose and oxygen — they're both products
      {
        type: 'animate',
        action: 'connect',
        target: 'glucose',
        target2: 'oxygen'
      },
      {
        type: 'heading',
        level: 2,
        text: 'Two Stages'
      },
      {
        type: 'text',
        text: 'Photosynthesis happens in two stages. The light-dependent reactions occur in the thylakoid membranes and capture light energy. The Calvin cycle occurs in the stroma and uses that energy to fix carbon into glucose.'
      },
      {
        type: 'annotation',
        action: 'highlight',
        target: 'light-dependent reactions',
        color: 'warm'
      },
      {
        type: 'annotation',
        action: 'highlight',
        target: 'Calvin cycle',
        color: 'cool'
      },
      // Animation: connect the two stages
      {
        type: 'animate',
        action: 'connect',
        target: 'light-dependent reactions',
        target2: 'Calvin cycle'
      },
      {
        type: 'text',
        text: 'Think of it like a two-step factory: Stage 1 generates the power (ATP and NADPH). Stage 2 uses that power to build the product (glucose). Neither stage works without the other.'
      },
      {
        type: 'annotation',
        action: 'highlight',
        target: 'ATP and NADPH',
        color: 'warm'
      },
      {
        type: 'animate',
        action: 'pulse',
        target: 'Neither stage works without the other',
        params: { duration: 1500, count: 2 }
      }
    ]
  }
];

export function getLesson(id) {
  return lessons.find(l => l.id === id) || lessons[0];
}

export function getLessonList() {
  return lessons.map(({ id, title, subject }) => ({ id, title, subject }));
}

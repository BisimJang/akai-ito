import Matter from 'matter-js';

export class PhysicsEngine {
  constructor(container) {
    this.container = container;
    this.bodiesMap = new Map(); // label -> Body
    
    // Setup Matter.js Engine
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    
    // Default gravity should be 0 until AI explicitly sets it
    this.engine.world.gravity.y = 0;
    
    // The physics canvas should span the entire container but not block clicks
    this.render = Matter.Render.create({
      element: this.container,
      engine: this.engine,
      options: {
        width: this.container.clientWidth,
        height: this.container.clientHeight,
        background: 'transparent',
        wireframes: false,
        pixelRatio: window.devicePixelRatio
      }
    });
    
    this.render.canvas.className = 'physics-canvas';
    
    // Keep canvas sized correctly on resize
    window.addEventListener('resize', () => {
      this._updateCanvasSize();
    });

    Matter.Render.run(this.render);
    
    // Create runner
    this.runner = Matter.Runner.create();
    Matter.Runner.run(this.runner, this.engine);
  }

  // Update canvas size to match container
  _updateCanvasSize() {
    if (!this.container || this.container.clientWidth === 0) return;
    this.render.canvas.width = this.container.clientWidth * window.devicePixelRatio;
    this.render.canvas.height = this.container.clientHeight * window.devicePixelRatio;
    this.render.options.width = this.container.clientWidth;
    this.render.options.height = this.container.clientHeight;
  }

  // Handle a scene segment from the AI
  run(sceneSegment) {
    const { action, params = {} } = sceneSegment;
    
    // Ensure the visual panel is visible
    if (this.container.style.display === 'none') {
      this.container.style.display = 'flex';
      // Give the layout a frame to update before spawning things
      requestAnimationFrame(() => {
        this._updateCanvasSize();
        this._runAction(action, params);
      });
      return;
    }
    
    this._runAction(action, params);
  }

  _runAction(action, params) {
    
    // Dimensions relative to the container width/height
    const cx = this.container.clientWidth / 2;
    const cy = this.container.clientHeight / 2;

    switch (action) {
      case 'spawn': {
        const { label, shape, x = cx, y = cy, size = 40, width = 100, height = 40, isStatic = false, restitution = 0.8, color = '#7eb8f7' } = params;
        let body;
        
        const renderStyle = {
          fillStyle: color,
          strokeStyle: '#ffffff',
          lineWidth: 2
        };

        if (shape === 'circle') {
          body = Matter.Bodies.circle(x, y, size, { isStatic, restitution, render: renderStyle, label });
        } else if (shape === 'rectangle') {
          body = Matter.Bodies.rectangle(x, y, width, height, { isStatic, restitution, render: renderStyle, label });
        }

        if (body) {
          this.bodiesMap.set(label, body);
          Matter.World.add(this.world, body);
        }
        break;
      }
      
      case 'apply_force': {
        const { target, x = 0, y = -0.05 } = params;
        const body = this.bodiesMap.get(target);
        if (body) {
          Matter.Body.applyForce(body, body.position, { x, y });
        }
        break;
      }
      
      case 'set_gravity': {
        const { x = 0, y = 1 } = params;
        this.engine.world.gravity.x = x;
        this.engine.world.gravity.y = y;
        break;
      }
      
      case 'clear':
        this.clearAll();
        break;

      default:
        console.warn(`PhysicsEngine: unknown action "${action}"`);
    }
  }

  clearAll() {
    Matter.World.clear(this.world);
    Matter.Engine.clear(this.engine);
    this.bodiesMap.clear();
    
    // Reset gravity to default (0)
    this.engine.world.gravity.x = 0;
    this.engine.world.gravity.y = 0;
  }
  
  destroy() {
    Matter.Render.stop(this.render);
    Matter.Runner.stop(this.runner);
    this.render.canvas.remove();
  }
}

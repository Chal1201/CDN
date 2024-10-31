// cameaminwitheffects64.js

class Camera {
    constructor(options = {}) {
        this.position = options.position || { x: 0, y: 0, z: 0 };
        this.target = options.target || { x: 0, y: 0, z: 0 };
        this.debug = options.debug || false;
        this.listeners = {};
    }

    moveTo(newPosition, duration = 1000, easing = easeInOutQuad) {
        const start = { ...this.position };
        const change = {
            x: newPosition.x - start.x,
            y: newPosition.y - start.y,
            z: newPosition.z - start.z
        };
        this.animateProperty('position', start, change, duration, easing);
    }

    lookAt(newTarget, duration = 1000, easing = easeInOutQuad) {
        const start = { ...this.target };
        const change = {
            x: newTarget.x - start.x,
            y: newTarget.y - start.y,
            z: newTarget.z - start.z
        };
        this.animateProperty('target', start, change, duration, easing);
    }

    animateProperty(property, start, change, duration, easing) {
        const startTime = performance.now();
        const step = (currentTime) => {
            const time = Math.min(1, (currentTime - startTime) / duration);
            this[property].x = start.x + change.x * easing(time);
            this[property].y = start.y + change.y * easing(time);
            this[property].z = start.z + change.z * easing(time);
            
            if (this.debug) this.logDebugInfo(property);

            if (time < 1) {
                requestAnimationFrame(step);
            } else {
                this.triggerEvent(property + 'Complete');
            }
        };
        requestAnimationFrame(step);
    }

    on(event, callback) {
        this.listeners[event] = this.listeners[event] || [];
        this.listeners[event].push(callback);
    }

    triggerEvent(event) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(this));
        }
    }

    logDebugInfo(property) {
        console.log(`${property}:`, this[property]);
    }
}

// Easing functions for smooth animations
function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function easeOutQuad(t) {
    return t * (2 - t);
}

function easeInQuad(t) {
    return t * t;
}

function linear(t) {
    return t;
}

// Animation Manager for controlling animation sequences
class AnimationManager {
    constructor(camera) {
        this.camera = camera;
        this.queue = [];
        this.isAnimating = false;
    }

    addAnimation(callback, duration = 1000, easing = easeInOutQuad) {
        this.queue.push({ callback, duration, easing });
        if (!this.isAnimating) this.nextAnimation();
    }

    nextAnimation() {
        if (this.queue.length === 0) {
            this.isAnimating = false;
            return;
        }

        this.isAnimating = true;
        const { callback, duration, easing } = this.queue.shift();
        callback(duration, easing, () => this.nextAnimation());
    }

    resetQueue() {
        this.queue = [];
    }
}

// Debug utilities
class DebugOverlay {
    constructor(camera) {
        this.camera = camera;
        this.container = document.createElement('div');
        this.container.style = `
            position: fixed;
            bottom: 0;
            left: 0;
            padding: 8px;
            background: rgba(0, 0, 0, 0.5);
            color: white;
            font-family: monospace;
        `;
        document.body.appendChild(this.container);
        this.update();
    }

    update() {
        this.container.innerHTML = `
            Position: x=${this.camera.position.x.toFixed(2)}, 
                      y=${this.camera.position.y.toFixed(2)}, 
                      z=${this.camera.position.z.toFixed(2)}<br>
            Target: x=${this.camera.target.x.toFixed(2)}, 
                    y=${this.camera.target.y.toFixed(2)}, 
                    z=${this.camera.target.z.toFixed(2)}
        `;
        requestAnimationFrame(() => this.update());
    }
}

// Usage Example
const camera = new Camera({
    position: { x: 0, y: 10, z: 30 },
    target: { x: 0, y: 0, z: 0 },
    debug: true
});
const manager = new AnimationManager(camera);
const overlay = new DebugOverlay(camera);

camera.on('positionComplete', () => console.log('Position animation complete'));
camera.on('targetComplete', () => console.log('Target animation complete'));

// Queueing camera animations
manager.addAnimation((duration, easing, onComplete) => {
    camera.moveTo({ x: 5, y: 5, z: 5 }, duration, easing);
    camera.on('positionComplete', onComplete);
}, 1500);

manager.addAnimation((duration, easing, onComplete) => {
    camera.lookAt({ x: 0, y: 5, z: 0 }, duration, easing);
    camera.on('targetComplete', onComplete);
}, 1000);

// Smooth camera reset
manager.addAnimation((duration, easing, onComplete) => {
    camera.moveTo({ x: 0, y: 10, z: 30 }, duration, easing);
    camera.lookAt({ x: 0, y: 0, z: 0 }, duration, easing);
    camera.on('positionComplete', onComplete);
}, 2000);

/**
 * REAL AI Website - Main JavaScript
 * Handles navigation, animations, parallax effects, and particle network
 */

// ============================================
// Morphing Binary Animation
// 0s and 1s that morph between shapes: Grid → Neuron → Kidneys → Galaxy → REAL AI
// ============================================
class MorphingBinary {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 400;
        this.currentShape = 0;
        this.shapes = ['grid', 'neuron', 'kidney', 'galaxy', 'text'];
        this.transitionProgress = 0;
        this.isFirstGrid = true;  // Track if we're in the initial grid phase

        // Animation states: 'holding', 'scattering', 'forming'
        this.state = 'holding';
        this.stateStartTime = Date.now();

        // Timing
        this.holdTime = 3000;      // Time to hold each shape
        this.scatterTime = 800;    // Time to scatter (short, since it's just a small neighborhood)
        this.formTime = 2500;      // Time to form new shape (with momentum)

        // For number flipping during initial grid only
        this.lastFlipTime = Date.now();
        this.flipInterval = 30;    // Flip numbers every 30ms (much faster)
        this.flipsPerFrame = 8;    // Flip multiple numbers at once

        this.colors = {
            blue: '#64bde3',   // Color for 1s (sky blue)
            darkBlue: '#3d8ab3' // Color for 0s (darker blue)
        };

        this.init();
        this.animate();
        window.addEventListener('resize', () => this.resize());
    }

    init() {
        this.resize();
        this.createParticles();
    }

    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.offsetWidth;
        this.canvas.height = container.offsetHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.scale = Math.min(this.canvas.width, this.canvas.height) * 0.35;
    }

    createParticles() {
        this.particles = [];
        const gridPositions = this.getShapePoints('grid');

        for (let i = 0; i < this.particleCount; i++) {
            const pos = gridPositions[i] || { x: this.centerX, y: this.centerY };
            const char = Math.random() > 0.5 ? '1' : '0';
            this.particles.push({
                x: pos.x,
                y: pos.y,
                startX: pos.x,  // Store starting position for smooth transitions
                startY: pos.y,
                targetX: pos.x,
                targetY: pos.y,
                char: char,
                color: char === '1' ? this.colors.blue : this.colors.darkBlue,
                size: 10 + Math.random() * 3,
                vx: 0,
                vy: 0
            });
        }
    }

    // Update color based on character (1 = light blue, 0 = dark blue)
    updateParticleColor(p) {
        p.color = p.char === '1' ? this.colors.blue : this.colors.darkBlue;
    }

    getShapePoints(shape) {
        const points = [];
        const count = this.particleCount;

        switch (shape) {
            case 'grid':
                const cols = Math.ceil(Math.sqrt(count));
                const rows = Math.ceil(count / cols);
                const spacing = this.scale * 2 / cols;
                for (let i = 0; i < count; i++) {
                    const col = i % cols;
                    const row = Math.floor(i / cols);
                    points.push({
                        x: this.centerX - this.scale + col * spacing + spacing / 2,
                        y: this.centerY - this.scale + row * spacing + spacing / 2
                    });
                }
                break;

            case 'neuron':
                // Neuron shape: cell body (soma), dendrites, and axon
                const neuronPoints = [];
                const nsc = this.scale * 0.9;
                const ncx = this.centerX;
                const ncy = this.centerY;

                // Cell body (soma) - oval shape, slightly left of center
                const somaX = ncx - nsc * 0.1;
                const somaY = ncy;
                const somaRadiusX = nsc * 0.18;
                const somaRadiusY = nsc * 0.22;

                // Soma outline
                for (let a = 0; a < Math.PI * 2; a += 0.1) {
                    neuronPoints.push({
                        x: somaX + Math.cos(a) * somaRadiusX,
                        y: somaY + Math.sin(a) * somaRadiusY
                    });
                }

                // Nucleus inside soma
                const nucleusRadius = nsc * 0.08;
                for (let a = 0; a < Math.PI * 2; a += 0.2) {
                    neuronPoints.push({
                        x: somaX + Math.cos(a) * nucleusRadius,
                        y: somaY + Math.sin(a) * nucleusRadius
                    });
                }

                // Dendrites - branching from left side of soma
                const dendriteBranches = [
                    { angle: Math.PI * 0.85, length: 0.5, branches: 3 },
                    { angle: Math.PI * 1.0, length: 0.55, branches: 4 },
                    { angle: Math.PI * 1.15, length: 0.45, branches: 3 },
                    { angle: Math.PI * 0.7, length: 0.4, branches: 2 },
                    { angle: Math.PI * 1.3, length: 0.4, branches: 2 }
                ];

                dendriteBranches.forEach(branch => {
                    const startX = somaX + Math.cos(branch.angle) * somaRadiusX;
                    const startY = somaY + Math.sin(branch.angle) * somaRadiusY;

                    // Main dendrite trunk
                    for (let t = 0; t <= 1; t += 0.05) {
                        const x = startX + Math.cos(branch.angle) * nsc * branch.length * t;
                        const y = startY + Math.sin(branch.angle) * nsc * branch.length * t;
                        neuronPoints.push({ x, y });
                    }

                    // Sub-branches
                    for (let b = 0; b < branch.branches; b++) {
                        const branchStart = 0.3 + (b / branch.branches) * 0.6;
                        const branchAngle = branch.angle + (Math.random() - 0.5) * 0.8;
                        const branchLen = 0.15 + Math.random() * 0.1;

                        const bsx = startX + Math.cos(branch.angle) * nsc * branch.length * branchStart;
                        const bsy = startY + Math.sin(branch.angle) * nsc * branch.length * branchStart;

                        for (let t = 0; t <= 1; t += 0.1) {
                            neuronPoints.push({
                                x: bsx + Math.cos(branchAngle) * nsc * branchLen * t,
                                y: bsy + Math.sin(branchAngle) * nsc * branchLen * t
                            });
                        }
                    }
                });

                // Axon - long projection to the right
                const axonStartX = somaX + somaRadiusX;
                const axonStartY = somaY;

                // Axon hillock (slight bulge where axon meets soma)
                for (let a = -0.3; a <= 0.3; a += 0.1) {
                    neuronPoints.push({
                        x: axonStartX + nsc * 0.03,
                        y: axonStartY + a * nsc * 0.1
                    });
                }

                // Main axon - slight curve
                for (let t = 0; t <= 1; t += 0.02) {
                    const curve = Math.sin(t * Math.PI * 2) * 0.03;
                    neuronPoints.push({
                        x: axonStartX + t * nsc * 0.7,
                        y: axonStartY + curve * nsc
                    });
                }

                // Axon terminals (branching at the end)
                const axonEndX = axonStartX + nsc * 0.7;
                const axonEndY = axonStartY;
                const terminalAngles = [-0.4, -0.15, 0.1, 0.35, 0.5, -0.5];

                terminalAngles.forEach(ang => {
                    for (let t = 0; t <= 1; t += 0.1) {
                        neuronPoints.push({
                            x: axonEndX + t * nsc * 0.15 * Math.cos(ang),
                            y: axonEndY + t * nsc * 0.15 * Math.sin(ang) + t * nsc * 0.08
                        });
                    }
                    // Terminal bulb
                    const bulbX = axonEndX + nsc * 0.15 * Math.cos(ang);
                    const bulbY = axonEndY + nsc * 0.15 * Math.sin(ang) + nsc * 0.08;
                    for (let a = 0; a < Math.PI * 2; a += 0.4) {
                        neuronPoints.push({
                            x: bulbX + Math.cos(a) * nsc * 0.025,
                            y: bulbY + Math.sin(a) * nsc * 0.025
                        });
                    }
                });

                // Distribute particles along neuron structure
                for (let i = 0; i < count; i++) {
                    if (i < count * 0.7) {
                        // Place on neuron outline
                        const pt = neuronPoints[i % neuronPoints.length];
                        const jitter = 0.02;
                        points.push({
                            x: pt.x + (Math.random() - 0.5) * nsc * jitter,
                            y: pt.y + (Math.random() - 0.5) * nsc * jitter
                        });
                    } else {
                        // Fill soma interior
                        const angle = Math.random() * Math.PI * 2;
                        const r = Math.random() * 0.85;
                        points.push({
                            x: somaX + Math.cos(angle) * somaRadiusX * r,
                            y: somaY + Math.sin(angle) * somaRadiusY * r
                        });
                    }
                }
                break;

            case 'kidney':
                // Single kidney with one downward blood vessel
                const kidneyOutlineParticles = Math.floor(count * 0.55);  // More on outline
                const kidneyFillParticles = Math.floor(count * 0.15);     // Less fill inside
                const kidneyVesselParticles = count - kidneyOutlineParticles - kidneyFillParticles;

                // Kidney outline points
                const kidneyOutlinePoints = [];
                const kidneyCX = this.centerX;
                const kidneyCY = this.centerY - this.scale * 0.15;
                const kidneySX = this.scale * 0.4;
                const kidneySY = this.scale * 0.6;

                // Generate kidney bean outline
                for (let i = 0; i < 80; i++) {
                    const t = (i / 80) * Math.PI * 2;
                    let r = 1;

                    // Hilum indent on the right side
                    const hilumAngle = 0;
                    let angleDiff = Math.abs(t - hilumAngle);
                    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

                    if (angleDiff < 0.7) {
                        const indentStrength = Math.cos(angleDiff * Math.PI / 1.4) * 0.35;
                        r = 1 - indentStrength;
                    }

                    r += Math.sin(t * 4) * 0.02;

                    kidneyOutlinePoints.push({
                        x: kidneyCX + Math.cos(t) * kidneySX * r,
                        y: kidneyCY + Math.sin(t) * kidneySY * r
                    });
                }

                // Blood vessel - TWO clearly separate parallel lines
                const kidneyVesselPts = [];
                const hilumX = kidneyCX + kidneySX * 0.65;
                const hilumY = kidneyCY;
                const vesselEndY = this.centerY + this.scale * 0.85;

                // Simple fixed offset between the two lines (in pixels)
                const lineOffset = 25;

                // LEFT LINE - curves out then down
                for (let t = 0; t <= 1; t += 0.005) {
                    const p0x = hilumX;
                    const p0y = hilumY;
                    const p1x = hilumX + this.scale * 0.4;
                    const p1y = hilumY + this.scale * 0.25;
                    const p2x = kidneyCX + this.scale * 0.15;
                    const p2y = vesselEndY;

                    const x = (1-t)*(1-t)*p0x + 2*(1-t)*t*p1x + t*t*p2x;
                    const y = (1-t)*(1-t)*p0y + 2*(1-t)*t*p1y + t*t*p2y;
                    kidneyVesselPts.push({ x, y });
                }

                // RIGHT LINE - exact same curve, just shifted right by lineOffset pixels
                for (let t = 0; t <= 1; t += 0.005) {
                    const p0x = hilumX + lineOffset;
                    const p0y = hilumY;
                    const p1x = hilumX + this.scale * 0.4 + lineOffset;
                    const p1y = hilumY + this.scale * 0.25;
                    const p2x = kidneyCX + this.scale * 0.15 + lineOffset;
                    const p2y = vesselEndY;

                    const x = (1-t)*(1-t)*p0x + 2*(1-t)*t*p1x + t*t*p2x;
                    const y = (1-t)*(1-t)*p0y + 2*(1-t)*t*p1y + t*t*p2y;
                    kidneyVesselPts.push({ x, y });
                }

                // Distribute particles for kidney outline
                for (let i = 0; i < kidneyOutlineParticles; i++) {
                    const pt = kidneyOutlinePoints[i % kidneyOutlinePoints.length];
                    const jitter = 0.02;
                    points.push({
                        x: pt.x + (Math.random() - 0.5) * this.scale * jitter,
                        y: pt.y + (Math.random() - 0.5) * this.scale * jitter
                    });
                }

                // Sparse fill particles inside kidney
                for (let i = 0; i < kidneyFillParticles; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = Math.random() * 0.6;
                    let angleDiff = Math.abs(angle - 0);
                    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
                    let maxR = 1;
                    if (angleDiff < 0.7) {
                        maxR = 1 - Math.cos(angleDiff * Math.PI / 1.4) * 0.35;
                    }
                    const finalR = r * maxR;
                    points.push({
                        x: kidneyCX + Math.cos(angle) * kidneySX * finalR,
                        y: kidneyCY + Math.sin(angle) * kidneySY * finalR
                    });
                }

                // Distribute particles for the blood vessel
                for (let i = 0; i < kidneyVesselParticles; i++) {
                    const pt = kidneyVesselPts[i % kidneyVesselPts.length];
                    const jitter = 0.008;
                    points.push({
                        x: pt.x + (Math.random() - 0.5) * this.scale * jitter,
                        y: pt.y + (Math.random() - 0.5) * this.scale * jitter
                    });
                }
                break;

            case 'galaxy':
                // Spiral galaxy: dense center with spiral arms extending outward
                const numArms = 2;
                const armParticles = Math.floor(count * 0.7);
                const coreParticles = count - armParticles;

                // Dense central core/bulge
                for (let i = 0; i < coreParticles; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    // Gaussian-like distribution for core density
                    const r = this.scale * 0.25 * Math.sqrt(-2 * Math.log(Math.random() + 0.01));
                    const coreR = Math.min(r, this.scale * 0.3);
                    points.push({
                        x: this.centerX + Math.cos(angle) * coreR,
                        y: this.centerY + Math.sin(angle) * coreR * 0.5 // Flatten for inclination
                    });
                }

                // Spiral arms
                for (let i = 0; i < armParticles; i++) {
                    const arm = i % numArms;
                    const progressInArm = Math.floor(i / numArms) / (armParticles / numArms);

                    // Logarithmic spiral: r = a * e^(b * theta)
                    const armOffset = (arm / numArms) * Math.PI * 2;
                    const spiralTightness = 0.3;
                    const maxRotations = 1.5;

                    const theta = progressInArm * Math.PI * 2 * maxRotations + armOffset;
                    const r = this.scale * (0.15 + progressInArm * 0.85);

                    // Add spread to arms (wider at edges)
                    const spread = 0.05 + progressInArm * 0.15;
                    const spreadX = (Math.random() - 0.5) * this.scale * spread;
                    const spreadY = (Math.random() - 0.5) * this.scale * spread * 0.5;

                    points.push({
                        x: this.centerX + Math.cos(theta) * r + spreadX,
                        y: this.centerY + Math.sin(theta) * r * 0.5 + spreadY // Flatten for inclination
                    });
                }
                break;

            case 'text':
                // "REAL" on top line, "AI" on bottom line
                const letterPatterns = this.getLetterPatterns();
                const topText = 'REAL';
                const bottomText = 'AI';

                const letterWidth = 5;
                const letterHeight = 7;
                const letterSpacing = 1;
                const lineSpacing = 2;

                // Calculate total widths
                const topWidth = topText.length * (letterWidth + letterSpacing) - letterSpacing;
                const bottomWidth = bottomText.length * (letterWidth + letterSpacing) - letterSpacing;
                const totalHeight = letterHeight * 2 + lineSpacing;

                // Collect all points from letters
                const allLetterPoints = [];

                // Top line: "REAL"
                const topStartX = -topWidth / 2;
                const topY = -totalHeight / 2;
                for (let i = 0; i < topText.length; i++) {
                    const letter = topText[i];
                    const pattern = letterPatterns[letter];
                    const offsetX = topStartX + i * (letterWidth + letterSpacing);
                    if (pattern) {
                        for (let row = 0; row < pattern.length; row++) {
                            for (let col = 0; col < pattern[row].length; col++) {
                                if (pattern[row][col]) {
                                    allLetterPoints.push({
                                        x: offsetX + col,
                                        y: topY + row
                                    });
                                }
                            }
                        }
                    }
                }

                // Bottom line: "AI"
                const bottomStartX = -bottomWidth / 2;
                const bottomY = -totalHeight / 2 + letterHeight + lineSpacing;
                for (let i = 0; i < bottomText.length; i++) {
                    const letter = bottomText[i];
                    const pattern = letterPatterns[letter];
                    const offsetX = bottomStartX + i * (letterWidth + letterSpacing);
                    if (pattern) {
                        for (let row = 0; row < pattern.length; row++) {
                            for (let col = 0; col < pattern[row].length; col++) {
                                if (pattern[row][col]) {
                                    allLetterPoints.push({
                                        x: offsetX + col,
                                        y: bottomY + row
                                    });
                                }
                            }
                        }
                    }
                }

                // Scale and center the points (compact text)
                const textScale = this.scale * 0.045;

                // Distribute particles across letter points
                for (let i = 0; i < count; i++) {
                    if (allLetterPoints.length > 0) {
                        const pt = allLetterPoints[i % allLetterPoints.length];
                        // Add slight randomness for texture
                        const jitter = 0.3;
                        points.push({
                            x: this.centerX + pt.x * textScale + (Math.random() - 0.5) * textScale * jitter,
                            y: this.centerY + pt.y * textScale + (Math.random() - 0.5) * textScale * jitter
                        });
                    }
                }
                break;

            case 'scattered':
                // Random positions spread across canvas
                for (let i = 0; i < count; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = this.scale * (0.5 + Math.random() * 1.2);
                    points.push({
                        x: this.centerX + Math.cos(angle) * r,
                        y: this.centerY + Math.sin(angle) * r
                    });
                }
                break;
        }

        return points;
    }

    // Pixel patterns for letters (5x7 grid each)
    getLetterPatterns() {
        return {
            'R': [
                [1,1,1,1,0],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,1,1,1,0],
                [1,0,1,0,0],
                [1,0,0,1,0],
                [1,0,0,0,1]
            ],
            'E': [
                [1,1,1,1,1],
                [1,0,0,0,0],
                [1,0,0,0,0],
                [1,1,1,1,0],
                [1,0,0,0,0],
                [1,0,0,0,0],
                [1,1,1,1,1]
            ],
            'A': [
                [0,0,1,0,0],
                [0,1,0,1,0],
                [1,0,0,0,1],
                [1,0,0,0,1],
                [1,1,1,1,1],
                [1,0,0,0,1],
                [1,0,0,0,1]
            ],
            'L': [
                [1,0,0,0,0],
                [1,0,0,0,0],
                [1,0,0,0,0],
                [1,0,0,0,0],
                [1,0,0,0,0],
                [1,0,0,0,0],
                [1,1,1,1,1]
            ],
            'I': [
                [1,1,1,1,1],
                [0,0,1,0,0],
                [0,0,1,0,0],
                [0,0,1,0,0],
                [0,0,1,0,0],
                [0,0,1,0,0],
                [1,1,1,1,1]
            ]
        };
    }

    // Check if we should scatter between current shape and next shape
    shouldScatter() {
        // Shapes: 0=grid, 1=brain, 2=kidney, 3=galaxy, 4=text
        // Only scatter between intermediate shapes (brain→kidney, kidney→galaxy)
        // No scatter: grid→brain (0→1) or galaxy→text (3→4)
        if (this.currentShape === 0) return false;  // grid → brain: no scatter
        if (this.currentShape === 3) return false;  // galaxy → text: no scatter
        return true;
    }

    // Check if animation should stop (at final text shape)
    isAtFinalShape() {
        return this.currentShape === 4; // text is the final shape
    }

    startScattering() {
        // Scatter to small neighborhood around current position (not far away)
        const scatterRadius = 30;  // Small neighborhood scatter
        this.particles.forEach((p) => {
            // Store current position as start
            p.startX = p.x;
            p.startY = p.y;
            // Scatter to nearby position (small radius)
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * scatterRadius;
            p.targetX = p.x + Math.cos(angle) * distance;
            p.targetY = p.y + Math.sin(angle) * distance;
        });
        this.state = 'scattering';
        this.stateStartTime = Date.now();
        this.transitionProgress = 0;

        // After first transition, no longer in first grid
        this.isFirstGrid = false;
    }

    startForming(shapeIndex) {
        const shapeName = this.shapes[shapeIndex];
        const newPositions = this.getShapePoints(shapeName);
        this.particles.forEach((p, i) => {
            // Store current position as start
            p.startX = p.x;
            p.startY = p.y;
            const target = newPositions[i] || { x: this.centerX, y: this.centerY };
            p.targetX = target.x;
            p.targetY = target.y;
        });
        this.state = 'forming';
        this.stateStartTime = Date.now();
        this.transitionProgress = 0;
    }

    update() {
        const now = Date.now();
        const stateElapsed = now - this.stateStartTime;

        // State machine
        if (this.state === 'holding') {
            // Flip numbers whenever we're holding at the grid shape
            if (this.currentShape === 0) {
                if (now - this.lastFlipTime > this.flipInterval) {
                    // Flip multiple numbers at once for faster effect
                    for (let f = 0; f < this.flipsPerFrame; f++) {
                        const randomIndex = Math.floor(Math.random() * this.particles.length);
                        const p = this.particles[randomIndex];
                        p.char = p.char === '1' ? '0' : '1';
                        this.updateParticleColor(p);
                    }
                    this.lastFlipTime = now;
                }
            }

            // After hold time, either scatter or go directly to next shape
            // But stop if we're at the final text shape
            if (stateElapsed > this.holdTime && !this.isAtFinalShape()) {
                if (this.shouldScatter()) {
                    this.startScattering();
                } else {
                    // Direct transition without scattering
                    this.isFirstGrid = false;
                    this.currentShape = this.currentShape + 1;
                    this.startForming(this.currentShape);
                }
            }

            // Keep particles at their targets (no jitter)
            this.particles.forEach(p => {
                p.x = p.targetX;
                p.y = p.targetY;
            });

        } else if (this.state === 'scattering') {
            this.transitionProgress = Math.min(1, stateElapsed / this.scatterTime);
            // Linear interpolation for scatter (no momentum/easing)
            const t = this.transitionProgress;

            // Linearly interpolate from start to target (no momentum)
            this.particles.forEach(p => {
                p.x = p.startX + (p.targetX - p.startX) * t;
                p.y = p.startY + (p.targetY - p.startY) * t;
            });

            // After scatter time, start forming next shape
            if (stateElapsed > this.scatterTime) {
                this.currentShape = (this.currentShape + 1) % this.shapes.length;
                this.startForming(this.currentShape);
            }

        } else if (this.state === 'forming') {
            this.transitionProgress = Math.min(1, stateElapsed / this.formTime);
            const ease = this.easeInOutCubic(this.transitionProgress);

            // Smoothly interpolate from start to target
            this.particles.forEach(p => {
                p.x = p.startX + (p.targetX - p.startX) * ease;
                p.y = p.startY + (p.targetY - p.startY) * ease;
            });

            // After form time, go back to holding
            if (stateElapsed > this.formTime) {
                // Snap to final positions
                this.particles.forEach(p => {
                    p.x = p.targetX;
                    p.y = p.targetY;
                });
                this.state = 'holding';
                this.stateStartTime = now;
            }
        }
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw connecting lines (only during transitions, and sparse)
        if (this.state !== 'holding') {
            for (let i = 0; i < this.particles.length; i++) {
                for (let j = i + 1; j < this.particles.length; j++) {
                    const dx = this.particles[i].x - this.particles[j].x;
                    const dy = this.particles[i].y - this.particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 50) {
                        const opacity = (1 - dist / 50) * 0.12;
                        this.ctx.strokeStyle = `rgba(100, 189, 227, ${opacity})`;
                        this.ctx.lineWidth = 0.5;
                        this.ctx.beginPath();
                        this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                        this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                        this.ctx.stroke();
                    }
                }
            }
        }

        // Draw particles (0s and 1s)
        this.particles.forEach(p => {
            this.ctx.font = `${p.size}px "SF Mono", "Monaco", "Inconsolata", monospace`;
            this.ctx.fillStyle = p.color;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(p.char, p.x, p.y);
        });
    }

    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize morphing animation when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const morphCanvas = document.getElementById('morphCanvas');
    if (morphCanvas) {
        new MorphingBinary(morphCanvas);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('header');
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('section[id]');

    // ============================================
    // Header Visibility & Scroll Effects
    // ============================================

    // Show header after initial load
    setTimeout(() => {
        header.classList.add('visible');
    }, 100);

    // Header scroll effect and parallax
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    });

    function handleScroll() {
        const scrolled = window.scrollY > 50;
        header.classList.toggle('scrolled', scrolled);

        // Update active navigation link
        updateActiveNavLink();
    }

    // ============================================
    // Mobile Navigation Toggle
    // ============================================

    if (navToggle) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');

            // Animate hamburger icon
            const spans = navToggle.querySelectorAll('span');
            if (navMenu.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.navbar') && navMenu) {
            navMenu.classList.remove('active');
            const spans = navToggle?.querySelectorAll('span');
            if (spans) {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        }
    });

    // Close menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });

    // ============================================
    // Active Navigation Link Update
    // ============================================

    function updateActiveNavLink() {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            const sectionHeight = section.clientHeight;

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href && href.includes('#') && href.endsWith('#' + current)) {
                link.classList.add('active');
            }
        });
    }

    // ============================================
    // Intersection Observer for Scroll Animations
    // ============================================

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -80px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe all animated elements
    const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right');
    animatedElements.forEach(el => {
        observer.observe(el);
    });

    // ============================================
    // Smooth Scroll for Anchor Links
    // ============================================

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const headerHeight = header.offsetHeight;
                    const targetPosition = target.offsetTop - headerHeight - 20;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // ============================================
    // Research Cards Stagger Animation
    // ============================================

    const researchCards = document.querySelectorAll('.research-card');
    researchCards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(card);
    });

    // ============================================
    // Approach Items Stagger Animation
    // ============================================

    const approachItems = document.querySelectorAll('.approach-item');
    approachItems.forEach((item, index) => {
        item.style.transitionDelay = `${index * 0.1}s`;
    });

    // ============================================
    // Stat Items Animation
    // ============================================

    const statItems = document.querySelectorAll('.stat-item');
    statItems.forEach((item, index) => {
        item.style.transitionDelay = `${index * 0.15}s`;
        observer.observe(item);
    });
});

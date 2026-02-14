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
        this.particleCount = 700;
        this.currentShape = 0;
        this.shapes = ['grid', 'neuron', 'glucose', 'galaxy'];
        this.transitionProgress = 0;
        this.isFirstGrid = true;  // Track if we're in the initial grid phase

        // Animation states: 'holding', 'scattering', 'forming'
        this.state = 'holding';
        this.stateStartTime = Date.now();

        // Timing
        this.holdTime = 5000;      // Time to hold each shape (longer to show animations)
        this.scatterTime = 800;    // Time to scatter (short, since it's just a small neighborhood)
        this.formTime = 2500;      // Time to form new shape (with momentum)

        // Shape-specific animation state
        this.neuronSignalPhase = 0;    // For neuron signal propagation
        this.glucoseTimeOffset = 0;    // For glucose real-time animation
        this.galaxyRotation = 0;       // For galaxy rotation

        // For number flipping during initial grid only
        this.lastFlipTime = Date.now();
        this.flipInterval = 30;    // Flip numbers every 30ms (much faster)
        this.flipsPerFrame = 8;    // Flip multiple numbers at once

        this.colors = {
            blue: '#64bde3',   // Color for 1s (sky blue)
            darkBlue: '#3d8ab3' // Color for 0s (darker blue)
        };

        // Galaxy image data for brightness-based placement
        this.galaxyImageData = null;
        this.galaxyImageLoaded = false;
        this.loadGalaxyImage();

        this.init();
        this.animate();
        window.addEventListener('resize', () => this.resize());
    }

    // Load the galaxy image and extract brightness data
    loadGalaxyImage() {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            // Create an offscreen canvas to read pixel data
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 64;
            tempCanvas.height = 64;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(img, 0, 0, 64, 64);

            // Extract pixel brightness data
            const imageData = tempCtx.getImageData(0, 0, 64, 64);
            this.galaxyImageData = [];

            for (let y = 0; y < 64; y++) {
                for (let x = 0; x < 64; x++) {
                    const i = (y * 64 + x) * 4;
                    // Calculate brightness (grayscale value)
                    const r = imageData.data[i];
                    const g = imageData.data[i + 1];
                    const b = imageData.data[i + 2];
                    const brightness = (r + g + b) / 3;
                    this.galaxyImageData.push({
                        x: x,
                        y: y,
                        brightness: brightness
                    });
                }
            }
            this.galaxyImageLoaded = true;
        };
        img.src = 'assets/images/hero/galaxy_image.jpg';
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
                size: 8 + Math.random() * 2,
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

            case 'glucose':
                // Glucose time-series signal - realistic CGM-style waveform (no axes)
                const signalPoints = [];
                const gsc = this.scale * 1.1;
                const gcx = this.centerX;
                const gcy = this.centerY;

                const axisStartX = gcx - gsc * 0.9;
                const axisEndX = gcx + gsc * 0.9;

                // Glucose signal - realistic pattern with meals and variations
                const signalWidth = axisEndX - axisStartX;
                const signalHeight = gsc * 1.0;  // Bigger vertical range
                const baselineY = gcy + gsc * 0.25;  // Adjust baseline for bigger swings

                // Generate realistic glucose curve points
                for (let i = 0; i <= 200; i++) {
                    const t = i / 200; // 0 to 1 across the signal
                    const x = axisStartX + t * signalWidth;

                    // Combine multiple components for realistic glucose pattern
                    let y = Math.sin(t * Math.PI * 2) * 0.15;  // Bigger base oscillation

                    // Meal spikes (3 meals: breakfast, lunch, dinner) - bigger peaks
                    y += 0.55 * Math.exp(-Math.pow((t - 0.15) * 8, 2));
                    y += 0.7 * Math.exp(-Math.pow((t - 0.45) * 7, 2));
                    y += 0.6 * Math.exp(-Math.pow((t - 0.75) * 6, 2));

                    // Small variations
                    y += (Math.sin(t * 50) * 0.04 + Math.sin(t * 80) * 0.03);

                    const canvasY = baselineY - y * signalHeight;
                    signalPoints.push({ x: x, y: canvasY, t: t });
                }

                // Distribute all particles on the signal line
                for (let i = 0; i < count; i++) {
                    const pt = signalPoints[i % signalPoints.length];
                    const jitter = 2;
                    points.push({
                        x: pt.x + (Math.random() - 0.5) * jitter,
                        y: pt.y + (Math.random() - 0.5) * jitter,
                        t: pt.t  // Store position along signal for animation
                    });
                }
                break;

            case 'galaxy':
                // Image-based galaxy: place digits where brightness is above threshold
                if (this.galaxyImageLoaded && this.galaxyImageData) {
                    // Filter pixels above brightness threshold (dark background is ~0-40)
                    const brightnessThreshold = 45;
                    const brightPixels = this.galaxyImageData.filter(p => p.brightness > brightnessThreshold);

                    // Sort by brightness to ensure we sample across the full range
                    brightPixels.sort((a, b) => b.brightness - a.brightness);

                    // Scale factor: map 64x64 image to canvas scale
                    const imageSize = 64;
                    const scaleFactor = (this.scale * 2) / imageSize;

                    // Select pixels for particles, evenly distributed across brightness levels
                    const selectedPixels = [];
                    const step = Math.max(1, Math.floor(brightPixels.length / count));

                    for (let i = 0; i < count && i * step < brightPixels.length; i++) {
                        selectedPixels.push(brightPixels[i * step]);
                    }

                    // If we need more particles, add some random ones from bright pixels
                    while (selectedPixels.length < count && brightPixels.length > 0) {
                        const randomIndex = Math.floor(Math.random() * brightPixels.length);
                        selectedPixels.push(brightPixels[randomIndex]);
                    }

                    // Convert image coordinates to canvas coordinates and store brightness
                    for (let i = 0; i < count; i++) {
                        const pixel = selectedPixels[i % selectedPixels.length];
                        // Center the image on canvas
                        const x = this.centerX + (pixel.x - imageSize / 2) * scaleFactor;
                        const y = this.centerY + (pixel.y - imageSize / 2) * scaleFactor;

                        // Add slight jitter for natural look
                        const jitter = scaleFactor * 0.3;
                        points.push({
                            x: x + (Math.random() - 0.5) * jitter,
                            y: y + (Math.random() - 0.5) * jitter,
                            brightness: pixel.brightness  // Store brightness for 0/1 assignment
                        });
                    }
                } else {
                    // Fallback: mathematical spiral if image not loaded
                    const numArms = 2;
                    const armParticles = Math.floor(count * 0.7);
                    const coreParticles = count - armParticles;

                    for (let i = 0; i < coreParticles; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const r = this.scale * 0.25 * Math.sqrt(-2 * Math.log(Math.random() + 0.01));
                        const coreR = Math.min(r, this.scale * 0.3);
                        points.push({
                            x: this.centerX + Math.cos(angle) * coreR,
                            y: this.centerY + Math.sin(angle) * coreR * 0.5
                        });
                    }

                    for (let i = 0; i < armParticles; i++) {
                        const arm = i % numArms;
                        const progressInArm = Math.floor(i / numArms) / (armParticles / numArms);
                        const armOffset = (arm / numArms) * Math.PI * 2;
                        const theta = progressInArm * Math.PI * 2 * 1.5 + armOffset;
                        const r = this.scale * (0.15 + progressInArm * 0.85);
                        const spread = 0.05 + progressInArm * 0.15;
                        const spreadX = (Math.random() - 0.5) * this.scale * spread;
                        const spreadY = (Math.random() - 0.5) * this.scale * spread * 0.5;
                        points.push({
                            x: this.centerX + Math.cos(theta) * r + spreadX,
                            y: this.centerY + Math.sin(theta) * r * 0.5 + spreadY
                        });
                    }
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
        // Shapes: 0=grid, 1=neuron, 2=glucose, 3=galaxy
        // Only scatter between intermediate shapes (neuron→glucose, glucose→galaxy)
        // No scatter: grid→neuron (0→1)
        if (this.currentShape === 0) return false;  // grid → neuron: no scatter
        return true;
    }

    // Check if animation should stop (at final galaxy shape)
    isAtFinalShape() {
        return this.currentShape === 3; // galaxy is the final shape
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

            // For galaxy shape, assign 0/1 based on brightness from image
            if (shapeName === 'galaxy' && target.brightness !== undefined) {
                // Brighter pixels get '1', darker visible pixels get '0'
                const midBrightness = 120;
                p.char = target.brightness > midBrightness ? '1' : '0';
                this.updateParticleColor(p);
            }

            // For glucose shape, store the signal position for animation
            if (shapeName === 'glucose' && target.t !== undefined) {
                p.signalT = target.t;
            }
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
            const shapeName = this.shapes[this.currentShape];

            // Grid shape: random number flipping
            if (shapeName === 'grid') {
                if (now - this.lastFlipTime > this.flipInterval) {
                    for (let f = 0; f < this.flipsPerFrame; f++) {
                        const randomIndex = Math.floor(Math.random() * this.particles.length);
                        const p = this.particles[randomIndex];
                        p.char = p.char === '1' ? '0' : '1';
                        this.updateParticleColor(p);
                    }
                    this.lastFlipTime = now;
                }
            }

            // Neuron shape: signal propagation from axon terminals (right) to dendrites (left)
            if (shapeName === 'neuron') {
                this.neuronSignalPhase += 0.005;  // Signal speed
                const signalWidth = 0.04; // Narrow signal band
                const cycleLength = 2.2; // Full cycle
                const phase = this.neuronSignalPhase % cycleLength;

                // Soma position (where axon meets cell body)
                const somaX = 0.45;

                this.particles.forEach(p => {
                    // Normalize x position (0 = left/dendrites, 1 = right/axon terminals)
                    const normalizedX = (p.targetX - (this.centerX - this.scale)) / (this.scale * 2);

                    let isLit = false;

                    // Phase 1: Signal travels from axon terminal (right) to soma (0 to 1.0)
                    if (phase < 1.0) {
                        const signalPos = 1 - (phase / 1.0) * (1 - somaX); // Move from 1.0 to somaX
                        const distFromSignal = Math.abs(normalizedX - signalPos);
                        if (distFromSignal < signalWidth) {
                            isLit = true;
                        }
                    }
                    // Phase 2: Signal spreads through soma and into dendrites (1.0 to 1.8)
                    else if (phase < 1.8) {
                        const dendritePhase = (phase - 1.0) / 0.8; // 0 to 1 during this phase
                        const signalPos = somaX - dendritePhase * somaX; // Move from somaX to 0
                        const distFromSignal = Math.abs(normalizedX - signalPos);

                        // Wider signal as it spreads through dendrites
                        const spreadWidth = signalWidth * (1 + dendritePhase * 0.5);
                        if (distFromSignal < spreadWidth) {
                            isLit = true;
                        }

                        // Twinkling at dendrite ends (left side, x < 0.2)
                        if (normalizedX < 0.2 && dendritePhase > 0.5) {
                            // Random twinkling - more frequent
                            if (Math.random() < 0.12) {
                                isLit = true;
                            }
                        }
                    }
                    // Phase 3: Extended twinkling at dendrite ends (1.8 to 2.4)
                    else if (phase < 2.4) {
                        // Sustained twinkles at dendrite ends
                        if (normalizedX < 0.2) {
                            if (Math.random() < 0.15) {
                                isLit = true;
                            }
                        }
                    }
                    // Phase 4: Fade out period (2.4 to 2.8)
                    else {
                        const fadePhase = (phase - 2.4) / 0.4;
                        // Fading twinkles at dendrite ends
                        if (normalizedX < 0.2 && Math.random() < 0.1 * (1 - fadePhase)) {
                            isLit = true;
                        }
                    }

                    p.char = isLit ? '1' : '0';
                    this.updateParticleColor(p);
                });
            }

            // Glucose shape: real-time signal animation with dynamic shape changes
            if (shapeName === 'glucose') {
                this.glucoseTimeOffset += 0.002;  // Slow animation
                const baseAmplitude = 12;

                this.particles.forEach(p => {
                    const t = p.signalT || 0;

                    // Multiple wave components for more organic movement
                    // Wave 1: Traveling wave (moves along the signal like new data coming in)
                    const travelingWave = Math.sin((t * 3 - this.glucoseTimeOffset * 2) * Math.PI * 2) * baseAmplitude;

                    // Wave 2: Breathing/pulsing effect (whole signal expands/contracts)
                    const breathingWave = Math.sin(this.glucoseTimeOffset * 0.8) * 6;

                    // Wave 3: Peak modulation (peaks grow and shrink)
                    const peakMod = Math.sin(this.glucoseTimeOffset * 0.5) * 0.3 + 1;
                    const isPeak = (t > 0.1 && t < 0.2) || (t > 0.4 && t < 0.5) || (t > 0.7 && t < 0.8);
                    const peakEffect = isPeak ? (peakMod - 1) * 25 : 0;

                    // Combine all effects
                    p.y = p.targetY + travelingWave + breathingWave - peakEffect;
                    p.x = p.targetX;

                    // Dynamic 0/1 based on position in the traveling wave
                    const wavePhase = Math.sin((t * 3 - this.glucoseTimeOffset * 2) * Math.PI * 2);
                    p.char = wavePhase > 0 ? '1' : '0';
                    this.updateParticleColor(p);
                });
            }

            // Galaxy shape: slow rotation
            if (shapeName === 'galaxy') {
                this.galaxyRotation += 0.0005; // Very slow rotation speed
                const cosR = Math.cos(this.galaxyRotation);
                const sinR = Math.sin(this.galaxyRotation);

                this.particles.forEach(p => {
                    // Rotate around center
                    const dx = p.targetX - this.centerX;
                    const dy = p.targetY - this.centerY;
                    p.x = this.centerX + dx * cosR - dy * sinR;
                    p.y = this.centerY + dx * sinR + dy * cosR;
                });
            }

            // For shapes without special animation, keep at target
            if (shapeName === 'grid') {
                this.particles.forEach(p => {
                    p.x = p.targetX;
                    p.y = p.targetY;
                });
            }

            // After hold time, either scatter or go directly to next shape
            // Grid shape has shorter hold time (half)
            let currentHoldTime = this.holdTime;
            if (shapeName === 'grid') currentHoldTime = this.holdTime / 2;
            if (shapeName === 'neuron') currentHoldTime = this.holdTime + 500;
            if (stateElapsed > currentHoldTime && !this.isAtFinalShape()) {
                if (this.shouldScatter()) {
                    this.startScattering();
                } else {
                    this.isFirstGrid = false;
                    this.currentShape = this.currentShape + 1;
                    this.startForming(this.currentShape);
                }
            }

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
        if (!e.target.closest('header') && navMenu) {
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

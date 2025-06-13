const canvas = document.getElementById('sunflower-canvas');
const ctx = canvas.getContext('2d');
const geminiButton = document.getElementById('gemini-button');
const audioOverlay = document.getElementById('audio-overlay');
const startButton = document.getElementById('start-button');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
let hearts = [];
let stars = [];
let cats = [];
let fireflies = [];
let shootingStars = [];
let easterEggCatRevealed = false;

let animationFrame = 0;
let isGenerating = false;
let isAudioReady = false;

const sunflowerCount = 11;
const baseSunflowerSize = 20;
const starCount = 150;
const fireflyCount = 20;
let groundLevel = canvas.height - 70;

let targetTextLines = ["Você é o meu sol"];
let displayedTextLines = [""];
let currentLineIndex = 0;
let currentCharIndex = 0;
let typingFrameDelay = 3;

let heartSound, catSoundSynth, defaultMusic, catMusicSynths = [];
let currentlyPlayingSynth = null;

function initAudio() {
    heartSound = new Tone.PolySynth(Tone.Synth, {
        polyphony: 8,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.2 }
    }).toDestination();
    heartSound.volume.value = -10;
    catSoundSynth = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.4 } }).toDestination();
    catSoundSynth.volume.value = -12;
    const reverb = new Tone.Reverb({ decay: 4, wet: 0.3 }).toDestination();
    const createMusic = (sequence, volume = -24) => {
        const synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle8' },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 1.0 }
        }).connect(reverb);
        synth.volume.value = -Infinity;
        const seq = new Tone.Sequence((time, note) => {
            synth.triggerAttackRelease(note, "8n", time);
        }, sequence, "8n").start(0);
        return { synth, seq, volume };
    };
    const default_melody = [["D4", "A4"], "F#4", "D4", null, "A4", "F#4", "D4", ["A4", "E5"], "C#5", "A4", null, "E5", "C#5", "A4", ["B4", "F#5"], "D5", "B4", null, "F#5", "D5", "B4", ["G4", "D5"], "B4", "G4", null, "D5", "B4", "G4"];
    defaultMusic = createMusic(default_melody, -26);
    const cat1_melody = [["G4", "D5", "B5"], null, "G5", "D5", "B4", null, ["C5", "G5", "E5"], null];
    const cat2_melody = [["A3", "E4"], "C4", "G4", null, ["D4", "A4"], "F4", "C5", null];
    const cat3_melody = [["F4", "C5"], null, "A4", null, ["A#3", "F4"], null, "D4", null];
    const easter_egg_melody = [["E4", "B4"], "G#4", null, "A4", "E4", "G#4", null];
    catMusicSynths.push(createMusic(cat1_melody).synth);
    catMusicSynths.push(createMusic(cat2_melody).synth);
    catMusicSynths.push(createMusic(cat3_melody).synth);
    catMusicSynths.push(createMusic(easter_egg_melody).synth);
    defaultMusic.synth.volume.rampTo(defaultMusic.volume, 1.0);
    currentlyPlayingSynth = defaultMusic.synth;
    Tone.Transport.bpm.value = 100;
    Tone.Transport.start();
    isAudioReady = true;
}

function switchMusic(targetSynth) {
    const FADE_TIME = 1.0;
    if (currentlyPlayingSynth === targetSynth) {
        currentlyPlayingSynth.volume.rampTo(-Infinity, FADE_TIME);
        defaultMusic.synth.volume.rampTo(defaultMusic.volume, FADE_TIME);
        currentlyPlayingSynth = defaultMusic.synth;
        return;
    }
    if (currentlyPlayingSynth) {
        currentlyPlayingSynth.volume.rampTo(-Infinity, FADE_TIME);
    }
    targetSynth.volume.rampTo(-26, FADE_TIME);
    currentlyPlayingSynth = targetSynth;
}

class Star {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * groundLevel;
        this.radius = Math.random() * 1.5 + 0.5;
        this.initialOpacity = Math.random() * 0.5 + 0.2;
        this.opacity = this.initialOpacity;
        this.fadeDirection = Math.random() > 0.5 ? 1 : -1;
    }
    update() {
        this.opacity += 0.005 * this.fadeDirection;
        if (this.opacity > this.initialOpacity + 0.3 || this.opacity < 0.1) this.fadeDirection *= -1;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.fill();
    }
}
class ShootingStar {
    constructor() {
        this.x = Math.random() * canvas.width * 1.5;
        this.y = Math.random() * canvas.height * 0.2;
        this.len = Math.random() * 80 + 10;
        this.speed = Math.random() * 5 + 3;
        this.size = Math.random() * 1 + 0.5;
        this.opacity = 1;
    }
    update() {
        this.x -= this.speed;
        if (this.x < -this.len) {
            this.x = canvas.width + this.len;
            this.y = Math.random() * canvas.height * 0.2;
        }
    }
    draw() {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.len, this.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.lineWidth = this.size;
        ctx.stroke();
    }
}
class Firefly {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = groundLevel - Math.random() * (groundLevel * 0.4);
        this.radius = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = 0;
        this.blinkSpeed = 0.02 + Math.random() * 0.03;
        this.phase = Math.random() * Math.PI * 2;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
        if (this.y > groundLevel || this.y < groundLevel * 0.6) this.speedY *= -1;
        this.opacity = Math.abs(Math.sin(this.phase + animationFrame * this.blinkSpeed));
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 150, ${this.opacity})`;
        ctx.shadowColor = `rgba(255, 255, 150, ${this.opacity})`;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}
class Sunflower {
    constructor(x, y, size, isSpecial = false) {
        this.x = x; this.y = y; this.size = size;
        this.angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
        this.swayAngle = Math.random() * Math.PI;
        this.swaySpeed = Math.random() * 0.008 + 0.002;
        this.isSpecial = isSpecial;
    }
    draw() {
        ctx.beginPath();
        const stemTopX = this.x + Math.sin(this.swayAngle) * 5;
        const stemTopY = this.y;
        ctx.moveTo(this.x, groundLevel);
        ctx.quadraticCurveTo(this.x, (this.y + groundLevel) / 2, stemTopX, stemTopY);
        ctx.strokeStyle = '#285c1e'; ctx.lineWidth = this.size / 8;
        ctx.stroke();
        ctx.save();
        ctx.translate(stemTopX, stemTopY); ctx.rotate(this.angle);
        const petalCount = 16; const petalLength = this.size * 2.5; const petalWidth = this.size * 0.8;
        ctx.strokeStyle = '#DAA520'; ctx.lineWidth = 0.5;
        for (let i = 0; i < petalCount; i++) {
            ctx.save();
            ctx.rotate(i * Math.PI * 2 / petalCount);
            const petalGradient = ctx.createLinearGradient(0, 0, petalLength, 0);
            petalGradient.addColorStop(0, '#FFD700'); petalGradient.addColorStop(1, '#FFA500');
            ctx.fillStyle = petalGradient;
            ctx.beginPath();
            ctx.moveTo(this.size * 0.4, 0);
            ctx.quadraticCurveTo(this.size, petalWidth / 2, petalLength, 0);
            ctx.quadraticCurveTo(this.size, -petalWidth / 2, this.size * 0.4, 0);
            ctx.fill(); ctx.stroke();
            ctx.restore();
        }
        const centerGradient = ctx.createRadialGradient(0, 0, 1, 0, 0, this.size);
        centerGradient.addColorStop(0, '#53351B'); centerGradient.addColorStop(0.8, '#654321');
        ctx.fillStyle = centerGradient;
        ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
    update() {
        const targetAngle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
        let angleDiff = targetAngle - this.angle;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        this.angle += angleDiff * 0.03; this.swayAngle += this.swaySpeed;
        this.draw();
    }
}
class Cat {
    constructor(x, y, type, scale = 0.8, facingRight = true) {
        this.x = x; this.y = y; this.type = type; this.scale = scale;
        this.facingRight = facingRight; this.tailSway = Math.random() * Math.PI * 2;
        this.headTilt = 0;
        this.blinkTimeout = Math.floor(Math.random() * 200) + 100;
        this.blinkDuration = 5;
        this.isBlinking = false;
        this.isPlayingSound = false;
        this.patch1 = { rot: Math.random() * Math.PI, x: -5, y: -8, size: 10 };
        this.patch2 = { rot: Math.random() * Math.PI, x: 15, y: 5, size: 8 };
        this.musicSynth = null;
        this.isEasterEgg = (type === 'orange_face');
        if (this.isEasterEgg) {
            this.y = y + 30;
            this.targetY = y;
        }
    }
    makeSound() {
        if (!isAudioReady || this.isPlayingSound) return;
        let notes = ["C5", "E5", "G5"];
        if (this.type === 'calico') { notes = ["E5", "G5", "B5"]; }
        if (this.type === 'white_beige') { notes = ["G5", "B5", "D6"]; }
        if (this.type === 'orange_face') { notes = ["D5", "F#5", "A5"]; }
        this.isPlayingSound = true;
        const now = Tone.now();
        catSoundSynth.triggerAttackRelease(notes[0], "16n", now);
        catSoundSynth.triggerAttackRelease(notes[1], "16n", now + 0.1);
        catSoundSynth.triggerAttackRelease(notes[2], "16n", now + 0.2);
        setTimeout(() => { this.isPlayingSound = false; }, 400);
    }
    update() {
        if (this.isEasterEgg && this.y > this.targetY) {
            this.y -= 0.5;
        }
        this.tailSway += 0.05;
        this.headTilt = Math.sin(this.tailSway * 0.7) * 0.08;
        this.blinkTimeout--;
        if (this.blinkTimeout <= 0) {
            this.isBlinking = true;
            if (this.blinkTimeout <= -this.blinkDuration) {
                this.isBlinking = false;
                this.blinkTimeout = Math.floor(Math.random() * 300) + 150;
            }
        }
        this.draw();
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y); ctx.scale(this.scale * (this.facingRight ? 1 : -1), this.scale);
        ctx.beginPath(); ctx.moveTo(-25, -5);
        const tailControlX = -50 + Math.sin(this.tailSway) * 5;
        const tailControlY = -40;
        ctx.quadraticCurveTo(tailControlX, tailControlY, -35, -15); ctx.lineWidth = 4;
        switch(this.type) {
            case 'siamese': ctx.strokeStyle = '#a08d7e'; break;
            case 'calico': ctx.strokeStyle = '#D2691E'; break;
            case 'white_beige': ctx.strokeStyle = '#e3d5c8'; break;
            case 'orange_face': ctx.strokeStyle = '#ffA500'; break;
        }
        ctx.stroke();
        const bodyGradient = ctx.createRadialGradient(0, 0, 5, 0, 0, 30);
        if (this.type === 'siamese') {
            bodyGradient.addColorStop(0, '#f2e6d9'); bodyGradient.addColorStop(1, '#d4c3b5');
        } else {
            bodyGradient.addColorStop(0, '#ffffff'); bodyGradient.addColorStop(1, '#e8e8e8');
        }
        ctx.fillStyle = bodyGradient; ctx.beginPath();
        ctx.ellipse(0, 0, 28, 20, 0, 0, Math.PI * 2); ctx.fill();
        if (this.type === 'calico') {
            this.drawPatch(this.patch1.x, this.patch1.y, this.patch1.size, this.patch1.rot, '#000000');
            this.drawPatch(this.patch2.x, this.patch2.y, this.patch2.size, this.patch2.rot, '#D2691E');
        }
        if (this.type === 'white_beige') {
            this.drawPatch(this.patch1.x, this.patch1.y, this.patch1.size, this.patch1.rot, '#e3d5c8');
            this.drawPatch(this.patch2.x, this.patch2.y, this.patch2.size, this.patch2.rot, '#d4c3b5');
        }
        ctx.save();
        ctx.rotate(this.headTilt);
        const headX = 20; const headY = -15;
        ctx.fillStyle = (this.type === 'siamese') ? '#f2e6d9' : '#ffffff';
        ctx.beginPath(); ctx.arc(headX, headY, 15, 0, Math.PI * 2); ctx.fill();
        this.drawEar(headX, headY, (this.type === 'siamese') ? '#654321' : (this.type === 'orange_face') ? '#ffA500' : '#f2b28c');
        const faceColor = (this.type === 'siamese' || this.type === 'orange_face') ? (this.type === 'siamese' ? '#a08d7e' : '#ffA500') : 'transparent';
        this.drawFace(headX, headY, faceColor);
        ctx.restore();
        ctx.restore();
    }
    drawPatch(x, y, size, rotation, color) {
        ctx.fillStyle = color; ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.7, rotation, 0, Math.PI * 2);
        ctx.fill();
    }
    drawEar(hx, hy, color) {
        ctx.fillStyle = color; ctx.beginPath();
        ctx.moveTo(hx - 15, hy - 5); ctx.lineTo(hx - 5, hy - 20); ctx.lineTo(hx, hy - 5); ctx.fill();
        if (this.type === 'calico') ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(hx + 15, hy - 5); ctx.lineTo(hx + 5, hy - 20); ctx.lineTo(hx, hy - 5); ctx.fill();
    }
    drawFace(hx, hy, color) {
        ctx.fillStyle = color; ctx.beginPath();
        ctx.ellipse(hx, hy, 16, 15, 0, 0, Math.PI * 2); ctx.fill();
        if (this.isBlinking) {
            ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(hx - 7, hy); ctx.lineTo(hx - 3, hy);
            ctx.moveTo(hx + 3, hy); ctx.lineTo(hx + 7, hy);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#000'; ctx.beginPath();
            ctx.arc(hx - 5, hy, 2, 0, Math.PI * 2); ctx.arc(hx + 5, hy, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
class Heart {
    constructor(x, y) {
        this.x = x; this.y = y; this.size = Math.random() * 15 + 15;
        this.speedY = Math.random() * 0.8 + 0.4; this.speedX = Math.random() - 0.5;
        this.opacity = 1; this.life = 0; this.maxLife = 200;
        if (isAudioReady) {
            heartSound.triggerAttackRelease("C6", "8n");
        }
    }
    update() {
        this.y -= this.speedY; this.x += this.speedX;
        this.opacity = 1 - (this.life / this.maxLife); this.life++;
    }
    draw() {
        ctx.save(); ctx.globalAlpha = this.opacity; ctx.font = `${this.size}px Arial`;
        ctx.fillStyle = `rgba(255, 105, 180, ${this.opacity})`;
        ctx.fillText('❤️', this.x, this.y); ctx.restore();
    }
}
async function generatePoem() {
    if (isGenerating) return;
    isGenerating = true; geminiButton.disabled = true; geminiButton.textContent = "Gerando...";
    setNewText(["..."]);
    
    // A chamada agora aponta para a nossa função segura no Netlify
    try {
        const response = await fetch('/.netlify/functions/get-poem');
        if (!response.ok) throw new Error(`Server error! status: ${response.status}`);
        const result = await response.json();
        if (result.poem) {
            setNewText(result.poem.split('\n').filter(line => line.trim() !== ''));
        } else {
            throw new Error("Resposta da API inválida.");
        }
    } catch (error) {
        console.error("Erro ao gerar poema:", error);
        setNewText(["Não foi possível gerar um poema.", "Tente novamente."]);
    } finally {
        isGenerating = false;
        geminiButton.disabled = false;
        geminiButton.textContent = "✨ Gerar um Novo Poema";
    }
}
function setNewText(newLines) {
    targetTextLines = newLines;
    displayedTextLines = new Array(targetTextLines.length).fill("");
    currentLineIndex = 0;
    currentCharIndex = 0;
}
function updateAndDrawText() {
    if (currentLineIndex < targetTextLines.length) {
        if (animationFrame % typingFrameDelay === 0) {
            if (currentCharIndex < targetTextLines[currentLineIndex].length) {
                displayedTextLines[currentLineIndex] += targetTextLines[currentLineIndex][currentCharIndex];
                currentCharIndex++;
            } else {
                currentLineIndex++;
                currentCharIndex = 0;
            }
        }
    }
    ctx.save();
    ctx.font = '28px "Dancing Script", cursive';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(255, 182, 193, 0.8)'; ctx.shadowBlur = 10;
    displayedTextLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, 60 + (index * 35));
    });
    ctx.restore();
}
function init() {
    sunflowers = []; stars = []; cats = []; fireflies = []; shootingStars = [];
    easterEggCatRevealed = false;
    if (canvas.width <= 0) return;
    const spacing = canvas.width / (sunflowerCount + 1);
    const specialSunflowerIndex = Math.floor(sunflowerCount / 2);
    for (let i = 0; i < sunflowerCount; i++) {
        const x = spacing * (i + 1) + (Math.random() - 0.5) * 30;
        const y = groundLevel - (Math.random() * 180 + 80);
        const size = baseSunflowerSize - (Math.abs(x - canvas.width / 2) / (canvas.width / 2)) * 8 + Math.random() * 5;
        sunflowers.push(new Sunflower(x, y, size, i === specialSunflowerIndex));
    }
    for (let i = 0; i < starCount; i++) { stars.push(new Star()); }
    for (let i = 0; i < fireflyCount; i++) { fireflies.push(new Firefly()); }
    for (let i = 0; i < 2; i++) { shootingStars.push(new ShootingStar()); }
    cats.push(new Cat(canvas.width * 0.20, groundLevel, 'calico', 0.8, true));
    cats.push(new Cat(canvas.width * 0.70, groundLevel, 'siamese', 0.9, false));
    cats.push(new Cat(canvas.width * 0.90, groundLevel, 'white_beige', 0.85, true));
    if (isAudioReady) {
        cats[0].musicSynth = catMusicSynths[0];
        cats[1].musicSynth = catMusicSynths[1];
        cats[2].musicSynth = catMusicSynths[2];
    }
}
function animate() {
    if (isAudioReady) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animationFrame++;
        stars.forEach(s => { s.update(); s.draw(); });
        shootingStars.forEach(s => { s.update(); s.draw(); });
        const groundGradient = ctx.createLinearGradient(0, groundLevel, 0, canvas.height);
        groundGradient.addColorStop(0, '#183114');
        groundGradient.addColorStop(1, '#0f1f0c');
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, groundLevel, canvas.width, canvas.height);
        fireflies.forEach(f => { f.update(); f.draw(); });
        const allObjects = [...cats, ...sunflowers].sort((a, b) => a.y - b.y);
        allObjects.forEach(obj => obj.update());
        hearts.forEach((heart, index) => {
            heart.update(); heart.draw();
            if (heart.life >= heart.maxLife) hearts.splice(index, 1);
        });
        updateAndDrawText();
    }
    requestAnimationFrame(animate);
}
startButton.addEventListener('click', () => {
    Tone.start().then(() => {
        initAudio();
        init();
        audioOverlay.style.display = 'none';
    });
});
geminiButton.addEventListener('click', generatePoem);
canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
canvas.addEventListener('click', e => {
    if (!isAudioReady) return;
    let somethingClicked = false;
    cats.forEach(cat => {
        const dist = Math.hypot(cat.x - e.clientX, cat.y - e.clientY);
        if (dist < 50) {
            cat.makeSound();
            switchMusic(cat.musicSynth);
            for (let i = 0; i < 5; i++) hearts.push(new Heart(cat.x, cat.y));
            somethingClicked = true;
        }
    });
    if (somethingClicked) return;
    sunflowers.forEach(s => {
        const dist = Math.hypot(s.x - e.clientX, s.y - e.clientY);
        if (dist < s.size * 2) {
            if (s.isSpecial && !easterEggCatRevealed) {
                const newCat = new Cat(s.x, groundLevel, 'orange_face', 0.8, s.x > canvas.width / 2);
                newCat.musicSynth = catMusicSynths[3];
                cats.push(newCat);
                easterEggCatRevealed = true;
            } else {
                hearts.push(new Heart(s.x, s.y));
            }
            somethingClicked = true;
        }
    });
});
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    groundLevel = canvas.height - 70;
    animationFrame = 0;
    if (isAudioReady) {
        if (currentlyPlayingSynth) {
            currentlyPlayingSynth.volume.rampTo(-Infinity, 0.1);
        }
        defaultMusic.synth.volume.rampTo(defaultMusic.volume, 1.0);
        currentlyPlayingSynth = defaultMusic.synth;
    }
    init();
    setNewText(["Você é o meu sol"]);
});
init();
animate();


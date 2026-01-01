/**
 * AR Fireworks - Main Application
 */

class ARFireworkApp {
    constructor() {
        // DOM Elements
        this.startScreen = document.getElementById('start-screen');
        this.arScreen = document.getElementById('ar-screen');
        this.errorScreen = document.getElementById('error-screen');
        this.startBtn = document.getElementById('start-btn');
        this.retryBtn = document.getElementById('retry-btn');
        this.exitBtn = document.getElementById('exit-btn');
        this.freezeBtn = document.getElementById('freeze-btn');
        this.video = document.getElementById('camera-video');
        this.frozenCanvas = document.getElementById('frozen-canvas');
        this.canvas = document.getElementById('fireworks-canvas');

        // State
        this.stream = null;
        this.fireworkSystem = null;
        this.isFrozen = false;

        this.init();
    }

    init() {
        // Bind events
        this.startBtn.addEventListener('click', () => this.startAR());
        this.retryBtn.addEventListener('click', () => this.startAR());
        this.exitBtn.addEventListener('click', () => this.exitAR());
        this.freezeBtn.addEventListener('click', () => this.toggleFreeze());

        // Initialize firework system (auto launch always on)
        this.fireworkSystem = new FireworkSystem(this.canvas);
        this.fireworkSystem.setAutoLaunch(true);

        // Handle page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.stream) {
                this.fireworkSystem.stop();
            } else if (!document.hidden && this.stream) {
                this.fireworkSystem.start();
            }
        });

        // Ensure audio works on iOS (requires user interaction)
        const resumeAudio = () => {
            if (this.fireworkSystem && this.fireworkSystem.soundSystem) {
                this.fireworkSystem.soundSystem.resume();
            }
        };
        document.addEventListener('touchstart', resumeAudio, { once: true });
        document.addEventListener('click', resumeAudio, { once: true });
    }

    toggleFreeze() {
        if (!this.isFrozen) {
            // Freeze: capture current frame
            this.freezeBackground();
            this.freezeBtn.textContent = '▶ Resume';
            this.isFrozen = true;
        } else {
            // Unfreeze: show live video
            this.unfreezeBackground();
            this.freezeBtn.textContent = '◉ Freeze';
            this.isFrozen = false;
        }
    }

    freezeBackground() {
        // Set canvas size to match video
        this.frozenCanvas.width = this.video.videoWidth;
        this.frozenCanvas.height = this.video.videoHeight;

        // Draw current video frame to frozen canvas
        const ctx = this.frozenCanvas.getContext('2d');
        ctx.drawImage(this.video, 0, 0);

        // Show frozen canvas, hide video
        this.frozenCanvas.classList.remove('hidden');
        this.video.style.display = 'none';
    }

    unfreezeBackground() {
        // Hide frozen canvas, show video
        this.frozenCanvas.classList.add('hidden');
        this.video.style.display = 'block';
    }

    async startAR() {
        try {
            // Request camera permission (prefer rear camera)
            const constraints = {
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;

            // Wait for video to load
            await new Promise((resolve) => {
                this.video.onloadedmetadata = resolve;
            });
            await this.video.play();

            // Switch to AR screen
            this.showScreen('ar');

            // Reset freeze state
            this.isFrozen = false;
            this.freezeBtn.textContent = '◉ Freeze';
            this.frozenCanvas.classList.add('hidden');
            this.video.style.display = 'block';

            // Start audio system (iOS requires user interaction)
            if (this.fireworkSystem.soundSystem) {
                this.fireworkSystem.soundSystem.resume();
            }

            // Start fireworks animation
            this.fireworkSystem.start();

        } catch (error) {
            console.error('Camera access failed:', error);
            this.showScreen('error');
        }
    }

    exitAR() {
        // Stop fireworks
        this.fireworkSystem.stop();
        this.fireworkSystem.clear();

        // Reset freeze state
        this.isFrozen = false;
        this.unfreezeBackground();

        // Stop camera
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        // Return to start screen
        this.showScreen('start');
    }

    showScreen(screen) {
        this.startScreen.classList.add('hidden');
        this.arScreen.classList.add('hidden');
        this.errorScreen.classList.add('hidden');

        switch (screen) {
            case 'start':
                this.startScreen.classList.remove('hidden');
                break;
            case 'ar':
                this.arScreen.classList.remove('hidden');
                break;
            case 'error':
                this.errorScreen.classList.remove('hidden');
                break;
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ARFireworkApp();
});

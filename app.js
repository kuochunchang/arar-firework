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
        this.video = document.getElementById('camera-video');
        this.canvas = document.getElementById('fireworks-canvas');

        // State
        this.stream = null;
        this.fireworkSystem = null;

        this.init();
    }

    init() {
        // Bindrevents
        this.startBtn.addEventListener('click', () => this.startAR());
        this.retryBtn.addEventListener('click', () => this.startAR());
        this.exitBtn.addEventListener('click', () => this.exitAR());

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

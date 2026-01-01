/**
 * AR 煙火 - 主程式
 */

class ARFireworkApp {
    constructor() {
        // DOM 元素
        this.startScreen = document.getElementById('start-screen');
        this.arScreen = document.getElementById('ar-screen');
        this.errorScreen = document.getElementById('error-screen');
        this.startBtn = document.getElementById('start-btn');
        this.retryBtn = document.getElementById('retry-btn');
        this.exitBtn = document.getElementById('exit-btn');
        this.fullscreenBtn = document.getElementById('fullscreen-btn');
        this.video = document.getElementById('camera-video');
        this.canvas = document.getElementById('fireworks-canvas');

        // 狀態
        this.stream = null;
        this.fireworkSystem = null;

        this.init();
    }

    init() {
        // 綁定事件
        this.startBtn.addEventListener('click', () => this.startAR());
        this.retryBtn.addEventListener('click', () => this.startAR());
        this.exitBtn.addEventListener('click', () => this.exitAR());
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

        // 初始化煙火系統（自動發射始終開啟）
        this.fireworkSystem = new FireworkSystem(this.canvas);
        this.fireworkSystem.setAutoLaunch(true);

        // 處理頁面可見性變化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.stream) {
                this.fireworkSystem.stop();
            } else if (!document.hidden && this.stream) {
                this.fireworkSystem.start();
            }
        });

        // 監聽全螢幕變化
        document.addEventListener('fullscreenchange', () => this.updateFullscreenButton());
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn('全螢幕請求失敗:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    updateFullscreenButton() {
        if (document.fullscreenElement) {
            this.fullscreenBtn.textContent = '⛶ 退出全螢幕';
        } else {
            this.fullscreenBtn.textContent = '⛶ 全螢幕';
        }
    }

    async startAR() {
        try {
            // 請求相機權限（優先使用後鏡頭）
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

            // 等待影片載入
            await new Promise((resolve) => {
                this.video.onloadedmetadata = resolve;
            });
            await this.video.play();

            // 切換到 AR 畫面
            this.showScreen('ar');

            // 開始煙火動畫
            this.fireworkSystem.start();

        } catch (error) {
            console.error('相機存取失敗:', error);
            this.showScreen('error');
        }
    }

    exitAR() {
        // 停止煙火
        this.fireworkSystem.stop();
        this.fireworkSystem.clear();

        // 停止相機
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        // 返回開始畫面
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

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ARFireworkApp();
});

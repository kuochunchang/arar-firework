/**
 * 煙火音效系統
 * 使用 Web Audio API 生成程式化音效
 */

class FireworkSoundSystem {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.initialized = false;
    }

    init() {
        // 延遲初始化，等待用戶互動
        this.enabled = true;
    }

    resume() {
        // 在用戶互動時創建 AudioContext（iOS 要求）
        if (!this.audioContext && this.enabled) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.initialized = true;
            } catch (e) {
                console.warn('Web Audio API not supported:', e);
                this.enabled = false;
                return;
            }
        }

        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(e => console.warn('Audio resume failed:', e));
        }
    }

    // 發射音效 - 已停用
    playLaunch() {
        // 不播放發射聲音
    }

    // 爆炸音效 - 更低沉的轟鳴
    playExplosion() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const ctx = this.audioContext;
        const now = ctx.currentTime;
        const duration = 0.8;

        // 噪音源
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // 濾波器 - 更低頻率的爆炸聲
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, now);
        filter.frequency.exponentialRampToValueAtTime(60, now + duration);

        // 增益控制
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);

        // 添加輕微的火花音
        this.playSparkle(now);
    }

    // 火花音效 - 高頻閃爍
    playSparkle(startTime) {
        if (!this.enabled || !this.audioContext) return;

        const ctx = this.audioContext;
        const now = startTime || ctx.currentTime;
        const duration = 1.0;

        // 高頻噪音
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            const decay = Math.exp(-i / (bufferSize * 0.3));
            data[i] = (Math.random() * 2 - 1) * decay * 0.3;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // 高通濾波器
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2000, now);

        // 增益控制
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now + 0.05);
    }
}

// 匯出給其他模組使用
window.FireworkSoundSystem = FireworkSoundSystem;

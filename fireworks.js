/**
 * 煙火粒子系統
 */

// 煙火色彩
const FIREWORK_COLORS = [
    '#ef4444', // 紅
    '#f97316', // 橘
    '#eab308', // 黃
    '#22c55e', // 綠
    '#06b6d4', // 青
    '#3b82f6', // 藍
    '#8b5cf6', // 紫
    '#ec4899', // 粉
];

/**
 * 單一粒子類別
 */
class Particle {
    constructor(x, y, color, velocity, size, decay, gravity) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = velocity;
        this.size = size;
        this.alpha = 1;
        this.decay = decay;
        this.gravity = gravity;
        this.trail = [];
        this.maxTrailLength = 5;
    }

    update() {
        // 儲存軌跡
        this.trail.push({ x: this.x, y: this.y, alpha: this.alpha });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        // 更新位置
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // 重力影響
        this.velocity.y += this.gravity;

        // 空氣阻力
        this.velocity.x *= 0.98;
        this.velocity.y *= 0.98;

        // 透明度衰減
        this.alpha -= this.decay;
    }

    draw(ctx) {
        // 使用添加混合模式，讓煙火與背景自然融合
        ctx.globalCompositeOperation = 'lighter';

        // 繪製軌跡
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const trailAlpha = (i / this.trail.length) * this.alpha * 0.4;
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.size * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = this.colorWithAlpha(trailAlpha);
            ctx.fill();
        }

        // 繪製粒子核心
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.colorWithAlpha(this.alpha * 0.9);
        ctx.fill();

        // 大範圍柔和光暈（讓煙火看起來更遠、更自然）
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size * 4
        );
        gradient.addColorStop(0, this.colorWithAlpha(this.alpha * 0.3));
        gradient.addColorStop(0.4, this.colorWithAlpha(this.alpha * 0.15));
        gradient.addColorStop(1, this.colorWithAlpha(0));
        ctx.fillStyle = gradient;
        ctx.fill();

        // 恢復預設混合模式
        ctx.globalCompositeOperation = 'source-over';
    }

    colorWithAlpha(alpha) {
        // 將 hex 顏色轉換為 rgba
        const hex = this.color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    isDead() {
        return this.alpha <= 0;
    }
}

/**
 * 煙火類別（包含發射和爆炸）
 */
class Firework {
    constructor(x, startY, targetY) {
        this.x = x;
        this.y = startY;
        this.targetY = targetY;
        this.color = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
        this.velocity = { x: 0, y: -12 - Math.random() * 4 };
        this.particles = [];
        this.exploded = false;
        this.trail = [];
        this.maxTrailLength = 8;
    }

    update() {
        if (!this.exploded) {
            // 發射階段
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }

            this.y += this.velocity.y;
            this.velocity.y += 0.2; // 重力減速

            // 到達目標高度或速度接近0時爆炸
            if (this.y <= this.targetY || this.velocity.y >= -2) {
                this.explode();
            }
        } else {
            // 爆炸階段 - 更新所有粒子
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update();
                if (this.particles[i].isDead()) {
                    this.particles.splice(i, 1);
                }
            }
        }
    }

    explode() {
        this.exploded = true;

        // 觸發爆炸音效回呼
        if (this.onExplode) {
            this.onExplode();
        }

        const particleCount = 200 + Math.floor(Math.random() * 100); // 更多粒子
        const explosionType = Math.random();

        // 使用多種顏色
        const colors = [this.color];
        // 增加更多顏色混合
        for (let c = 0; c < 2; c++) {
            if (Math.random() > 0.3) {
                colors.push(FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)]);
            }
        }

        for (let i = 0; i < particleCount; i++) {
            let angle, speed, color;

            if (explosionType < 0.3) {
                // 圓形爆炸
                angle = (Math.PI * 2 / particleCount) * i;
                speed = 3 + Math.random() * 5;
            } else if (explosionType < 0.6) {
                // 隨機散射
                angle = Math.random() * Math.PI * 2;
                speed = 1 + Math.random() * 7;
            } else {
                // 星形爆炸
                const t = (Math.PI * 2 / particleCount) * i;
                angle = t;
                speed = 2 + Math.abs(Math.sin(t * 3)) * 5;
            }

            color = colors[Math.floor(Math.random() * colors.length)];

            const velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };

            this.particles.push(new Particle(
                this.x,
                this.y,
                color,
                velocity,
                0.8 + Math.random() * 1, // 更細的粒子
                0.008 + Math.random() * 0.012, // 更慢衰減，持續更久
                0.04 // 稍輕的重力
            ));
        }

        // 添加核心閃光 - 更多
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3;
            this.particles.push(new Particle(
                this.x,
                this.y,
                '#ffffff',
                { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                1.5,
                0.02,
                0.02
            ));
        }

        // 添加尾焰粒子
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 2;
            this.particles.push(new Particle(
                this.x,
                this.y,
                colors[Math.floor(Math.random() * colors.length)],
                { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                0.5 + Math.random() * 0.5,
                0.015,
                0.03
            ));
        }
    }

    draw(ctx) {
        if (!this.exploded) {
            // 繪製發射軌跡
            for (let i = 0; i < this.trail.length; i++) {
                const t = this.trail[i];
                const alpha = i / this.trail.length;
                ctx.beginPath();
                ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 200, 100, ${alpha * 0.8})`;
                ctx.fill();
            }

            // 繪製煙火頭部
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();

            // 光暈
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, 15
            );
            gradient.addColorStop(0, 'rgba(255, 200, 100, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
            ctx.beginPath();
            ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        } else {
            // 繪製爆炸粒子
            for (const particle of this.particles) {
                particle.draw(ctx);
            }
        }
    }

    isDead() {
        return this.exploded && this.particles.length === 0;
    }
}

/**
 * 煙火系統管理類別
 */
class FireworkSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.fireworks = [];
        this.isRunning = false;
        this.autoLaunch = true;
        this.lastAutoLaunch = 0;
        this.autoLaunchInterval = 1500; // 1.5秒
        this.maxFireworks = 5; // 同時最多 5 個煙火，避免效能問題

        // 初始化音效系統
        this.soundSystem = new FireworkSoundSystem();
        this.soundSystem.init();

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    launch() {
        // 檢查是否已達到同時煙火上限
        if (this.fireworks.length >= this.maxFireworks) {
            return;
        }

        // 在畫面中隨機位置產生煙火（高度在畫面上半部）
        const targetX = this.canvas.width * 0.25 + Math.random() * this.canvas.width * 0.5;
        const targetY = this.canvas.height * 0.25 + Math.random() * this.canvas.height * 0.25;

        // 從目標點下方一段距離發射（模擬短距離上升）
        const launchDistance = 80 + Math.random() * 60;
        const startY = targetY + launchDistance;

        const firework = new Firework(targetX, startY, targetY);

        // 設定音效回呼
        firework.onExplode = () => {
            this.soundSystem.playExplosion();
        };

        this.fireworks.push(firework);
    }

    createExplosion(firework) {
        const particleCount = 150 + Math.floor(Math.random() * 80);
        const explosionType = Math.random();
        const colors = [firework.color];

        for (let c = 0; c < 2; c++) {
            if (Math.random() > 0.3) {
                colors.push(FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)]);
            }
        }

        for (let i = 0; i < particleCount; i++) {
            let angle, speed;

            if (explosionType < 0.3) {
                angle = (Math.PI * 2 / particleCount) * i;
                speed = 1.5 + Math.random() * 2.5; // 縮小一半
            } else if (explosionType < 0.6) {
                angle = Math.random() * Math.PI * 2;
                speed = 0.5 + Math.random() * 3.5; // 縮小一半
            } else {
                const t = (Math.PI * 2 / particleCount) * i;
                angle = t;
                speed = 1 + Math.abs(Math.sin(t * 3)) * 2.5; // 縮小一半
            }

            const color = colors[Math.floor(Math.random() * colors.length)];
            const velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };

            firework.particles.push(new Particle(
                firework.x, firework.y, color, velocity,
                0.6 + Math.random() * 0.8, // 更細的粒子
                0.012 + Math.random() * 0.015, // 稍快衰減
                0.03
            ));
        }

        // 核心閃光
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3;
            firework.particles.push(new Particle(
                firework.x, firework.y, '#ffffff',
                { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                1.5, 0.02, 0.02
            ));
        }

        // 尾焰粒子
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 2;
            firework.particles.push(new Particle(
                firework.x, firework.y,
                colors[Math.floor(Math.random() * colors.length)],
                { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                0.5 + Math.random() * 0.5, 0.015, 0.03
            ));
        }
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    }

    stop() {
        this.isRunning = false;
    }

    setAutoLaunch(enabled) {
        this.autoLaunch = enabled;
    }

    animate() {
        if (!this.isRunning) return;

        // 清除畫布（完全透明，讓相機背景可見）
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 自動發射
        const now = Date.now();
        if (this.autoLaunch && now - this.lastAutoLaunch > this.autoLaunchInterval) {
            this.launch();
            this.lastAutoLaunch = now;
            // 隨機化下次發射間隔
            this.autoLaunchInterval = 1000 + Math.random() * 2000;
        }

        // 更新和繪製所有煙火
        for (let i = this.fireworks.length - 1; i >= 0; i--) {
            this.fireworks[i].update();
            this.fireworks[i].draw(this.ctx);

            if (this.fireworks[i].isDead()) {
                this.fireworks.splice(i, 1);
            }
        }

        requestAnimationFrame(() => this.animate());
    }

    clear() {
        this.fireworks = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// 匯出給 app.js 使用
window.FireworkSystem = FireworkSystem;

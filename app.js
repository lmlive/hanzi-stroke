/**
 * 汉字笔顺动画应用
 * 基于 Hanzi Writer 库实现汉字笔顺可视化
 */

class HanziStrokeApp {
    constructor() {
        this.writer = null;
        this.currentChar = '';
        this.strokeCount = 0;
        this.animationSpeed = 1000;
        this.isAnimating = false;

        this.initElements();
        this.bindEvents();
    }

    initElements() {
        // 输入元素
        this.charInput = document.getElementById('char-input');
        this.searchBtn = document.getElementById('search-btn');
        this.errorMsg = document.getElementById('error-msg');

        // 显示元素
        this.characterTarget = document.getElementById('character-target');
        this.showGridCheckbox = document.getElementById('show-grid');
        this.showOutlineCheckbox = document.getElementById('show-outline');

        // 控制按钮
        this.animateBtn = document.getElementById('animate-btn');
        this.quizBtn = document.getElementById('quiz-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.speedSlider = document.getElementById('speed-slider');
        this.speedValue = document.getElementById('speed-value');

        // 笔画信息
        this.strokeCountEl = document.getElementById('stroke-count');
        this.currentStrokeNumEl = document.getElementById('current-stroke-num');

        // 加载指示器
        this.loadingOverlay = document.getElementById('loading-overlay');

        // 示例按钮
        this.exampleBtns = document.querySelectorAll('.example-btn');
    }

    bindEvents() {
        // 输入事件
        this.charInput.addEventListener('input', (e) => this.handleInput(e));
        this.charInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchCharacter();
        });
        this.searchBtn.addEventListener('click', () => this.searchCharacter());

        // 控制按钮事件
        this.animateBtn.addEventListener('click', () => this.animateCharacter());
        this.quizBtn.addEventListener('click', () => this.startQuiz());
        this.resetBtn.addEventListener('click', () => this.resetAnimation());

        // 网格和轮廓控制
        this.showGridCheckbox.addEventListener('change', () => this.updateDisplay());
        this.showOutlineCheckbox.addEventListener('change', () => this.updateDisplay());

        // 速度控制
        this.speedSlider.addEventListener('input', (e) => this.updateSpeed(e));

        // 示例按钮事件
        this.exampleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const char = btn.dataset.char;
                this.charInput.value = char;
                this.searchCharacter();
            });
        });
    }

    handleInput(e) {
        const value = e.target.value;
        // 只保留最后一个字符
        if (value.length > 1) {
            e.target.value = value.slice(-1);
        }

        // 验证是否为汉字
        const char = e.target.value;
        if (char && !this.isChineseChar(char)) {
            this.showError('请输入有效的汉字');
            e.target.classList.add('error');
        } else {
            this.hideError();
            e.target.classList.remove('error');
        }
    }

    isChineseChar(char) {
        const unicode = char.charCodeAt(0);
        return unicode >= 0x4e00 && unicode <= 0x9fa5;
    }

    showError(message) {
        this.errorMsg.textContent = message;
    }

    hideError() {
        this.errorMsg.textContent = '';
    }

    showLoading() {
        this.loadingOverlay.classList.remove('hidden');
    }

    hideLoading() {
        this.loadingOverlay.classList.add('hidden');
    }

    async searchCharacter() {
        const char = this.charInput.value.trim();

        if (!char) {
            this.showError('请输入一个汉字');
            return;
        }

        if (!this.isChineseChar(char)) {
            this.showError('请输入有效的汉字');
            return;
        }

        this.hideError();
        this.currentChar = char;
        this.showLoading();

        try {
            await this.loadCharacter(char);
            this.enableControls();
            this.updateStrokeInfo();
            this.autoAnimate();
        } catch (error) {
            console.error('加载失败:', error);
            this.showError(`无法加载"${char}"的笔顺数据，可能该字不在数据库中`);
        } finally {
            this.hideLoading();
        }
    }

    loadCharacter(char) {
        return new Promise((resolve, reject) => {
            // 清空容器
            this.characterTarget.innerHTML = '';

            // 计算动画速度（值越大速度越快）
            const delay = this.getAnimationDelay();

            try {
                this.writer = HanziWriter.create('character-target', char, {
                    width: 300,
                    height: 300,
                    padding: 5,
                    showOutline: this.showOutlineCheckbox.checked,
                    strokeAnimationSpeed: 1,
                    delayBetweenStrokes: delay,
                    strokeColor: '#1a1a2e',
                    radicalColor: '#e11d48',
                    outlineColor: '#94a3b8',
                    drawingWidth: 20,
                    showGrid: this.showGridCheckbox.checked,
                    gridColor: '#fecaca',
                    showStroke: true,

                    onLoadCharDataSuccess: (characterData) => {
                        this.strokeCount = characterData.strokes.length;
                        resolve();
                    },

                    onLoadCharDataError: (error) => {
                        reject(error);
                    }
                });

                // HanziWriter 的回调处理
                setTimeout(() => {
                    if (this.writer) {
                        resolve();
                    }
                }, 500);
            } catch (error) {
                reject(error);
            }
        });
    }

    getAnimationDelay() {
        // 速度值 1-5，转换为延迟毫秒数
        const speed = parseInt(this.speedSlider.value);
        const delays = [800, 600, 400, 200, 100];
        return delays[speed - 1] || 400;
    }

    updateDisplay() {
        if (this.writer && this.currentChar) {
            this.writer.updateCharacter({
                showGrid: this.showGridCheckbox.checked,
                showOutline: this.showOutlineCheckbox.checked
            });
        }
    }

    enableControls() {
        this.animateBtn.disabled = false;
        this.quizBtn.disabled = false;
        this.resetBtn.disabled = false;
        this.speedSlider.disabled = false;
    }

    disableControls() {
        this.animateBtn.disabled = true;
        this.quizBtn.disabled = true;
        this.resetBtn.disabled = true;
        this.speedSlider.disabled = true;
    }

    updateStrokeInfo() {
        this.strokeCountEl.textContent = this.strokeCount || '-';
        this.currentStrokeNumEl.textContent = '-';
    }

    updateSpeed(e) {
        const speed = parseInt(e.target.value);
        const speedMultipliers = [1.0, 1.33, 2.0, 4.0, 8.0];
        const multiplier = speedMultipliers[speed - 1] || 1.0;
        this.speedValue.textContent = multiplier.toFixed(1) + 'x';

        // 重新加载以应用新速度
        if (this.currentChar) {
            this.loadCharacter(this.currentChar).then(() => {
                this.updateStrokeInfo();
            });
        }
    }

    autoAnimate() {
        setTimeout(() => {
            this.animateCharacter();
        }, 300);
    }

    animateCharacter() {
        if (!this.writer || this.isAnimating) return;

        this.isAnimating = true;
        this.updateCurrentStroke(0);

        this.writer.animateCharacter({
            onComplete: () => {
                this.isAnimating = false;
                this.updateCurrentStroke(this.strokeCount);
            },
            onStrokeStart: (strokeNum) => {
                this.updateCurrentStroke(strokeNum + 1);
            }
        });
    }

    resetAnimation() {
        if (!this.writer) return;

        this.writer.quiz({
            showHintAfterMisses: 3,
            highlightOnComplete: true,
            onMistake: (strokeData) => {
                console.log('Mistake on stroke', strokeData);
            },
            onCorrectStroke: (strokeData) => {
                console.log('Correct stroke', strokeData);
            },
            onComplete: (summaryData) => {
                console.log('Quiz complete', summaryData);
                this.resetAnimationState();
            }
        });
    }

    startQuiz() {
        if (!this.writer) return;

        this.writer.quiz({
            showHintAfterMisses: 3,
            highlightOnComplete: true,
            onComplete: (summaryData) => {
                console.log('Quiz complete', summaryData);
            }
        });
    }

    resetAnimationState() {
        this.isAnimating = false;
        this.updateCurrentStroke(0);
    }

    updateCurrentStroke(num) {
        this.currentStrokeNumEl.textContent = num || '-';
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.hanziApp = new HanziStrokeApp();
});

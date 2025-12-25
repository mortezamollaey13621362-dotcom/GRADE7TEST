// js/modules/Listening.js

export class Listening {
    constructor() {
        this.data = null;
        this.activeTabId = null;
        this.currentAudio = null; 
        this.isSpeaking = false;
    }

    async loadData(lessonId) {
        try {
            const url = `data/lesson${lessonId}/listening.json`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Listening data not found`);
            this.data = await response.json();
            
            if (this.data.tabs && this.data.tabs.length > 0) {
                this.activeTabId = this.data.tabs[0].id;
            }
        } catch (error) {
            console.error('Error loading listening data:', error);
            this.data = { tabs: [] };
        }
    }

    getHtml() {
        if (!this.data || !this.data.tabs || this.data.tabs.length === 0) {
            return `<div class="empty-state">تمرین شنیداری یافت نشد.</div>`;
        }

        // 1. ساخت تب‌ها
        let tabsHtml = `<div class="listening-tabs">`;
        this.data.tabs.forEach(tab => {
            const isActive = tab.id === this.activeTabId ? 'active' : '';
            tabsHtml += `<button class="listening-tab-btn ${isActive}" data-tab-id="${tab.id}">${tab.title}</button>`;
        });
        tabsHtml += `</div>`;

        // 2. ساخت محتوا
        const activeTab = this.data.tabs.find(t => t.id === this.activeTabId) || this.data.tabs[0];
        let contentHtml = `<div class="listening-content-container">`;

        if (activeTab && activeTab.exercises) {
            activeTab.exercises.forEach((ex, index) => {
                contentHtml += this._renderTaskCard(ex, index);
            });
        }
        contentHtml += `</div>`;

        return `
            <div class="listening-wrapper">
                <div class="tabs-container">${tabsHtml}</div>
                ${contentHtml}
            </div>
        `;
    }

    /**
     * رندر کردن یک کارت کامل (یک تسک شنیداری)
     * شامل: دکمه پخش اصلی + لیست سوالات
     */
    _renderTaskCard(exercise, index) {
        // تولید HTML برای سوالات داخل این کارت
        let questionsHtml = `<div class="questions-list">`;
        
        if (exercise.questions) {
            exercise.questions.forEach((q, qIndex) => {
                questionsHtml += this._renderQuestionItem(q, exercise.id, qIndex);
            });
        }
        questionsHtml += `</div>`;

        return `
            <div class="exercise-card fade-in-up" style="animation-delay: ${index * 0.1}s">
                <div class="exercise-header">
                    <span class="task-title">${exercise.title || 'Listen carefully:'}</span>
                </div>
                
                <!-- بخش پخش کننده صدای اصلی -->
                <div class="audio-control-area">
                    <button class="play-audio-btn btn-gradient" data-text="${exercise.audio_text}">
                        <i class="fas fa-play"></i>
                        <span>پخش مکالمه/متن</span>
                    </button>
                    <div class="visualizer">
                        <span></span><span></span><span></span><span></span><span></span>
                    </div>
                </div>

                ${questionsHtml}
            </div>
        `;
    }

    /**
     * رندر کردن تکی سوالات بر اساس نوع (MCQ, TF, Gap)
     */
    _renderQuestionItem(question, exerciseId, index) {
        let optionsHtml = '';
        
        // تعیین کلاس گرید بر اساس نوع سوال
        let gridClass = 'options-grid';
        if (question.type === 'tf') gridClass = 'tf-grid'; // برای صحیح غلط استایل خاص داریم

        optionsHtml += `<div class="${gridClass}">`;
        
        question.options.forEach(opt => {
            optionsHtml += `
                <button class="option-btn" 
                        data-exercise-id="${exerciseId}" 
                        data-question-id="${question.id}"
                        data-correct="${opt.isCorrect}">
                    ${opt.text}
                    <span class="feedback-icon"></span>
                </button>
            `;
        });
        optionsHtml += `</div>`;

        // برای سوالات جای خالی، متن سوال را خاص نمایش می‌دهیم
        let questionText = question.text;
        if (question.type === 'gap') {
            // جایگزین کردن ______ با یک خط تیره بصری
            questionText = questionText.replace(/_+/g, '<span class="gap-line">_______</span>');
        }

        return `
            <div class="question-item">
                <span class="q-text">${index + 1}. ${questionText}</span>
                ${optionsHtml}
            </div>
        `;
    }

    bindEvents() {
        const container = document.querySelector('#section-container');
        if (!container) return;

        // 1. سوئیچ تب‌ها
        container.querySelectorAll('.listening-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.activeTabId = btn.dataset.tabId;
                this.stopPlayback();
                container.innerHTML = this.getHtml();
                this.bindEvents();
            });
        });

        // 2. پخش صدا
        container.querySelectorAll('.play-audio-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.dataset.text;
                const visualizer = btn.nextElementSibling; 
                this.playSmartAudio(text, btn, visualizer);
            });
        });

        // 3. بررسی جواب‌ها
        container.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('checked') || btn.classList.contains('disabled')) return;

                const isCorrect = btn.dataset.correct === 'true';
                const parent = btn.parentElement; // کانتینر گزینه‌ها

                // غیرفعال کردن گزینه‌های هم‌گروه
                parent.querySelectorAll('.option-btn').forEach(b => {
                    b.classList.add('disabled');
                    if (b.dataset.correct === 'true') {
                        b.classList.add('correct-answer-reveal');
                    }
                });

                btn.classList.add('checked');
                
                if (isCorrect) {
                    btn.classList.add('correct');
                    btn.querySelector('.feedback-icon').innerHTML = '<i class="fas fa-check"></i>';
                    this._playEffect('correct');
                    
                    // اگر سوال جای خالی بود، متن را در جای خالی بنویس (افکت بصری)
                    const questionContainer = parent.parentElement;
                    const gapSpan = questionContainer.querySelector('.gap-line');
                    if (gapSpan) {
                        gapSpan.textContent = btn.innerText;
                        gapSpan.style.color = '#155724';
                        gapSpan.style.borderBottom = '2px solid #28a745';
                    }

                } else {
                    btn.classList.add('wrong');
                    btn.querySelector('.feedback-icon').innerHTML = '<i class="fas fa-times"></i>';
                    this._playEffect('wrong');
                }
            });
        });
    }

    // --- ENGINE SECTION (همان موتور قدرتمند قبلی) ---

    playSmartAudio(text, btnElement, visualizerElement) {
        this.stopPlayback();

        // ریست UI
        document.querySelectorAll('.play-audio-btn').forEach(b => {
            b.innerHTML = '<i class="fas fa-play"></i> <span>پخش مکالمه/متن</span>';
            b.classList.remove('playing');
        });
        document.querySelectorAll('.visualizer').forEach(v => v.classList.remove('active'));

        // تنظیم حالت پخش
        btnElement.innerHTML = '<i class="fas fa-stop"></i> <span>توقف</span>';
        btnElement.classList.add('playing');
        if(visualizerElement) visualizerElement.classList.add('active');

        this.isSpeaking = true;

        const onEndCallback = () => {
            this.isSpeaking = false;
            if (btnElement.classList.contains('playing')) {
                btnElement.innerHTML = '<i class="fas fa-play"></i> <span>پخش مکالمه/متن</span>';
                btnElement.classList.remove('playing');
                if(visualizerElement) visualizerElement.classList.remove('active');
            }
        };

        if (navigator.onLine) {
            this._playOnlineTTS(text, onEndCallback, () => {
                setTimeout(() => { this._playOfflineTTS(text, onEndCallback); }, 50);
            });
        } else {
            this._playOfflineTTS(text, onEndCallback);
        }
    }

    _playOnlineTTS(text, onComplete, onError) {
        try {
            // برای متن‌های طولانی گوگل محدودیت کاراکتر دارد (حدود 200).
            // اگر متن طولانی است، مستقیم به آفلاین سوئیچ می‌کنیم تا نصفه پخش نشود.
            if (text.length > 180) { 
                if(onError) onError(); 
                return;
            }

            const encodedText = encodeURIComponent(text);
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=en&client=tw-ob`;
            this.currentAudio = new Audio(url);
            this.currentAudio.onended = () => { this.currentAudio = null; onComplete(); };
            this.currentAudio.onerror = () => { this.currentAudio = null; if (onError) onError(); };
            this.currentAudio.play().catch(() => { if (onError) onError(); });
        } catch (e) { if (onError) onError(); }
    }

    _playOfflineTTS(text, onComplete) {
        if (!('speechSynthesis' in window)) { onComplete(); return; }
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.85; // سرعت کمی بالاتر برای مکالمات طبیعی‌تر
        
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => (v.name.includes('Google') || v.name.includes('Microsoft')) && v.lang.includes('en'));
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onend = onComplete;
        utterance.onerror = (e) => {
            if (e.error !== 'interrupted' && e.error !== 'canceled') onComplete();
        };

        setTimeout(() => { window.speechSynthesis.speak(utterance); }, 10);
    }

    stopPlayback() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();

        document.querySelectorAll('.play-audio-btn').forEach(b => {
            b.innerHTML = '<i class="fas fa-play"></i> <span>پخش مکالمه/متن</span>';
            b.classList.remove('playing');
        });
        document.querySelectorAll('.visualizer').forEach(v => v.classList.remove('active'));
    }

    _playEffect(type) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'correct') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
            } else {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
            }
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {}
    }
}

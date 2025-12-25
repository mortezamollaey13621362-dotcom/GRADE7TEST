// js/modules/Conversation.js

export class Conversation {
    constructor() {
        this.lessonData = []; // آرایه‌ای از تمام مکالمات درس
        this.activeIndex = 0; // ایندکس تب فعال
        this.activeRole = 'all'; 
        this.isPlaying = false;
        
        // متغیرهای کنترل صدا
        this.currentAudioElement = null; // برای صدای آنلاین
        this.currentUtterance = null;    // برای صدای آفلاین
        this.speechSynthesis = window.speechSynthesis;
    }

    // لود کردن داده‌ها از JSON
    async loadData(lessonId) {
        const url = `data/lesson${lessonId}/conversation.json`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Not found: ${url}`);
            
            this.lessonData = await response.json();
            
            if (this.lessonData.length > 0) {
                this.activeIndex = 0;
            }
        } catch (error) {
            console.error("Error loading conversation data:", error);
            document.getElementById('conversation-content').innerHTML = `
                <div class="error-message">
                    خطا در بارگذاری مکالمه.<br> ${url}
                </div>`;
        }
    }

    // ساخت HTML (بدون تغییر نسبت به کد شما - حفظ ساختار UI)
    getHtml() {
        if (!this.lessonData || this.lessonData.length === 0) {
            return `<div class="error-state"><p>در حال بارگذاری مکالمه...</p></div>`;
        }

        const currentData = this.lessonData[this.activeIndex];
        const leftActor = currentData.participants.find(p => p.side === 'left');
        const rightActor = currentData.participants.find(p => p.side === 'right');

        return `
            <div class="conversation-section" id="conv-section">
                
                <!-- *** بخش تب‌ها *** -->
                <div class="conv-tabs">
                    ${this.lessonData.map((conv, index) => `
                        <button class="conv-tab-btn ${index === this.activeIndex ? 'active' : ''}" data-index="${index}">
                            ${conv.tabTitle || `مکالمه ${index + 1}`}
                        </button>
                    `).join('')}
                </div>

                <!-- صحنه نمایش -->
                <div class="conv-stage">
                    <div class="stage-actor left-actor" id="actor-${leftActor?.id}">
                        <img src="${leftActor?.avatar || 'images/avatar-placeholder.png'}" alt="${leftActor?.name}">
                    </div>
                    <div class="stage-actor right-actor" id="actor-${rightActor?.id}">
                        <img src="${rightActor?.avatar || 'images/avatar-placeholder.png'}" alt="${rightActor?.name}">
                    </div>
                </div>

                <!-- هدر -->
                <div class="conv-header">
                    <h2>${currentData.title}</h2>
                </div>

                <!-- کنترل پنل -->
                <div class="conv-controls">
                    <button class="btn-conv-control" id="btn-play-conversation">
                        <i class="fas fa-play"></i> <span>پخش مکالمه</span>
                    </button>
                    
                    <div class="role-controls">
                        <span><i class="fas fa-user-friends"></i> تمرین نقش:</span>
                        <div class="role-buttons">
                            <button class="btn-role active" data-role="all">شنونده (همه)</button>
                            ${currentData.participants.map(p => `
                                <button class="btn-role" data-role="${p.id}">من ${p.name} هستم</button>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- خطوط دیالوگ -->
                <div class="conv-lines">
                    ${currentData.lines.map((line, index) => {
                        const speaker = currentData.participants.find(p => p.id === line.speakerId);
                        
                        return `
                        <div class="conv-line ${speaker.side}" id="line-${index}" data-speaker="${line.speakerId}">
                            ${speaker.side === 'left' ? `<div class="speaker-avatar-small">${speaker.name.charAt(0)}</div>` : ''}
                            
                            <div class="line-content" data-index="${index}" data-text="${line.textEn}">
                                <span class="speaker-name">${speaker.name}</span>
                                <div class="english-text">${line.textEn}</div>
                                <div class="persian-text blurred">${line.textFa}</div>
                                <div class="play-indicator"><i class="fas fa-volume-up"></i></div>
                            </div>

                            ${speaker.side === 'right' ? `<div class="speaker-avatar-small">${speaker.name.charAt(0)}</div>` : ''}
                        </div>
                        `;
                    }).join('')}
                </div>

                <!-- بخش کلمات و نکات -->
                <div class="conv-extras">
                    ${currentData.keywords ? `
                    <div class="section-label"><i class="fas fa-spell-check"></i> کلمات کلیدی</div>
                    <div class="keywords-list">
                        ${currentData.keywords.map(k => `
                            <div class="keyword-item">
                                <div class="kw-text">
                                    <span class="kw-en">${k.en}</span>
                                    <span class="kw-fa">${k.fa}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>` : ''}

                    ${currentData.tip ? `
                    <div style="margin-top: 25px;">
                        <div class="section-label tip-label"><i class="fas fa-lightbulb"></i> نکته آموزشی</div>
                        <div class="tip-box">
                            <i class="fas fa-info-circle"></i>
                            <p>${currentData.tip.text}</p>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    bindEvents() {
        if (!this.lessonData || this.lessonData.length === 0) return;

        // سوئیچ بین تب‌ها
        const tabBtns = document.querySelectorAll('.conv-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const newIndex = parseInt(btn.dataset.index);
                if (newIndex !== this.activeIndex) {
                    this.stopPlayback();
                    this.activeIndex = newIndex;
                    const container = document.getElementById('conv-section').parentElement;
                    container.innerHTML = this.getHtml();
                    this.bindEvents();
                }
            });
        });

        // دکمه پخش/توقف
        const playBtn = document.getElementById('btn-play-conversation');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                if (this.isPlaying) {
                    this.stopPlayback();
                } else {
                    this.playAllLines();
                }
            });
        }

        // انتخاب نقش
        document.querySelectorAll('.btn-role').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-role').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.activeRole = e.target.dataset.role;
                this.stopPlayback();
            });
        });

        // پخش تکی خطوط (اصلاح شده برای استفاده از سیستم جدید)
        document.querySelectorAll('.line-content').forEach(line => {
            line.addEventListener('click', (e) => {
                if(e.target.classList.contains('persian-text')) {
                    e.target.classList.toggle('blurred');
                    return;
                }
                const index = line.dataset.index;
                const text = line.dataset.text;
                // پیدا کردن نام گوینده برای انتخاب صدای بهتر
                const speakerId = line.closest('.conv-line').dataset.speaker;
                const speakerName = line.querySelector('.speaker-name').innerText;
                
                this.stopPlayback(); 
                this.highlightLine(index, speakerId);
                
                // فراخوانی سیستم هیبرید
                this.playSmartAudio(text, speakerName); 
            });
        });
    }

    // --- منطق پخش توالی (Smart Loop) ---
    async playAllLines() {
        this.isPlaying = true;
        this.updatePlayButton(true);

        const lines = this.lessonData[this.activeIndex].lines;
        const participants = this.lessonData[this.activeIndex].participants;
        let index = 0;

        while (this.isPlaying && index < lines.length) {
            const lineData = lines[index];
            
            // پیدا کردن اطلاعات گوینده
            const speakerInfo = participants.find(p => p.id === lineData.speakerId);
            const speakerName = speakerInfo ? speakerInfo.name : 'Unknown';

            this.highlightLine(index, lineData.speakerId);

            const isUserTurn = (this.activeRole === lineData.speakerId);

            if (isUserTurn) {
                // نوبت کاربر: سکوت ۴ ثانیه‌ای برای تمرین
                await new Promise(resolve => setTimeout(resolve, 4000));
            } else {
                // نوبت سیستم: پخش هوشمند
                // اگر کاربر وسط پخش دکمه توقف را زد، خطا ندهد
                try {
                    if (this.isPlaying) {
                        await this.playSmartAudio(lineData.textEn, speakerName);
                    }
                } catch (e) {
                    console.log("Playback interrupted");
                }
                
                // مکث کوتاه بین جملات
                if(this.isPlaying) await new Promise(resolve => setTimeout(resolve, 800));
            }

            index++;
        }

        this.stopPlayback();
    }

    // ==========================================
    // 🎵 سیستم صوتی هیبرید (آنلاین + آفلاین) 🎵
    // ==========================================

    playSmartAudio(text, speakerName = 'Default') {
        return new Promise((resolve, reject) => {
            if (!text) { resolve(); return; }
            
            // کنسل کردن صداهای قبلی
            this.stopAudioOnly();

            // 1. تلاش برای پخش آنلاین (اگر اینترنت وصل است)
            if (navigator.onLine) {
                const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(text)}`;
                
                const audio = new Audio(url);
                this.currentAudioElement = audio; 

                // وقتی پخش با موفقیت تمام شد
                audio.onended = () => {
                    this.currentAudioElement = null;
                    resolve();
                };
                
                // اگر خطایی رخ داد (فیلتر، قطع نت، فرمت نامعتبر) -> برو به آفلاین
                audio.onerror = (e) => {
                    console.warn("Online TTS failed, switching to Offline TTS...");
                    this.playOfflineTTS(text, speakerName).then(resolve);
                };

                // تلاش برای پخش
                audio.play().catch(err => {
                    // برخی مرورگرها پخش اتوماتیک را بلاک می‌کنند یا نت قطع شده
                    console.warn("Audio play blocked/failed, switching to Offline TTS...");
                    this.playOfflineTTS(text, speakerName).then(resolve);
                });

            } else {
                // 2. اگر کلا آفلاین هستیم
                this.playOfflineTTS(text, speakerName).then(resolve);
            }
        });
    }

    playOfflineTTS(text, speakerName) {
        return new Promise((resolve) => {
            if (!this.speechSynthesis) {
                console.error("Browser does not support TTS");
                resolve();
                return;
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.9; // کمی شمرده‌تر

            // تلاش برای انتخاب صدای متناسب (زن/مرد)
            const voices = this.speechSynthesis.getVoices();
            let selectedVoice = null;

            // منطق ساده تشخیص جنسیت از روی اسم (می‌توانید دقیق‌تر کنید)
            const isFemale = ['Sarah', 'Mary', 'Jane', 'Alice', 'Emily'].includes(speakerName);
            const isMale = ['John', 'David', 'Mike', 'Tom', 'Jack'].includes(speakerName);

            if (isFemale) {
                // دنبال صدای زن بگرد
                selectedVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Female') || v.name.includes('Samantha'));
            } else if (isMale) {
                // دنبال صدای مرد بگرد
                selectedVoice = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Male') || v.name.includes('Daniel'));
            }

            // اگر صدای خاص پیدا نشد، اولی را بردار
            if (!selectedVoice && voices.length > 0) selectedVoice = voices[0];
            if (selectedVoice) utterance.voice = selectedVoice;

            // هندل کردن پایان پخش
            utterance.onend = () => {
                this.currentUtterance = null;
                resolve();
            };

            // هندل کردن خطا
            utterance.onerror = () => {
                this.currentUtterance = null;
                resolve(); // حتی اگر خطا داد، پروسه را قفل نکن
            };

            this.currentUtterance = utterance;
            this.speechSynthesis.speak(utterance);
        });
    }

    stopAudioOnly() {
        if (this.currentAudioElement) {
            this.currentAudioElement.pause();
            this.currentAudioElement = null;
        }
        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
        }
    }

    // ==========================================

    // --- ابزارهای کمکی ---
    highlightLine(index, speakerId) {
        document.querySelectorAll('.conv-line').forEach(l => l.classList.remove('active'));
        const domLine = document.getElementById(`line-${index}`);
        if(domLine) {
            domLine.classList.add('active');
            domLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        document.querySelectorAll('.stage-actor').forEach(actor => actor.classList.remove('is-talking'));
        
        if (speakerId) {
            const activeActor = document.getElementById(`actor-${speakerId}`);
            if (activeActor) {
                activeActor.classList.add('is-talking');
            }
        }
    }

    stopPlayback() {
        this.isPlaying = false;
        this.stopAudioOnly();

        document.querySelectorAll('.conv-line').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.stage-actor').forEach(a => a.classList.remove('is-talking'));

        this.updatePlayButton(false);
    }

    updatePlayButton(isPlaying) {
        const btn = document.getElementById('btn-play-conversation');
        if (!btn) return;
        
        if (isPlaying) {
            btn.classList.add('playing');
            btn.innerHTML = '<i class="fas fa-stop"></i> توقف';
        } else {
            btn.classList.remove('playing');
            btn.innerHTML = '<i class="fas fa-play"></i> پخش مکالمه';
        }
    }
}

// js/modules/Conversation.js
// نسخه پیشرفته با سیستم صوتی هیبرید 6 لایه‌ای + لهجه‌های متنوع

export class Conversation {
    constructor() {
        this.lessonData = []; 
        this.activeIndex = 0; 
        this.activeRole = 'all'; 
        this.isPlaying = false;
        
        // 🎵 سیستم صوتی مستقل
        this.currentAudio = null;
        this.currentUtterance = null;
        this.speechSynthesis = window.speechSynthesis;
        this.audioCache = new Map(); // کش فایل‌های محلی
        this.currentLessonId = null;
        
        // 🎭 مدیریت صداهای مرورگر
        this.availableVoices = [];
        this.voicesLoaded = false;
        this.loadVoices();
    }

    // ==========================================
    // 🎤 بارگذاری صداهای موجود در مرورگر
    // ==========================================
    loadVoices() {
        if (!this.speechSynthesis) return;

        const loadVoicesList = () => {
            this.availableVoices = this.speechSynthesis.getVoices();
            this.voicesLoaded = this.availableVoices.length > 0;
            
            if (this.voicesLoaded) {
                console.log(`✅ Loaded ${this.availableVoices.length} voices:`, 
                    this.availableVoices.map(v => `${v.name} (${v.lang})`).join(', '));
            }
        };

        loadVoicesList();
        
        // برخی مرورگرها صداها را به صورت async بارگذاری می‌کنند
        if (this.speechSynthesis.onvoiceschanged !== undefined) {
            this.speechSynthesis.onvoiceschanged = loadVoicesList;
        }
    }

    // ==========================================
    // 📊 بارگذاری داده‌ها
    // ==========================================
    async loadData(lessonId) {
        this.currentLessonId = lessonId;
        const url = `data/lesson${lessonId}/conversation.json`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Not found: ${url}`);
            
            this.lessonData = await response.json();
            
            if (this.lessonData.length > 0) {
                this.activeIndex = 0;
                await this.preloadAudioFiles(lessonId);
            }
        } catch (error) {
            console.error("❌ خطا در بارگذاری conversation:", error);
            document.getElementById('conversation-content').innerHTML = `
                <div class="error-message">
                    خطا در بارگذاری مکالمه.<br> ${url}
                </div>`;
        }
    }

    // ==========================================
    // 🎵 سیستم صوتی 6 لایه‌ای (بهبود یافته)
    // ==========================================

    /**
     * پیش‌بارگذاری فایل‌های صوتی محلی
     */
    async preloadAudioFiles(lessonId) {
        if (!this.lessonData || this.lessonData.length === 0) return;

        const currentConv = this.lessonData[this.activeIndex];
        const basePath = `data/lesson${lessonId}/audio/conversation`;

        for (let i = 0; i < currentConv.lines.length; i++) {
            const line = currentConv.lines[i];
            const audioPath = `${basePath}/line${i + 1}.mp3`;
            
            try {
                const response = await fetch(audioPath, { method: 'HEAD' });
                if (response.ok) {
                    this.audioCache.set(i, audioPath);
                }
            } catch (e) {
                // فایل وجود ندارد، از لایه‌های دیگر استفاده می‌شود
            }
        }
    }

    /**
     * پخش هوشمند با 6 لایه Fallback + لهجه‌های متنوع
     * Layer 1: Local Audio Files (conversation/line1.mp3)
     * Layer 2: Local TTS Cache (tts-cache/word.mp3)
     * Layer 3: ResponsiveVoice API (High-Quality Online TTS)
     * Layer 4: VoiceRSS API (Backup Online TTS)
     * Layer 5: Browser SpeechSynthesis با انتخاب هوشمند صدا
     * Layer 6: Silent Fallback with Visual Feedback
     */
    async playSmartAudio(text, lineIndex = null, speakerName = 'Default') {
        return new Promise(async (resolve) => {
            if (!text) { 
                resolve(); 
                return; 
            }

            // توقف صدای قبلی
            this.stopAudioOnly();

            // تأخیر کوتاه برای جلوگیری از تداخل
            await new Promise(r => setTimeout(r, 50));

            let played = false;

            // ==========================================
            // Layer 1: فایل محلی مکالمه (بالاترین کیفیت)
            // ==========================================
            if (lineIndex !== null && this.audioCache.has(lineIndex)) {
                try {
                    await this.playLocalFile(this.audioCache.get(lineIndex));
                    played = true;
                    resolve();
                    return;
                } catch (e) {
                    console.warn('⚠️ Layer 1 failed (Local Conversation File):', e.message);
                }
            }

            // ==========================================
            // Layer 2: کش TTS محلی
            // ==========================================
            if (!played && this.currentLessonId) {
                const cachePath = `data/lesson${this.currentLessonId}/audio/tts-cache/${this.sanitizeFilename(text)}.mp3`;
                try {
                    const response = await fetch(cachePath, { method: 'HEAD' });
                    if (response.ok) {
                        await this.playLocalFile(cachePath);
                        played = true;
                        resolve();
                        return;
                    }
                } catch (e) {
                    console.warn('⚠️ Layer 2 failed (TTS Cache)');
                }
            }

            // ==========================================
            // Layer 3: ResponsiveVoice (کیفیت بالا - رایگان تا 100 درخواست/روز)
            // ==========================================
            if (!played && navigator.onLine && typeof responsiveVoice !== 'undefined') {
                try {
                    await this.playResponsiveVoice(text, speakerName);
                    played = true;
                    resolve();
                    return;
                } catch (e) {
                    console.warn('⚠️ Layer 3 failed (ResponsiveVoice):', e.message);
                }
            }

            // ==========================================
            // Layer 4: VoiceRSS API (Backup آنلاین)
            // ==========================================
            if (!played && navigator.onLine) {
                try {
                    await this.playVoiceRSS(text);
                    played = true;
                    resolve();
                    return;
                } catch (e) {
                    console.warn('⚠️ Layer 4 failed (VoiceRSS):', e.message);
                }
            }

            // ==========================================
            // Layer 5: SpeechSynthesis مرورگر با انتخاب هوشمند صدا
            // ==========================================
            if (!played) {
                try {
                    await this.playBrowserTTS(text, speakerName);
                    played = true;
                    resolve();
                    return;
                } catch (e) {
                    console.warn('⚠️ Layer 5 failed (Browser TTS):', e.message);
                }
            }

            // ==========================================
            // Layer 6: Fallback بصری (هیچ صدایی موجود نیست)
            // ==========================================
            if (!played) {
                console.warn('🔇 All audio layers failed. Using visual feedback only.');
                this.showVisualFeedback(text);
                await new Promise(r => setTimeout(r, 2000));
                resolve();
            }
        });
    }

    // ==========================================
    // متدهای پخش برای هر لایه
    // ==========================================

    /**
     * پخش فایل محلی
     */
    playLocalFile(path) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(path);
            this.currentAudio = audio;

            audio.onended = () => {
                this.currentAudio = null;
                resolve();
            };

            audio.onerror = (e) => {
                this.currentAudio = null;
                reject(new Error('Failed to load local file'));
            };

            audio.play().catch(reject);
        });
    }

    /**
     * Layer 3: ResponsiveVoice (بهترین کیفیت آنلاین رایگان)
     * استفاده: قبل از بارگذاری این فایل، در HTML اضافه کنید:
     * <script src="https://code.responsivevoice.org/responsivevoice.js?key=YOUR_KEY"></script>
     */
    playResponsiveVoice(text, speakerName) {
        return new Promise((resolve, reject) => {
            if (typeof responsiveVoice === 'undefined') {
                reject(new Error('ResponsiveVoice not loaded'));
                return;
            }

            // انتخاب صدا بر اساس جنسیت
            const isFemale = this.isFemaleCharacter(speakerName);
            const voiceName = isFemale ? 'US English Female' : 'US English Male';

            responsiveVoice.speak(text, voiceName, {
                pitch: 1,
                rate: 0.9,
                volume: 1,
                onend: () => resolve(),
                onerror: (err) => reject(new Error('ResponsiveVoice error'))
            });
        });
    }

    /**
     * Layer 4: VoiceRSS (نیاز به API Key رایگان)
     * دریافت API Key: https://voicerss.org/personel (رایگان تا 350 درخواست/روز)
     */
    playVoiceRSS(text) {
        return new Promise((resolve, reject) => {
            // 🔑 API Key رایگان خود را از voicerss.org دریافت کنید
            const apiKey = 'YOUR_VOICERSS_API_KEY'; // ⚠️ جایگزین کنید
            
            if (apiKey === 'YOUR_VOICERSS_API_KEY') {
                reject(new Error('VoiceRSS API key not configured'));
                return;
            }

            // پارامترهای بهینه برای کیفیت بالا
            const params = new URLSearchParams({
                key: apiKey,
                src: text,
                hl: 'en-us',
                v: 'Mary', // یا 'John' برای مرد
                r: '0', // سرعت عادی
                c: 'MP3',
                f: '44khz_16bit_stereo' // بالاترین کیفیت
            });

            const url = `https://api.voicerss.org/?${params}`;
            const audio = new Audio(url);
            this.currentAudio = audio;

            audio.onended = () => {
                this.currentAudio = null;
                resolve();
            };

            audio.onerror = () => {
                this.currentAudio = null;
                reject(new Error('VoiceRSS failed'));
            };

            audio.play().catch(reject);
        });
    }

    /**
     * Layer 5: Browser TTS با انتخاب هوشمند صدا (بهبود یافته)
     */
    playBrowserTTS(text, speakerName) {
        return new Promise((resolve) => {
            if (!this.speechSynthesis) {
                resolve();
                return;
            }

            // اطمینان از بارگذاری صداها
            if (!this.voicesLoaded) {
                this.availableVoices = this.speechSynthesis.getVoices();
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            // ✨ انتخاب هوشمند صدا بر اساس جنسیت و کیفیت
            const selectedVoice = this.selectBestVoice(speakerName);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
                console.log(`🎤 Using voice: ${selectedVoice.name} (${selectedVoice.lang})`);
            }

            utterance.onend = () => {
                this.currentUtterance = null;
                resolve();
            };

            utterance.onerror = () => {
                this.currentUtterance = null;
                resolve();
            };

            this.currentUtterance = utterance;
            this.speechSynthesis.speak(utterance);
        });
    }

    /**
     * 🎭 انتخاب بهترین صدا بر اساس جنسیت و لهجه
     */
    selectBestVoice(speakerName) {
        if (this.availableVoices.length === 0) return null;

        const isFemale = this.isFemaleCharacter(speakerName);
        
        // لیست اولویت‌دار صداهای باکیفیت
        const priorityVoices = {
            female: [
                // Apple/iOS voices (بهترین کیفیت)
                'Samantha', 'Victoria', 'Karen', 'Moira',
                // Google voices
                'Google US English Female', 'Google UK English Female',
                // Microsoft voices
                'Microsoft Zira', 'Microsoft Hazel',
                // عمومی
                'female', 'woman'
            ],
            male: [
                'Alex', 'Daniel', 'Tom', 'Aaron',
                'Google US English Male', 'Google UK English Male',
                'Microsoft David', 'Microsoft Mark',
                'male', 'man'
            ]
        };

        const preferredList = isFemale ? priorityVoices.female : priorityVoices.male;

        // جستجوی دقیق
        for (const name of preferredList) {
            const voice = this.availableVoices.find(v => 
                v.name.toLowerCase().includes(name.toLowerCase()) &&
                v.lang.startsWith('en')
            );
            if (voice) return voice;
        }

        // Fallback: هر صدای انگلیسی
        return this.availableVoices.find(v => v.lang.startsWith('en-US')) ||
               this.availableVoices.find(v => v.lang.startsWith('en')) ||
               this.availableVoices[0];
    }

    /**
     * تشخیص جنسیت شخصیت بر اساس نام
     */
    isFemaleCharacter(name) {
        const femaleNames = [
            'Sarah', 'Mary', 'Jane', 'Alice', 'Emily', 'Emma', 'Sophia', 
            'Isabella', 'Olivia', 'Ava', 'Mia', 'Charlotte', 'Lisa',
            'Jennifer', 'Linda', 'Susan', 'Jessica', 'Ashley', 'Anna'
        ];
        return femaleNames.some(fn => name.includes(fn));
    }

    /**
     * Layer 6: نمایش بصری بدون صدا
     */
    showVisualFeedback(text) {
        const indicator = document.querySelector('.conv-line.active .play-indicator');
        if (indicator) {
            indicator.innerHTML = '<i class="fas fa-volume-mute"></i>';
            indicator.style.color = '#ff6b6b';
        }
        console.log(`📢 Visual Only: "${text}"`);
    }

    /**
     * ابزار کمکی: ساخت نام فایل امن
     */
    sanitizeFilename(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 50);
    }

    /**
     * توقف تمام صداها
     */
    stopAudioOnly() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio.src = '';
            this.currentAudio = null;
        }
        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
        }
        if (typeof responsiveVoice !== 'undefined') {
            responsiveVoice.cancel();
        }
        this.currentUtterance = null;
    }

    // ==========================================
    // 🔄 پخش توالی مکالمه
    // ==========================================
    async playAllLines() {
        this.isPlaying = true;
        this.updatePlayButton(true);

        const lines = this.lessonData[this.activeIndex].lines;
        const participants = this.lessonData[this.activeIndex].participants;
        let index = 0;

        while (this.isPlaying && index < lines.length) {
            const lineData = lines[index];
            const speakerInfo = participants.find(p => p.id === lineData.speakerId);
            const speakerName = speakerInfo ? speakerInfo.name : 'Unknown';

            this.highlightLine(index, lineData.speakerId);

            const isUserTurn = (this.activeRole === lineData.speakerId);

            if (isUserTurn) {
                // نوبت کاربر: سکوت برای تمرین
                await new Promise(resolve => setTimeout(resolve, 4000));
            } else {
                // نوبت سیستم: پخش هوشمند
                try {
                    if (this.isPlaying) {
                        await this.playSmartAudio(lineData.textEn, index, speakerName);
                    }
                } catch (e) {
                    console.log("⏸️ Playback interrupted");
                }
                
                if (this.isPlaying) {
                    await new Promise(resolve => setTimeout(resolve, 800));
                }
            }

            index++;
        }

        this.stopPlayback();
    }

    // ==========================================
    // 🎨 رابط کاربری (بدون تغییر)
    // ==========================================
    getHtml() {
        if (!this.lessonData || this.lessonData.length === 0) {
            return `<div class="error-state"><p>در حال بارگذاری مکالمه...</p></div>`;
        }

        const currentData = this.lessonData[this.activeIndex];
        const leftActor = currentData.participants.find(p => p.side === 'left');
        const rightActor = currentData.participants.find(p => p.side === 'right');

        return `
            <div class="conversation-section" id="conv-section">
                
                <!-- تب‌ها -->
                <div class="conv-tabs">
                    ${this.lessonData.map((conv, index) => `
                        <button class="conv-tab-btn ${index === this.activeIndex ? 'active' : ''}" data-index="${index}">
                            ${conv.tabTitle || `مکالمه ${index + 1}`}
                        </button>
                    `).join('')}
                </div>

                <!-- صحنه -->
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

                <!-- کنترل‌ها -->
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

                <!-- کلمات و نکات -->
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

    // ==========================================
    // 🎮 مدیریت رویدادها
    // ==========================================
    bindEvents() {
        if (!this.lessonData || this.lessonData.length === 0) return;

        // تب‌ها
        const tabBtns = document.querySelectorAll('.conv-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                const newIndex = parseInt(btn.dataset.index);
                if (newIndex !== this.activeIndex) {
                    this.stopPlayback();
                    this.activeIndex = newIndex;
                    await this.preloadAudioFiles(this.currentLessonId);
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

        // پخش تکی
        document.querySelectorAll('.line-content').forEach(line => {
            line.addEventListener('click', (e) => {
                if (e.target.classList.contains('persian-text')) {
                    e.target.classList.toggle('blurred');
                    return;
                }
                
                const index = parseInt(line.dataset.index);
                const text = line.dataset.text;
                const speakerId = line.closest('.conv-line').dataset.speaker;
                const speakerName = line.querySelector('.speaker-name').innerText;
                
                this.stopPlayback();
                this.highlightLine(index, speakerId);
                this.playSmartAudio(text, index, speakerName);
            });
        });
    }

    // ==========================================
    // 🛠️ ابزارهای کمکی
    // ==========================================
    highlightLine(index, speakerId) {
        document.querySelectorAll('.conv-line').forEach(l => l.classList.remove('active'));
        const domLine = document.getElementById(`line-${index}`);
        if (domLine) {
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

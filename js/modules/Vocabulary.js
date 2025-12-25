// js/modules/Vocabulary.js - نسخه با یک فایل مرکزی
export class Vocabulary {
    constructor(lessonManager) {
        this.lessonManager = lessonManager;
        this.words = [];
        this.allWordDetails = null; // کش برای همه کلمات
        this.loadingPromise = null; // جلوگیری از بارگذاری تکراری
    }

    /**
     * متد جدید اضافه شده برای رفع خطای init
     * این متد داده‌ها را از LessonManager دریافت می‌کند
     */
    init(lessonData) {
        if (lessonData && lessonData.vocabulary) {
            this.words = lessonData.vocabulary;
            console.log(`✅ Vocabulary loaded via init: ${this.words.length} words`);
        } else {
            // اگر داده‌ای نبود، آرایه خالی می‌گذاریم تا بعداً در render پر شود
            this.words = [];
        }
    }

    // بارگذاری همه کلمات از فایل مرکزی
    async loadAllWordDetails() {
        // اگر در حال بارگذاری است، همان Promise را برگردان
        if (this.loadingPromise) {
            return this.loadingPromise;
        }
        
        // اگر قبلاً بارگذاری شده
        if (this.allWordDetails) {
            return this.allWordDetails;
        }
        
        // شروع بارگذاری جدید
        this.loadingPromise = (async () => {
            try {
                console.log('📚 در حال بارگذاری همه کلمات...');
                const response = await fetch('data/words/all-words.json');
                
                if (!response.ok) {
                    throw new Error(`خطای HTTP: ${response.status}`);
                }
                
                const data = await response.json();
                this.allWordDetails = data.words || {};
                console.log(`✅ ${Object.keys(this.allWordDetails).length} کلمه بارگذاری شد`);
                return this.allWordDetails;
                
            } catch (error) {
                console.error('❌ خطا در بارگذاری همه کلمات:', error);
                this.allWordDetails = {}; // مقدار پیش‌فرض
                return {};
            } finally {
                this.loadingPromise = null;
            }
        })();
        
        return this.loadingPromise;
    }

    // گرفتن جزییات یک کلمه
    async getWordDetails(wordId) {
        try {
            // اول از کش حافظه چک کن
            if (this.allWordDetails && this.allWordDetails[wordId]) {
                return this.allWordDetails[wordId];
            }
            
            // اگر نه، همه کلمات را بارگذاری کن
            const allWords = await this.loadAllWordDetails();
            const details = allWords[wordId];
            
            if (!details) {
                console.warn(`⚠️ کلمه ${wordId} یافت نشد`);
                return this.createDefaultWordDetails(wordId);
            }
            
            return details;
            
        } catch (error) {
            console.error('❌ خطا در دریافت جزییات کلمه:', error);
            return this.createDefaultWordDetails(wordId);
        }
    }

    // ایجاد جزییات پیش‌فرض اگر کلمه یافت نشد
    createDefaultWordDetails(wordId) {
        // سعی کن اطلاعات اولیه را از words[] پیدا کن
        const simpleWord = this.words.find(w => w.id === wordId);
        
        return {
            id: wordId,
            word: simpleWord?.word || wordId,
            phonetic: {
                ipa: {
                    american: simpleWord?.phonetic || '/ˈwɝːd/',
                    british: simpleWord?.phonetic || '/ˈwɜːd/'
                }
            },
            level: simpleWord?.level || 'A1',
            partOfSpeech: ['noun'],
            persian: {
                main: simpleWord?.persian || 'معنی',
                short: simpleWord?.persian || 'معنی'
            },
            meanings: [{
                definition: {
                    simple: 'Word definition not available'
                },
                persianDefinition: 'تعریف در دسترس نیست',
                example: {
                    sentence: 'This is an example sentence.',
                    translation: 'این یک جمله مثال است.'
                },
                synonyms: [],
                antonyms: []
            }]
        };
    }

    async render() {
        try {
            // بارگذاری کلمات درس جاری
            const lesson = this.lessonManager.getCurrentLesson();
            if (!lesson) return '<div>درس انتخاب نشده</div>';
            
            // تغییر کوچک: اگر words قبلاً توسط init پر شده بود، دوباره دانلود نکن
            if (!this.words || this.words.length === 0) {
                 const response = await fetch(`data/lesson${lesson.id}/vocab.json`);
                 this.words = await response.json();
            }
            
            if (!this.words || this.words.length === 0) {
                return '<div>کلمه‌ای یافت نشد</div>';
            }
            
            // شروع بارگذاری پیش‌گیرانه همه کلمات (در پس‌زمینه)
            this.loadAllWordDetails().catch(() => {
                // خطا قبلاً در loadAllWordDetails هندل شده
            });
            
            let html = `
                <div class="section-header">
                    <h3 class="text-gradient"><i class="fas fa-book"></i> واژگان درس ${lesson.id}</h3>
                    <p class="section-info">${this.words.length} کلمه</p>
                    <button class="btn-action btn-gradient" onclick="app.vocabulary.startPractice()">
                        <i class="fas fa-play"></i> شروع تمرین
                    </button>
                </div>
                <div class="vocab-grid">
            `;
            
            this.words.forEach((word, index) => {
                const isLearned = this.isWordLearned(word.id);
                
                html += `
                    <div class="vocab-card zoom fade-in-delay" data-word-id="${word.id}" style="animation-delay: ${index * 0.1}s">
                        <div class="vocab-header">
                            <div>
                                <div class="vocab-word">${word.word}</div>
                                <div class="vocab-phonetic">${word.phonetic}</div>
                            </div>
                            <div class="word-status">
                                ${isLearned ? '<span class="badge learned">✓ یادگرفته</span>' : ''}
                                <span class="badge level level-${word.level.toLowerCase()}">${word.level}</span>
                            </div>
                        </div>
                        
                        <div class="vocab-meaning">${word.persian}</div>
                        
                        <div class="audio-controls-small">
                            <button class="audio-btn-small us" onclick="app.playWordAudio('${word.word}', 'us')">
                                <i class="fas fa-volume-up"></i> امریکن
                            </button>
                            <button class="audio-btn-small uk" onclick="app.playWordAudio('${word.word}', 'uk')">
                                <i class="fas fa-volume-up"></i> بریتیش
                            </button>
                        </div>
                        
                        <div class="vocab-actions">
                            <button class="details-btn btn-gradient" onclick="app.vocabulary.showWordDetails('${word.id}')">
                                <i class="fas fa-info-circle"></i> جزییات
                            </button>
                            <button class="mark-btn ${isLearned ? 'mastered' : 'learn'} btn-gradient" 
                                    onclick="app.vocabulary.toggleWord('${word.id}')">
                                <i class="fas ${isLearned ? 'fa-check-double' : 'fa-check'}"></i>
                                ${isLearned ? 'تسلط یافتم' : 'یاد گرفتم'}
                            </button>
                        </div>
                    </div>
                `;
            });
            
            html += `</div>`;
            return html;
            
        } catch (error) {
            console.error('خطا در بارگذاری واژگان:', error);
            return '<div class="error">خطا در بارگذاری کلمات</div>';
        }
    }

    async showWordDetails(wordId) {
        try {
            // بارگذاری جزییات کلمه
            const details = await this.getWordDetails(wordId);
            
            // ایجاد مدال
            const modal = document.createElement('div');
            modal.className = 'word-modal';
            modal.innerHTML = this.createModalHTML(details);
            
            // تنظیم رویدادها
            this.setupModalEvents(modal, details);
            
            // اضافه کردن به صفحه
            document.body.appendChild(modal);
            
        } catch (error) {
            console.error('خطا در نمایش جزییات:', error);
            this.showErrorModal('خطا در بارگذاری جزییات کلمه');
        }
    }

    createModalHTML(details) {
        return `
            <div class="modal-content glass-effect">
                <div class="modal-header">
                    <h3 class="text-gradient">
                        <i class="fas fa-info-circle"></i> جزییات کلمه
                        <span class="word-level level-${details.level.toLowerCase()}">${details.level}</span>
                    </h3>
                    <button class="close-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="word-main">
                        <h2>${details.word}</h2>
                        
                        <div class="phonetics-row">
                            <div class="phonetic-box">
                                <div class="phonetic-label">🇺🇸 امریکن</div>
                                <div class="phonetic-value">${details.phonetic?.ipa?.american || details.phonetic || '—'}</div>
                            </div>
                            <div class="phonetic-box">
                                <div class="phonetic-label">🇬🇧 بریتیش</div>
                                <div class="phonetic-value">${details.phonetic?.ipa?.british || details.phonetic || '—'}</div>
                            </div>
                        </div>
                        
                        <div class="persian-main">${details.persian?.main || details.persian}</div>
                        ${details.persian?.short ? `<div class="persian-short">(${details.persian.short})</div>` : ''}
                        
                        ${details.partOfSpeech && details.partOfSpeech.length > 0 ? `
                            <div class="part-of-speech">
                                <i class="fas fa-tag"></i>
                                ${details.partOfSpeech.join('، ')}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="word-details">
                        ${details.meanings && details.meanings.length > 0 ? details.meanings.map((meaning, index) => `
                            <div class="meaning-section">
                                <h4><i class="fas fa-book-open"></i> معنی ${details.meanings.length > 1 ? index + 1 : ''}</h4>
                                <p class="persian-definition">${meaning.persianDefinition || '—'}</p>
                                ${meaning.definition?.simple ? `<p class="english-definition">${meaning.definition.simple}</p>` : ''}
                                
                                ${meaning.example?.sentence ? `
                                    <div class="example-section">
                                        <h5><i class="fas fa-comment"></i> مثال</h5>
                                        <div class="example-card">
                                            <div class="example-text">${meaning.example.sentence}</div>
                                            <div class="example-translation">${meaning.example.translation || ''}</div>
                                            
                                            <div class="audio-controls-example">
                                                <div class="audio-row">
                                                    <span class="audio-label">🇺🇸 امریکن:</span>
                                                    <button class="audio-btn-example" data-sentence="${meaning.example.sentence}" data-accent="us" data-speed="normal">
                                                        <i class="fas fa-play"></i> عادی
                                                    </button>
                                                    <button class="audio-btn-example" data-sentence="${meaning.example.sentence}" data-accent="us" data-speed="slow">
                                                        <i class="fas fa-tachometer-alt"></i> آهسته
                                                    </button>
                                                </div>
                                                <div class="audio-row">
                                                    <span class="audio-label">🇬🇧 بریتیش:</span>
                                                    <button class="audio-btn-example" data-sentence="${meaning.example.sentence}" data-accent="uk" data-speed="normal">
                                                        <i class="fas fa-play"></i> عادی
                                                    </button>
                                                    <button class="audio-btn-example" data-sentence="${meaning.example.sentence}" data-accent="uk" data-speed="slow">
                                                        <i class="fas fa-tachometer-alt"></i> آهسته
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}
                                
                                <div class="tags-section">
                                    ${meaning.collocations && meaning.collocations.length > 0 ? `
                                        <div class="tag-group">
                                            <span class="tag-label"><i class="fas fa-link"></i> هم‌آیی‌ها:</span>
                                            ${meaning.collocations.map(coll => `<span class="tag tag-collocation">${coll}</span>`).join('')}
                                        </div>
                                    ` : ''}
                                    
                                    ${meaning.synonyms && meaning.synonyms.length > 0 ? `
                                        <div class="tag-group">
                                            <span class="tag-label"><i class="fas fa-sync-alt"></i> مترادف‌ها:</span>
                                            ${meaning.synonyms.map(syn => `<span class="tag tag-synonym">${syn}</span>`).join('')}
                                        </div>
                                    ` : ''}
                                    
                                    ${meaning.antonyms && meaning.antonyms.length > 0 ? `
                                        <div class="tag-group">
                                            <span class="tag-label"><i class="fas fa-exchange-alt"></i> متضادها:</span>
                                            ${meaning.antonyms.map(ant => `<span class="tag tag-antonym">${ant}</span>`).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                                
                                ${meaning.usage?.note ? `
                                    <div class="tip-box">
                                        <i class="fas fa-lightbulb"></i>
                                        <span class="tip-text">${meaning.usage.note}</span>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('') : ''}
                    </div>
                    
                    <div class="word-audio-section">
                        <h4><i class="fas fa-headphones"></i> تلفظ کلمه</h4>
                        <div class="audio-controls-word">
                            <div class="audio-row">
                                <span class="audio-label">🇺🇸 امریکن:</span>
                                <button class="audio-btn-word" data-word="${details.word}" data-accent="us" data-speed="normal">
                                    <i class="fas fa-play"></i> عادی
                                </button>
                                <button class="audio-btn-word" data-word="${details.word}" data-accent="us" data-speed="slow">
                                    <i class="fas fa-tachometer-alt"></i> آهسته
                                </button>
                            </div>
                            <div class="audio-row">
                                <span class="audio-label">🇬🇧 بریتیش:</span>
                                <button class="audio-btn-word" data-word="${details.word}" data-accent="uk" data-speed="normal">
                                    <i class="fas fa-play"></i> عادی
                                </button>
                                <button class="audio-btn-word" data-word="${details.word}" data-accent="uk" data-speed="slow">
                                    <i class="fas fa-tachometer-alt"></i> آهسته
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-gradient close-btn">
                        <i class="fas fa-times"></i> بستن
                    </button>
                </div>
            </div>
        `;
    }

    setupModalEvents(modal, details) {
        // دکمه‌های بستن
        const closeButtons = modal.querySelectorAll('.close-modal, .close-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        // تلفظ کلمه
        const wordAudioButtons = modal.querySelectorAll('.audio-btn-word');
        wordAudioButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const word = e.target.closest('.audio-btn-word').dataset.word;
                const accent = e.target.closest('.audio-btn-word').dataset.accent;
                const speed = e.target.closest('.audio-btn-word').dataset.speed;
                this.playWordAudio(word, accent, speed);
            });
        });
        
        // تلفظ جمله مثال
        const exampleAudioButtons = modal.querySelectorAll('.audio-btn-example');
        exampleAudioButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sentence = e.target.closest('.audio-btn-example').dataset.sentence;
                const accent = e.target.closest('.audio-btn-example').dataset.accent;
                const speed = e.target.closest('.audio-btn-example').dataset.speed;
                this.playSentenceAudio(sentence, accent, speed);
            });
        });
        
        // بستن با کلیک روی background
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        // جلوگیری از بستن با کلیک روی محتوا
        modal.querySelector('.modal-content').addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    playWordAudio(word, accent = 'us', speed = 'normal') {
        console.log(`پخش کلمه: ${word} (${accent}, ${speed})`);
        
        if (window.app && window.app.audioManager) {
            window.app.audioManager.playWord(word, accent);
            
            if (speed === 'slow' && 'speechSynthesis' in window) {
                setTimeout(() => {
                    speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance(word);
                    utterance.lang = accent === 'uk' ? 'en-GB' : 'en-US';
                    utterance.rate = 0.7;
                    speechSynthesis.speak(utterance);
                }, 100);
            }
        }
    }

    playSentenceAudio(sentence, accent = 'us', speed = 'normal') {
        console.log(`پخش جمله: ${sentence} (${accent}, ${speed})`);
        
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(sentence);
            utterance.lang = accent === 'uk' ? 'en-GB' : 'en-US';
            utterance.rate = speed === 'slow' ? 0.7 : 1.0;
            speechSynthesis.speak(utterance);
        }
    }

    // متدهای کمکی
    isWordLearned(wordId) {
        const lesson = this.lessonManager.getCurrentLesson();
        if (!lesson) return false;
        
        const lessonData = this.lessonManager.userData.lessons[lesson.id];
        return lessonData?.vocabulary?.learned?.includes(wordId) || false;
    }

    toggleWord(wordId) {
        const lesson = this.lessonManager.getCurrentLesson();
        if (!lesson) return;
        
        const lessonId = lesson.id;
        const userData = this.lessonManager.userData;
        
        if (!userData.lessons[lessonId]) {
            userData.lessons[lessonId] = this.lessonManager.createLessonData();
        }
        
        const lessonData = userData.lessons[lessonId];
        if (!lessonData.vocabulary.learned) {
            lessonData.vocabulary.learned = [];
        }
        
        const isLearned = lessonData.vocabulary.learned.includes(wordId);
        
        if (isLearned) {
            const index = lessonData.vocabulary.learned.indexOf(wordId);
            lessonData.vocabulary.learned.splice(index, 1);
        } else {
            lessonData.vocabulary.learned.push(wordId);
        }
        
        this.lessonManager.saveUserData();
        
        // اطلاع‌رسانی برای به‌روزرسانی UI
        document.dispatchEvent(new CustomEvent('wordToggled', { 
            detail: { wordId, learned: !isLearned } 
        }));
        
        return !isLearned;
    }

    startPractice() {
        console.log('🎯 تمرین واژگان شروع شد');
        // بعداً کامل می‌کنیم
    }

    showErrorModal(title) {
        const modal = document.createElement('div');
        modal.className = 'word-modal';
        modal.innerHTML = `
            <div class="modal-content glass-effect">
                <div class="modal-header">
                    <h3><i class="fas fa-exclamation-triangle"></i> ${title}</h3>
                    <button class="close-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p>لطفاً دوباره تلاش کنید</p>
                </div>
                <div class="modal-footer">
                    <button class="btn-gradient close-btn">
                        <i class="fas fa-times"></i> بستن
                    </button>
                </div>
            </div>
        `;
        
        const closeButtons = modal.querySelectorAll('.close-modal, .close-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        modal.querySelector('.modal-content').addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        document.body.appendChild(modal);
    }

    // پاک کردن کش (برای توسعه)
    clearCache() {
        this.allWordDetails = null;
        this.loadingPromise = null;
        console.log('🧹 کش کلمات پاک شد');
    }
}

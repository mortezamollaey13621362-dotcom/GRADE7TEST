// js/modules/Flashcards.js
export class Flashcards {
    constructor(lessonManager, audioManager) {
        this.lessonManager = lessonManager;
        this.audioManager = audioManager;

        this.cards = [];
        this.currentIndex = 0;
        this.isFlipped = false;

        this.userProgress = this.loadProgress();
    }

    async render() {
        await this.loadCards();

        if (this.cards.length === 0) {
            return '<div class="no-cards">فلش‌کارتی برای این درس یافت نشد</div>';
        }

        const currentCard = this.cards[this.currentIndex];

        // گارد برای جلوگیری از undefined
        const frontWord = currentCard?.front?.word ?? '';
        const frontPhonetic = currentCard?.front?.phonetic ?? '';
        const frontHint = currentCard?.front?.hint ?? '';

        const backMeaning = currentCard?.back?.meaning ?? ''; // اینجا معنی فارسی میاد
        const backSimpleDefinition = currentCard?.back?.simpleDefinition ?? '';

        const exSentence = currentCard?.back?.example?.sentence ?? '';
        const exTranslation = currentCard?.back?.example?.translation ?? '';

        const img = currentCard?.extras?.image ?? '';
        const collocation = currentCard?.extras?.collocation ?? '';
        const commonMistake = currentCard?.extras?.commonMistake ?? '';

        const level = currentCard?.learningControl?.level ?? 'A1';
        const difficulty = Number(currentCard?.learningControl?.difficulty ?? 1);

        return `
            <div class="flashcards-section">
                <div class="flashcards-header">
                    <h3 class="text-gradient"><i class="fas fa-layer-group"></i> فلش‌کارت‌ها</h3>
                    <div class="flashcards-stats">
                        <span class="card-counter">${this.currentIndex + 1}/${this.cards.length}</span>
                        <button class="btn-settings btn-gradient" onclick="app.flashcards.showSettings()">
                            <i class="fas fa-cog"></i>
                        </button>
                    </div>
                </div>

                <div class="flashcards-container">
                    <!-- فلش‌کارت اصلی -->
                    <div class="flashcard-wrapper" onclick="app.flashcards.handleCardClick(event)">
                        <div class="flashcard ${this.isFlipped ? 'flipped' : ''}" id="main-flashcard">
                            <!-- جلوی کارت -->
                            <div class="flashcard-front">
                                <div class="card-content">
                                    ${img ? `
                                        <div class="card-image">
                                            <img src="${img}" alt="${frontWord}" onerror="this.style.display='none'">
                                        </div>
                                    ` : ''}

                                    <div class="card-main">
                                        <h2 class="card-word">${frontWord}</h2>
                                        ${frontPhonetic ? `<div class="card-phonetic">${frontPhonetic}</div>` : ''}
                                        ${frontHint ? `<div class="card-hint">${frontHint}</div>` : ''}
                                    </div>

                                    <div class="card-audio-front">
                                        <button class="audio-btn us" onclick="event.stopPropagation(); app.flashcards.playFrontAudio('us')">
                                            <i class="fas fa-volume-up"></i> 🇺🇸
                                        </button>
                                        <button class="audio-btn uk" onclick="event.stopPropagation(); app.flashcards.playFrontAudio('uk')">
                                            <i class="fas fa-volume-up"></i> 🇬🇧
                                        </button>
                                    </div>

                                    <div class="card-instruction">
                                        <i class="fas fa-hand-point-up"></i> برای دیدن معنی کلیک کنید
                                    </div>
                                </div>
                            </div>

                            <!-- پشت کارت -->
                            <div class="flashcard-back">
                                <div class="card-content">
                                    <div class="card-main">
                                        ${backMeaning ? `<h3 class="card-meaning">${backMeaning}</h3>` : `<h3 class="card-meaning">—</h3>`}
                                        ${backSimpleDefinition ? `<div class="card-definition" style="direction: ltr; text-align: left;">${backSimpleDefinition}</div>` : ''}

                                        ${exSentence ? `
                                            <div class="card-example">
                                                <h4><i class="fas fa-comment"></i> مثال:</h4>
                                                <!-- تغییر مهم: اضافه کردن استایل direction: ltr به صورت مستقیم -->
                                                <p class="example-sentence" style="direction: ltr; text-align: left; unicode-bidi: embed;">${exSentence}</p>
                                                ${exTranslation ? `<p class="example-translation">${exTranslation}</p>` : ''}
                                            </div>
                                        ` : ''}

                                        ${collocation ? `
                                            <div class="card-collocation">
                                                <h4><i class="fas fa-link"></i> هم‌آیی:</h4>
                                                <!-- تغییر مهم: اصلاح جهت هم‌آیی‌ها -->
                                                <span class="collocation-text" style="direction: ltr; display: inline-block;">${collocation}</span>
                                            </div>
                                        ` : ''}

                                        ${commonMistake ? `
                                            <div class="card-tip">
                                                <h4><i class="fas fa-lightbulb"></i> نکته:</h4>
                                                <p>${commonMistake}</p>
                                            </div>
                                        ` : ''}

                                        <div class="card-level">
                                            <span class="level-badge level-${String(level).toLowerCase()}">
                                                ${level}
                                            </span>
                                            <span class="difficulty">
                                                سختی: ${'★'.repeat(Math.max(1, Math.min(5, difficulty)))}
                                            </span>
                                        </div>
                                    </div>

                                    <div class="card-audio-back">
                                        ${exSentence ? `
                                            <button class="audio-btn example-us" onclick="event.stopPropagation(); app.flashcards.playExampleAudio('us')">
                                                <i class="fas fa-play"></i> 🇺🇸 مثال
                                            </button>
                                            <button class="audio-btn example-uk" onclick="event.stopPropagation(); app.flashcards.playExampleAudio('uk')">
                                                <i class="fas fa-play"></i> 🇬🇧 مثال
                                            </button>
                                        ` : ''}
                                    </div>

                                    <div class="card-instruction back">
                                        <i class="fas fa-hand-point-up"></i> برای بازگشت کلیک کنید
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- کنترل‌های دستی -->
                    <div class="flashcards-controls">
                        <button class="control-btn prev" onclick="app.flashcards.prevCard()">
                            <i class="fas fa-chevron-right"></i> قبلی
                        </button>

                        <div class="main-controls">
                            <button class="control-btn flip" onclick="app.flashcards.flipCard()">
                                <i class="fas fa-sync-alt"></i> برگرداندن
                            </button>

                            <button class="control-btn mark" onclick="app.flashcards.markAsLearned()">
                                <i class="fas fa-check"></i> بلدم
                            </button>
                        </div>

                        <button class="control-btn next" onclick="app.flashcards.nextCard()">
                            بعدی <i class="fas fa-chevron-left"></i>
                        </button>
                    </div>

                    <div class="flashcards-extra">
                        <button class="extra-btn shuffle" onclick="app.flashcards.shuffleCards()">
                            <i class="fas fa-random"></i> تصادفی
                        </button>
                        <button class="extra-btn restart" onclick="app.flashcards.restartDeck()">
                            <i class="fas fa-redo"></i> از ابتدا
                        </button>
                    </div>
                </div>

                <div class="progress-info">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${this.getProgressPercent()}%"></div>
                    </div>
                    <div class="progress-text">
                        ${this.getMasteredCount()} از ${this.cards.length} کارت را یاد گرفته‌اید
                    </div>
                </div>
            </div>
        `;
    }

    handleCardClick(event) {
        if (!event.target.closest('button')) {
            this.flipCard();
        }
    }

    async loadCards() {
        try {
            const lesson = this.lessonManager?.getCurrentLesson?.() ?? null;

            // شما الان این فایل رو می‌خونید (پروژه‌ی اصلی)
            const response = await fetch('data/flashcards/all-flashcards.json');
            const rawData = await response.json();

            // 1) اگر ساختار: { flashcards: [...] }
            // 2) اگر ساختار: [...]
            const rawCards = Array.isArray(rawData)
                ? rawData
                : (Array.isArray(rawData?.flashcards) ? rawData.flashcards : []);

            // اگر دیتا خالی بود
            if (!rawCards.length) {
                this.cards = [];
                return;
            }

            // فیلتر بر اساس درس (اگر کارت lessonId داشته باشه)
            let filtered = rawCards;
            if (lesson && rawCards.some(c => c && typeof c === 'object' && 'lessonId' in c)) {
                filtered = rawCards.filter(card => card.lessonId === lesson.id);
            }

            // Normalize به ساختار واحد برای render
            this.cards = filtered
                .map(card => this.normalizeCard(card, lesson))
                .filter(Boolean);

            // مرتب‌سازی بر اساس پیشرفت
            this.sortCardsByProgress();

        } catch (error) {
            console.error('❌ خطا در بارگذاری فلش‌کارت‌ها:', error);
            this.cards = [];
        }
    }

    normalizeCard(card, lesson) {
        if (!card || typeof card !== 'object') return null;

        // حالت A: ساختار جدید/پیچیده‌ی شما (front/back)
        const isStructured = !!card.front && !!card.back;

        if (isStructured) {
            // مطمئن می‌شیم cardId وجود داره
            const cardId = card.cardId || card.id || `${card.lessonId || lesson?.id || 'lesson'}_${card.front?.word || 'card'}`;

            // اگر معنی فارسی جای دیگری ذخیره شده باشد (optional)، اینجا هم پوشش می‌دیم
            const possiblePersian =
                card.back?.meaning ??
                card.persianMeaning ??
                card.back?.persianMeaning ??
                card.translation ??
                '';

            return {
                ...card,
                cardId,
                back: {
                    ...card.back,
                    meaning: possiblePersian
                },
                learningControl: {
                    level: card.learningControl?.level ?? 'A1',
                    difficulty: Number(card.learningControl?.difficulty ?? 1)
                }
            };
        }

        // حالت B: ساختار ساده مثل JSONی که فرستادی
        // {
        //   id, word, phonetic, persianMeaning, example, exampleTranslation, difficulty
        // }
        const id = card.id || card.cardId || `${lesson?.id || 'lesson'}_${card.word || 'card'}`;

        const difficultyWord = String(card.difficulty || '').toLowerCase();
        const difficultyStars =
            difficultyWord === 'easy' ? 1 :
            difficultyWord === 'medium' ? 3 :
            difficultyWord === 'hard' ? 5 :
            1;

        return {
            lessonId: card.lessonId ?? lesson?.id ?? null,
            cardId: id,

            front: {
                word: card.word ?? '',
                phonetic: card.phonetic ?? '',
                hint: card.hint ?? '',
                audio: card.audio ?? null
            },

            back: {
                meaning: card.persianMeaning ?? card.meaning ?? card.translation ?? '',
                simpleDefinition: card.simpleDefinition ?? '',
                example: {
                    sentence: card.example ?? '',
                    translation: card.exampleTranslation ?? ''
                }
            },

            extras: {
                image: card.image ?? '',
                collocation: card.collocation ?? '',
                commonMistake: card.commonMistake ?? ''
            },

            learningControl: {
                level: card.level ?? 'A1',
                difficulty: Number(card.difficultyStars ?? difficultyStars)
            }
        };
    }

    sortCardsByProgress() {
        this.cards.sort((a, b) => {
            const progressA = this.userProgress[a.cardId]?.mastery || 0;
            const progressB = this.userProgress[b.cardId]?.mastery || 0;
            return progressA - progressB;
        });
    }

    flipCard() {
        const card = document.getElementById('main-flashcard');
        if (card) {
            this.isFlipped = !this.isFlipped;
            card.classList.toggle('flipped');
        }
    }

    nextCard() {
        if (this.cards.length === 0) return;

        this.isFlipped = false;
        this.currentIndex = (this.currentIndex + 1) % this.cards.length;
        this.updateDisplay();
        this.saveProgress();
    }

    prevCard() {
        if (this.cards.length === 0) return;

        this.isFlipped = false;
        this.currentIndex = (this.currentIndex - 1 + this.cards.length) % this.cards.length;
        this.updateDisplay();
        this.saveProgress();
    }

    shuffleCards() {
        if (this.cards.length === 0) return;

        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }

        this.currentIndex = 0;
        this.isFlipped = false;
        this.updateDisplay();
    }

    restartDeck() {
        this.currentIndex = 0;
        this.isFlipped = false;
        this.updateDisplay();
    }

    markAsLearned() {
        const currentCard = this.cards[this.currentIndex];
        if (!currentCard) return;

        if (!this.userProgress[currentCard.cardId]) {
            this.userProgress[currentCard.cardId] = {
                mastery: 100,
                lastReviewed: new Date().toISOString(),
                reviewCount: 1
            };
        } else {
            this.userProgress[currentCard.cardId].mastery = Math.min(
                (this.userProgress[currentCard.cardId].mastery || 0) + 20,
                100
            );
            this.userProgress[currentCard.cardId].lastReviewed = new Date().toISOString();
            this.userProgress[currentCard.cardId].reviewCount = (this.userProgress[currentCard.cardId].reviewCount || 0) + 1;
        }

        this.saveProgress();
        this.nextCard();
    }

    playFrontAudio(accent = 'us') {
        const currentCard = this.cards[this.currentIndex];
        if (!currentCard || !currentCard.front?.audio) return;

        const audioUrl = currentCard.front.audio[accent === 'uk' ? 'british' : 'american'];
        if (audioUrl && this.audioManager) {
            console.log(`پخش تلفظ: ${currentCard.front.word} (${accent})`);
            this.audioManager.playWord(currentCard.front.word, accent);
        }
    }

    playExampleAudio(accent = 'us') {
        const currentCard = this.cards[this.currentIndex];
        if (!currentCard || !currentCard.back?.example?.sentence) return;

        console.log(`پخش مثال: ${currentCard.back.example.sentence} (${accent})`);

        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(currentCard.back.example.sentence);
            utterance.lang = accent === 'uk' ? 'en-GB' : 'en-US';
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
        }
    }

    loadProgress() {
        try {
            const saved = localStorage.getItem('flashcards_progress');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    }

    saveProgress() {
        try {
            localStorage.setItem('flashcards_progress', JSON.stringify(this.userProgress));
        } catch (error) {
            console.error('خطا در ذخیره پیشرفت:', error);
        }
    }

    getProgressPercent() {
        if (this.cards.length === 0) return 0;

        const totalMastery = Object.values(this.userProgress).reduce((sum, prog) => sum + (prog.mastery || 0), 0);
        const maxMastery = this.cards.length * 100;
        return Math.round((totalMastery / maxMastery) * 100);
    }

    getMasteredCount() {
        return Object.values(this.userProgress).filter(prog => (prog.mastery || 0) >= 80).length;
    }

    updateDisplay() {
        const container = document.querySelector('.section-content');
        if (container) {
            this.render().then(html => {
                container.innerHTML = html;
            });
        }
    }

    showSettings() {
        console.log('تنظیمات فلش‌کارت');
    }
}

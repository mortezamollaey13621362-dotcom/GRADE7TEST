// js/modules/Quiz.js

export class Quiz {
    constructor(lessonManager = null) {
        this.lessonManager = lessonManager;
        this.container = null;
        this.teacherPin = "3192"; 
        this.currentView = 'landing'; // landing, student-mode-select, student-quiz, teacher-panel
        this.studentAnswers = {}; 
        this.activeQuestions = [];
        this.currentMode = 'standard'; // quiz (5), standard (10), full (all)
        
        // ذخیره نسخه‌های چاپ
        this.currentExamForPrint = null;
        this.currentAnswerKeyForPrint = null;

        // *** جدید: ذخیره آخرین وضعیت تولید شده برای معلم ***
        this.lastGeneratedConfig = null; 
        
        // Binding methods
        this.renderLanding = this.renderLanding.bind(this);
        this.handleTeacherLogin = this.handleTeacherLogin.bind(this);
        this.selectStudentMode = this.selectStudentMode.bind(this);
    }

    // ==================== متدهای سازگاری ====================
    
    async loadData(lessonId) {
        // در آینده اینجا می‌توانید فایل json واقعی را لود کنید
        return Promise.resolve();
    }

    init(lessonId) {
        setTimeout(() => {
            this.bindEvents();
        }, 100);
        return this;
    }

    bindEvents() {
        this.container = document.getElementById('quiz-module-root');
        if (!this.container) {
            // اگر کانتینر هنوز لود نشده، کمی صبر کن
            setTimeout(() => this.bindEvents(), 100);
            return;
        }
        this.renderLanding();
    }

    getHtml() {
        return `<div id="quiz-module-root" class="quiz-wrapper"></div>`;
    }

    // ==========================================
    // 1. بانک سوالات
    // ==========================================
    getQuestionBank() {
        return [
            // --- VOCABULARY ---
            {
                id: 101, type: 'multiple-choice', category: 'Vocabulary',
                question: "Which word is a synonym for 'Glad'? (کدام کلمه مترادف Glad است؟)",
                options: ["Sad", "Happy", "Angry", "Bored"], correct: 1, 
                explanation: "'Glad' means pleased and happy.",
                explanationFa: "کلمه Glad به معنی خوشحال است که مترادف Happy می‌باشد."
            },
            {
                id: 102, type: 'multiple-choice', category: 'Vocabulary',
                question: "What is the opposite of 'Big'? (متضاد کلمه Big چیست؟)",
                options: ["Large", "Huge", "Small", "Tall"], correct: 2,
                explanation: "The antonym of Big is Small.",
                explanationFa: "متضاد کلمه Big (بزرگ)، Small (کوچک) است."
            },
            {
                id: 103, type: 'multiple-choice', category: 'Vocabulary',
                question: "Choose the correct spelling: (املای صحیح را انتخاب کنید)",
                options: ["Beutiful", "Beautiful", "Beatiful", "Beautifull"], correct: 1,
                explanation: "The correct spelling is B-E-A-U-T-I-F-U-L.",
                explanationFa: "املای صحیح کلمه زیبا، Beautiful است."
            },
            {
                id: 104, type: 'fill-blank', category: 'Vocabulary',
                question: "We eat breakfast in the ______ . (ما صبحانه را در ... می‌خوریم)",
                correct: "morning",
                explanation: "Breakfast is the meal eaten in the morning.",
                explanationFa: "صبحانه وعده‌ای است که در صبح (morning) خورده می‌شود."
            },
            {
                id: 105, type: 'fill-blank', category: 'Vocabulary',
                question: "My father's brother is my ______ . (برادر پدرم ... من است)",
                correct: "uncle",
                explanation: "Your father's or mother's brother is your uncle.",
                explanationFa: "برادرِ پدر یا مادر شما، عمو یا دایی (Uncle) شماست."
            },

            // --- GRAMMAR ---
            {
                id: 201, type: 'multiple-choice', category: 'Grammar',
                question: "I ______ a student. (من یک دانش‌آموز هستم)",
                options: ["is", "are", "am", "be"], correct: 2, 
                explanation: "With 'I', we always use the verb 'am'.",
                explanationFa: "با ضمیر I همیشه از فعل am استفاده می‌کنیم."
            },
            {
                id: 202, type: 'multiple-choice', category: 'Grammar',
                question: "They ______ football every Friday. (آن‌ها هر جمعه فوتبال بازی می‌کنند)",
                options: ["plays", "play", "playing", "played"], correct: 1, 
                explanation: "For 'They' in present simple, we use the base form 'play'.",
                explanationFa: "برای They در زمان حال ساده، از شکل ساده فعل (play) استفاده می‌شود."
            },
            {
                id: 203, type: 'fill-blank', category: 'Grammar',
                question: "She ______ (not / like) pizza. (او پیتزا دوست ندارد)",
                correct: "does not like",
                explanation: "For 'She', we use 'does not' for negation.",
                explanationFa: "برای منفی کردن سوم شخص (She) از does not استفاده می‌کنیم."
            },
            {
                id: 204, type: 'fill-blank', category: 'Grammar',
                question: "Where ______ (be) you yesterday? (دیروز کجا بودی؟)",
                correct: "were",
                explanation: "Past tense of 'be' for 'you' is 'were'.",
                explanationFa: "گذشته فعل be برای you، کلمه were است."
            },
            {
                id: 205, type: 'multiple-choice', category: 'Grammar',
                question: "This is ______ book. (این کتابِ علی است)",
                options: ["Ali", "Ali's", "Alis", "Alis'"], correct: 1,
                explanation: "We use 's to show possession.",
                explanationFa: "برای نشان دادن مالکیت از آپاستروف s استفاده می‌کنیم."
            },

            // --- READING & CONVERSATION ---
            {
                id: 301, type: 'true-false', category: 'Reading',
                question: "Lions are farm animals. (شیرها حیوانات مزرعه هستند)",
                options: ["True", "False"], correct: 1,
                explanation: "Lions are wild animals, not farm animals.",
                explanationFa: "شیرها حیوانات وحشی هستند، نه حیوانات مزرعه."
            },
            {
                id: 302, type: 'true-false', category: 'Reading',
                question: "There are 7 days in a week. (یک هفته ۷ روز دارد)",
                options: ["True", "False"], correct: 0,
                explanation: "A week consists of 7 days.",
                explanationFa: "یک هفته شامل ۷ روز است."
            },
            {
                id: 303, type: 'multiple-choice', category: 'Conversation',
                question: "A: How are you? B: ______ (پاسخ مناسب را انتخاب کنید)",
                options: ["I am Ali", "I'm fine, thank you", "Good night", "Yes, I am"], correct: 1,
                explanation: "The standard answer to 'How are you' is 'I'm fine'.",
                explanationFa: "پاسخ رایج به احوالپرسی، I'm fine (خوبم) است."
            }
        ];
    }

    // ==========================================
    // 2. موتور هوشمند تولید آزمون (آپدیت شده برای ذخیره)
    // ==========================================
    generateBalancedQuiz(mode, isTeacher = false) {
        this.currentMode = mode;
        const allQuestions = this.getQuestionBank();
        
        let targetCount = 0;
        if (mode === 'quiz') targetCount = 5;
        else if (mode === 'standard') targetCount = 10;
        else if (mode === 'full') targetCount = allQuestions.length;

        if (mode === 'full') {
            this.activeQuestions = this.shuffleArray([...allQuestions]);
        } else {
            const categories = {};
            allQuestions.forEach(q => {
                if (!categories[q.category]) categories[q.category] = [];
                categories[q.category].push(q);
            });

            const categoryKeys = Object.keys(categories);
            let selectedQuestions = [];
            
            categoryKeys.forEach(cat => {
                categories[cat] = this.shuffleArray(categories[cat]);
            });

            let index = 0;
            while (selectedQuestions.length < targetCount && selectedQuestions.length < allQuestions.length) {
                const cat = categoryKeys[index % categoryKeys.length];
                if (categories[cat].length > 0) {
                    selectedQuestions.push(categories[cat].pop());
                }
                index++;
            }
            
            this.activeQuestions = this.shuffleArray(selectedQuestions);
        }

        this.preparePrintVersions();

        // *** ذخیره در حافظه اگر توسط معلم تولید شده باشد ***
        if (isTeacher) {
            this.lastGeneratedConfig = {
                mode: mode,
                examHtml: this.currentExamForPrint,
                keyHtml: this.currentAnswerKeyForPrint,
                timestamp: new Date().toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})
            };
        }

        return this.activeQuestions;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    preparePrintVersions() {
        let title = "آزمون";
        if (this.currentMode === 'quiz') title = "کوییز کلاسی (کوتاه)";
        else if (this.currentMode === 'standard') title = "آزمون استاندارد";
        else if (this.currentMode === 'full') title = "آزمون جامع";

        this.currentExamForPrint = this.generateExamPaperHtml(title, false);
        this.currentAnswerKeyForPrint = this.generateExamPaperHtml(title, true);
    }

    // --- صفحه فرود ---
    renderLanding() {
        this.currentView = 'landing';
        this.container.innerHTML = `
            <div class="quiz-landing animate-fade-in">
                <div class="quiz-card student-card">
                    <div class="icon-wrapper"><i class="fas fa-user-graduate"></i></div>
                    <h3>ورود دانش‌آموز</h3>
                    <p>شرکت در آزمون، کوییز یا تمرین جامع</p>
                    <button id="btn-student-entry" class="btn-primary">ورود به بخش آزمون</button>
                </div>
                <div class="quiz-division-line"></div>
                <div class="quiz-card teacher-card">
                    <div class="icon-wrapper"><i class="fas fa-chalkboard-teacher"></i></div>
                    <h3>پنل دبیر</h3>
                    <button id="btn-teacher-login" class="btn-outline">ورود به پنل</button>
                </div>
            </div>
        `;

        document.getElementById('btn-student-entry').addEventListener('click', this.selectStudentMode);
        document.getElementById('btn-teacher-login').addEventListener('click', this.handleTeacherLogin);
    }

    // --- انتخاب حالت آزمون برای دانش‌آموز (آپدیت شده: حالت دوگانه) ---
    selectStudentMode() {
        this.currentView = 'student-mode-select';
        
        // تابع کمکی برای ساخت دکمه‌های داخل کارت
        const renderActionButtons = (mode) => `
            <div class="mode-actions">
                <button class="btn-mode-action btn-start-online" data-action="start" data-mode="${mode}">
                    <i class="fas fa-play"></i> شروع آنلاین
                </button>
                <button class="btn-mode-action btn-dl-pdf" data-action="pdf-q" data-mode="${mode}">
                    <i class="fas fa-file-pdf"></i> دانلود سوال
                </button>
                <button class="btn-mode-action btn-dl-pdf" data-action="pdf-a" data-mode="${mode}" style="font-size:0.8rem; opacity:0.8;">
                    <i class="fas fa-key"></i> دانلود کلید
                </button>
            </div>
        `;

        this.container.innerHTML = `
            <div class="mode-select-container animate-slide-up">
                <h2>لطفاً نوع آزمون را انتخاب کنید:</h2>
                <div class="mode-buttons">
                    <div class="mode-card" data-mode="quiz">
                        <i class="fas fa-stopwatch"></i>
                        <span>کوییز کلاسی</span>
                        <small>۵ سوال - سریع</small>
                        ${renderActionButtons('quiz')}
                    </div>
                    <div class="mode-card featured" data-mode="standard">
                        <i class="fas fa-clipboard-list"></i>
                        <span>آزمون ۱۰ سوالی</span>
                        <small>استاندارد و متوازن</small>
                        ${renderActionButtons('standard')}
                    </div>
                    <div class="mode-card" data-mode="full">
                        <i class="fas fa-layer-group"></i>
                        <span>آزمون جامع</span>
                        <small>کل بانک سوالات</small>
                        ${renderActionButtons('full')}
                    </div>
                </div>
                <button id="btn-back-landing" class="btn-text">
                    <i class="fas fa-arrow-right"></i> بازگشت
                </button>
            </div>
        `;

        // مدیریت رویداد دکمه‌های جدید
        this.container.querySelectorAll('.btn-mode-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // جلوگیری از تداخل
                const mode = e.currentTarget.dataset.mode;
                const action = e.currentTarget.dataset.action;

                // برای دانش آموز فلگ isTeacher را false می‌فرستیم
                this.generateBalancedQuiz(mode, false);

                if (action === 'start') {
                    this.startStudentQuiz(mode);
                } else if (action === 'pdf-q') {
                    this.printMode(this.currentExamForPrint, false);
                } else if (action === 'pdf-a') {
                    if(confirm("آیا مطمئن هستید؟ بهتر است ابتدا سوالات را پاسخ دهید.")) {
                        this.printMode(this.currentAnswerKeyForPrint, true);
                    }
                }
            });
        });

        document.getElementById('btn-back-landing').addEventListener('click', this.renderLanding);
    }

    // --- پنل معلم (آپدیت شده: اضافه شدن تاریخچه) ---
    handleTeacherLogin() {
        const input = prompt("لطفاً کد امنیتی دبیر را وارد کنید:");
        if (input === this.teacherPin) {
            this.renderTeacherPanel();
        } else {
            alert("رمز عبور اشتباه است!");
        }
    }

    renderTeacherPanel() {
        this.currentView = 'teacher-panel';
        
        // ساخت HTML برای باکس تاریخچه (اگر موجود باشد)
        let historyHtml = '';
        if (this.lastGeneratedConfig) {
            historyHtml = `
                <div class="history-box animate-pop-in">
                    <div class="history-info">
                        <h4><i class="fas fa-history"></i> آخرین آزمون تولید شده</h4>
                        <p>نوع: ${this.lastGeneratedConfig.mode} | زمان: ${this.lastGeneratedConfig.timestamp}</p>
                    </div>
                    <div class="history-actions">
                        <button id="btn-hist-q" class="btn-gen">چاپ مجدد سوال</button>
                        <button id="btn-hist-a" class="btn-gen secondary">چاپ مجدد کلید</button>
                    </div>
                </div>
            `;
        }

        this.container.innerHTML = `
            <div class="teacher-dashboard animate-fade-in">
                <div class="dashboard-header">
                    <h2>میز کار دبیر</h2>
                    <button id="btn-back-home" class="btn-small">خروج</button>
                </div>
                <div class="dashboard-content">
                    
                    ${historyHtml}

                    <p style="margin-top:20px; font-weight:bold;">تولید آزمون جدید:</p>
                    
                    <div class="teacher-controls">
                        <div class="control-group">
                            <label><i class="fas fa-bolt"></i> کوییز (۵ سوال)</label>
                            <div class="btn-row">
                                <button class="btn-gen new-exam" data-mode="quiz" data-type="exam">چاپ سوال</button>
                                <button class="btn-gen secondary new-exam" data-mode="quiz" data-type="key">چاپ پاسخنامه</button>
                            </div>
                        </div>

                        <div class="control-group">
                            <label><i class="fas fa-file-alt"></i> آزمون (۱۰ سوال)</label>
                            <div class="btn-row">
                                <button class="btn-gen new-exam" data-mode="standard" data-type="exam">چاپ سوال</button>
                                <button class="btn-gen secondary new-exam" data-mode="standard" data-type="key">چاپ پاسخنامه</button>
                            </div>
                        </div>

                        <div class="control-group">
                            <label><i class="fas fa-book"></i> جامع (کل سوالات)</label>
                            <div class="btn-row">
                                <button class="btn-gen new-exam" data-mode="full" data-type="exam">چاپ سوال</button>
                                <button class="btn-gen secondary new-exam" data-mode="full" data-type="key">چاپ پاسخنامه</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('btn-back-home').addEventListener('click', this.renderLanding);
        
        // هندلرهای دکمه‌های History
        if (this.lastGeneratedConfig) {
            document.getElementById('btn-hist-q').addEventListener('click', () => {
                this.printMode(this.lastGeneratedConfig.examHtml, false);
            });
            document.getElementById('btn-hist-a').addEventListener('click', () => {
                this.printMode(this.lastGeneratedConfig.keyHtml, true);
            });
        }

        // هندلرهای تولید آزمون جدید
        this.container.querySelectorAll('.new-exam').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                const type = e.currentTarget.dataset.type;
                
                // true به معنی این است که معلم دارد آزمون تولید می‌کند (برای ذخیره در تاریخچه)
                this.generateBalancedQuiz(mode, true);
                
                if (type === 'exam') {
                    this.printMode(this.currentExamForPrint, false);
                } else {
                    this.printMode(this.currentAnswerKeyForPrint, true);
                }
            });
        });
    }

    // --- اجرای آزمون دانش‌آموز ---
    startStudentQuiz(mode) {
        // توجه: generateBalancedQuiz قبلاً در selectStudentMode صدا زده شده
        this.studentAnswers = {};
        this.renderStudentQuestion(0);
    }

    renderStudentQuestion(index) {
        if (index >= this.activeQuestions.length) {
            this.finishStudentQuiz();
            return;
        }

        const q = this.activeQuestions[index];
        const isLast = index === this.activeQuestions.length - 1;

        let inputHtml = '';
        if (q.type === 'multiple-choice' || q.type === 'true-false') {
            inputHtml = `<div class="options-grid ltr-content">
                ${q.options.map((opt, i) => `
                    <button class="btn-option" data-idx="${i}">${opt}</button>
                `).join('')}
            </div>`;
        } else {
            inputHtml = `
                <div class="text-answer-wrapper">
                    <input type="text" class="input-text-answer ltr-content" placeholder="Answer here...">
                    <button class="btn-submit-text">ثبت پاسخ</button>
                </div>`;
        }

        this.container.innerHTML = `
            <div class="student-quiz-ui animate-slide-up">
                <div class="quiz-header">
                    <div>
                        <span class="badge-mode">${this.getModeNameFA()}</span>
                        <span class="quiz-progress">سوال <span class="en-num">${index + 1}</span> از <span class="en-num">${this.activeQuestions.length}</span></span>
                    </div>
                    <button id="btn-quiz-exit" class="btn-text" style="color: #e74c3c; font-weight: bold;">
                        <i class="fas fa-times"></i> خروج
                    </button>
                </div>
                
                <div class="question-card">
                    <span class="q-category">${q.category}</span>
                    <h3 class="q-text ltr-content text-left">${q.question}</h3>
                    
                    <div class="answer-area" id="answer-area">
                        ${inputHtml}
                    </div>

                    <div id="feedback-box" class="feedback-box hidden"></div>
                </div>

                <div class="quiz-footer">
                    <button id="btn-next-q" class="btn-next hidden">${isLast ? 'مشاهده کارنامه' : 'سوال بعدی'}</button>
                </div>
            </div>
        `;

        document.getElementById('btn-quiz-exit').addEventListener('click', () => {
            if(confirm("آیا مطمئن هستید که می‌خواهید از آزمون خارج شوید؟")) {
                this.selectStudentMode();
            }
        });

        const handleAnswer = (userAnswer) => {
            this.studentAnswers[q.id] = userAnswer;
            
            let isCorrect = false;
            if (q.type === 'multiple-choice' || q.type === 'true-false') {
                if (userAnswer === q.correct) isCorrect = true;
            } else {
                if (userAnswer && String(userAnswer).toLowerCase().trim() === q.correct.toLowerCase()) isCorrect = true;
            }

            const options = this.container.querySelectorAll('.btn-option, .btn-submit-text, input');
            options.forEach(el => el.disabled = true);
            
            if (q.type === 'multiple-choice' || q.type === 'true-false') {
                const selectedBtn = this.container.querySelector(`.btn-option[data-idx="${userAnswer}"]`);
                if(selectedBtn) selectedBtn.classList.add(isCorrect ? 'opt-correct' : 'opt-wrong');
                if (!isCorrect) {
                     const correctBtn = this.container.querySelector(`.btn-option[data-idx="${q.correct}"]`);
                     if(correctBtn) correctBtn.classList.add('opt-should-be');
                }
            }

            const feedbackBox = document.getElementById('feedback-box');
            feedbackBox.innerHTML = `
                <div class="feedback-content ${isCorrect ? 'fb-success' : 'fb-error'}">
                    <h4>${isCorrect ? '✅ صحیح' : '❌ نادرست'}</h4>
                    <p class="en-exp ltr-content">${q.explanation}</p>
                    <p class="fa-exp">${q.explanationFa}</p>
                </div>
            `;
            feedbackBox.classList.remove('hidden');
            feedbackBox.classList.add('animate-pop-in');
            document.getElementById('btn-next-q').classList.remove('hidden');
        };

        if (q.type === 'multiple-choice' || q.type === 'true-false') {
            this.container.querySelectorAll('.btn-option').forEach(btn => {
                btn.addEventListener('click', (e) => handleAnswer(parseInt(e.target.dataset.idx)));
            });
        } else {
            this.container.querySelector('.btn-submit-text').addEventListener('click', () => {
                const val = this.container.querySelector('.input-text-answer').value;
                if(val.trim() === "") return;
                handleAnswer(val);
            });
        }

        document.getElementById('btn-next-q').addEventListener('click', () => {
            this.renderStudentQuestion(index + 1);
        });
    }

    finishStudentQuiz() {
        let score = 0;
        this.activeQuestions.forEach(q => {
            let userAnswer = this.studentAnswers[q.id];
            if (q.type === 'multiple-choice' || q.type === 'true-false') {
                if (userAnswer === q.correct) score++;
            } else {
                if (userAnswer && String(userAnswer).toLowerCase().trim() === q.correct.toLowerCase()) score++;
            }
        });

        const percent = Math.round((score / this.activeQuestions.length) * 100);
        let msg = "تلاش خوبی بود!";
        if(percent === 100) msg = "فوق‌العاده بود!";
        else if(percent >= 80) msg = "عالی!";
        else if(percent < 50) msg = "نیاز به تمرین بیشتر.";

        this.container.innerHTML = `
            <div class="quiz-result animate-fade-in">
                <div class="result-header">
                    <h3>پایان آزمون</h3>
                    <p class="result-msg">${msg}</p>
                </div>
                
                <div class="score-circle">
                    <span class="score-val en-num">${score}</span>
                    <span class="score-total en-num">/ ${this.activeQuestions.length}</span>
                </div>

                <div class="result-actions">
                    <button id="btn-retry" class="btn-primary">آزمون مجدد</button>
                    <button id="btn-print-report" class="btn-outline">دانلود کارنامه (PDF)</button>
                    <button id="btn-exit" class="btn-text">خروج به منو</button>
                </div>
            </div>
        `;

        document.getElementById('btn-retry').addEventListener('click', () => this.selectStudentMode());
        document.getElementById('btn-exit').addEventListener('click', this.renderLanding);
        
        document.getElementById('btn-print-report').addEventListener('click', () => {
             const reportHtml = this.generateStudentAnalysisHtml(score);
             this.printMode(reportHtml, true);
        });
    }

    // --- ابزارهای کمکی ---
    getModeNameFA() {
        if (this.currentMode === 'quiz') return 'کوییز';
        if (this.currentMode === 'standard') return 'آزمون ۱۰ سوالی';
        return 'آزمون جامع';
    }

    // --- تولید قالب‌های چاپ ---
    generateExamPaperHtml(title, withAnswers) {
        const date = new Date().toLocaleDateString('fa-IR');
        
        return `
            <div class="printable-paper">
                <div class="paper-header">
                    <div class="header-right">
                        <h1>${title} زبان انگلیسی - درس اول</h1>
                        <p>نام و نام خانوادگی: .............................</p>
                    </div>
                    <div class="header-left">
                        <p>تاریخ: ${date}</p>
                        <p>تعداد سوالات: ${this.activeQuestions.length}</p>
                        ${withAnswers ? '<span class="key-badge">پاسخنامه تشریحی</span>' : ''}
                    </div>
                </div>

                <div class="paper-body">
                    ${this.activeQuestions.map((q, idx) => `
                        <div class="paper-question">
                            <div class="q-row">
                                <span class="q-num en-num">${idx + 1}.</span>
                                <div class="q-content ltr-content text-left">
                                    ${q.question} 
                                    <span style="font-size:0.8em; color:#888; float:right;">[${q.category}]</span>
                                </div>
                            </div>
                            
                            ${this.renderPaperOptions(q, withAnswers)}

                            ${withAnswers ? `
                                <div class="answer-key-box">
                                    <div class="ltr-content text-left">
                                        <strong>Answer:</strong> <span class="correct-val">${this.formatCorrectAnswer(q)}</span>
                                        <br>
                                        <em>${q.explanation}</em>
                                    </div>
                                    <div class="fa-explanation-box">
                                        <strong>توضیح:</strong> ${q.explanationFa}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="paper-footer">Good Luck - Generated by Smart Quiz App</div>
            </div>
        `;
    }

    generateStudentAnalysisHtml(score) {
        const date = new Date().toLocaleDateString('fa-IR');
        
        return `
            <div class="printable-paper">
                <div class="paper-header">
                    <div class="header-right">
                        <h1>کارنامه تحلیلی دانش‌آموز</h1>
                        <p>نتیجه: ${score} از ${this.activeQuestions.length}</p>
                    </div>
                    <div class="header-left">
                        <p>تاریخ: ${date}</p>
                        <p>نوع آزمون: ${this.getModeNameFA()}</p>
                    </div>
                </div>

                <div class="paper-body">
                    ${this.activeQuestions.map((q, idx) => {
                        const userAnswer = this.studentAnswers[q.id];
                        let isCorrect = false;
                        if (q.type === 'multiple-choice' || q.type === 'true-false') {
                            if (userAnswer === q.correct) isCorrect = true;
                        } else {
                            if (userAnswer && String(userAnswer).toLowerCase().trim() === q.correct.toLowerCase()) isCorrect = true;
                        }
                        
                        return `
                        <div class="paper-question">
                            <div class="q-row">
                                <span class="q-num en-num">${idx + 1}.</span>
                                <div class="q-content ltr-content text-left">
                                    ${q.question} 
                                </div>
                            </div>
                            
                            <div class="student-analysis">
                                <div class="analysis-row ${isCorrect ? 'correct' : 'wrong'}">
                                    <span class="analysis-label">پاسخ شما:</span>
                                    <span class="analysis-value">${this.formatUserAnswer(q, userAnswer)}</span>
                                    <span class="analysis-icon">${isCorrect ? '✅' : '❌'}</span>
                                </div>
                                ${!isCorrect ? `
                                <div class="analysis-row correct">
                                    <span class="analysis-label">پاسخ صحیح:</span>
                                    <span class="analysis-value">${this.formatCorrectAnswer(q)}</span>
                                </div>` : ''}
                                <div class="explanation-box">
                                    <div class="fa-explanation-box">
                                        ${q.explanationFa}
                                    </div>
                                </div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    renderPaperOptions(q, withAnswers) {
        if (q.type === 'multiple-choice' || q.type === 'true-false') {
            return `
                <div class="paper-options ltr-content">
                    ${q.options.map((opt, i) => `
                        <div class="paper-opt-item ${withAnswers && i === q.correct ? 'highlight-correct' : ''}">
                            <span class="circle en-num">${String.fromCharCode(65+i)}</span> ${opt}
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            return `<div class="paper-lines">.......................................................................................</div>`;
        }
    }

    formatCorrectAnswer(q) {
        if (q.type === 'multiple-choice' || q.type === 'true-false') return q.options[q.correct];
        return q.correct;
    }

    formatUserAnswer(q, ans) {
        if (ans === undefined || ans === "") return "(بدون پاسخ)";
        if (q.type === 'multiple-choice' || q.type === 'true-false') return q.options[ans];
        return ans;
    }

    // ==========================================
    // اصلاح متد چاپ برای رفع مشکل دکمه‌های بزرگ
    // ==========================================
    printMode(htmlContent, isKey = false) {
        const existing = document.getElementById('print-layer-container');
        if (existing) existing.remove();
        
        const printLayer = document.createElement('div');
        printLayer.id = 'print-layer-container';
        
        printLayer.innerHTML = htmlContent + `
            <div class="print-controls-overlay">
                <button id="btn-close-print" class="btn-big-close">
                    <i class="fas fa-times"></i> بستن
                </button>
                <button id="btn-do-print" class="btn-big-print">
                    <i class="fas fa-print"></i> ذخیره PDF / چاپ
                </button>
            </div>
        `;
        
        document.body.appendChild(printLayer);
        document.body.classList.add('printing-mode');

        document.getElementById('btn-do-print').addEventListener('click', () => window.print());
        
        document.getElementById('btn-close-print').addEventListener('click', () => {
            printLayer.remove();
            document.body.classList.remove('printing-mode');

            // اگر در پنل معلم هستیم، رفرش می‌کنیم تا تاریخچه جدید نمایش داده شود
            if (this.currentView === 'teacher-panel') {
                this.renderTeacherPanel();
            }
        });
    }
}

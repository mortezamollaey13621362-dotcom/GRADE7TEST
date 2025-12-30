// js/modules/Quiz.js - نسخه کامل و بدون خطا

import { QuizHistoryManager } from './QuizHistoryManager.js';
import { ProgressManager } from './ProgressManager.js';
import { QuizGenerator } from './QuizGenerator.js';

export class Quiz {
    constructor(lessonManager = null) {
        this.lessonManager = lessonManager;
        this.container = null;
        this.teacherPin = "3192"; 
        this.currentView = 'landing'; 
        this.studentAnswers = {}; 
        this.activeQuestions = [];
        this.currentMode = 'standard';
        this.currentCategories = [];
        this.questionCount = 10;
        this.currentUser = this.getCurrentUser();
        
        // سیستم‌های مدیریت
        this.historyManager = new QuizHistoryManager(this.currentUser);
        this.generator = new QuizGenerator();
        this.progressManager = new ProgressManager(lessonManager);
        
        this.currentQuizId = null;
        this.currentQuizStartIndex = 0;
        
        this.currentExamForPrint = null;
        this.currentAnswerKeyForPrint = null;
        this.lastGeneratedConfig = null;
        
        // ذخیره‌سازی موقت برای آزمون‌های تولید شده
        this.userGeneratedExamsKey = `quiz_generated_exams_${this.currentUser}`;
        
        // بایند کردن متدها
        this.renderLanding = this.renderLanding.bind(this);
        this.handleTeacherLogin = this.handleTeacherLogin.bind(this);
        this.selectStudentMode = this.selectStudentMode.bind(this);
        this.renderCustomQuizBuilder = this.renderCustomQuizBuilder.bind(this);
        this.startStudentQuiz = this.startStudentQuiz.bind(this);
        this.renderStudentHistory = this.renderStudentHistory.bind(this);
        this.renderStudentQuestion = this.renderStudentQuestion.bind(this);
        this.finishStudentQuiz = this.finishStudentQuiz.bind(this);
        this.viewQuizResult = this.viewQuizResult.bind(this);
        this.showDetailedAnswers = this.showDetailedAnswers.bind(this);
        this.resumeQuiz = this.resumeQuiz.bind(this);
        this.showExitDialog = this.showExitDialog.bind(this);
    }

    // شناسایی کاربر فعلی
    getCurrentUser() {
        let userId = localStorage.getItem('english7_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('english7_user_id', userId);
        }
        return userId;
    }

    // ذخیره آزمون تولید شده برای کاربر
    saveGeneratedExam(examData) {
        try {
            let userExams = this.getGeneratedExams();
            // فقط 10 آزمون آخر را نگه دار
            userExams.unshift(examData);
            if (userExams.length > 10) {
                userExams = userExams.slice(0, 10);
            }
            localStorage.setItem(this.userGeneratedExamsKey, JSON.stringify(userExams));
            return true;
        } catch (error) {
            console.error('Error saving generated exam:', error);
            return false;
        }
    }

    // دریافت آزمون‌های تولید شده کاربر
    getGeneratedExams() {
        try {
            const exams = localStorage.getItem(this.userGeneratedExamsKey);
            return exams ? JSON.parse(exams) : [];
        } catch (error) {
            console.error('Error getting generated exams:', error);
            return [];
        }
    }

    // دریافت آزمون خاص با ID
    getGeneratedExamById(examId) {
        const exams = this.getGeneratedExams();
        return exams.find(exam => exam.id === examId);
    }

    async loadData(lessonId) { 
        try {
            const response = await fetch(`./data/lesson${lessonId}/quiz.json`);
            if (!response.ok) throw new Error('فایل یافت نشد');
            const data = await response.json();
            this.generator.loadQuestionBank(data.questions || []);
            return data;
        } catch (error) {
            console.warn('⚠️ Using fallback question bank:', error);
            this.generator.loadQuestionBank(this.getFallbackQuestions());
            return { questions: this.getFallbackQuestions() };
        }
    }

    getFallbackQuestions() {
        return [
            {
                id: 101, type: 'multiple-choice', category: 'Vocabulary',
                question: "Which word is a synonym for 'Glad'? (کدام کلمه مترادف Glad است؟)",
                options: ["Sad", "Happy", "Angry", "Bored"], correct: 1, 
                explanation: "'Glad' means pleased and happy.",
                explanationFa: "کلمه Glad به معنی خوشحال است که مترادف Happy می‌باشد.",
                tags: ['vocabulary', 'synonym']
            },
            {
                id: 102, type: 'multiple-choice', category: 'Vocabulary',
                question: "What is the opposite of 'Big'? (متضاد کلمه Big چیست؟)",
                options: ["Large", "Huge", "Small", "Tall"], correct: 2,
                explanation: "The antonym of Big is Small.",
                explanationFa: "متضاد کلمه Big (بزرگ)، Small (کوچک) است.",
                tags: ['vocabulary', 'antonym']
            },
            {
                id: 201, type: 'multiple-choice', category: 'Grammar',
                question: "I ______ a student. (من یک دانش‌آموز هستم)",
                options: ["is", "are", "am", "be"], correct: 2, 
                explanation: "With 'I', we always use the verb 'am'.",
                explanationFa: "با ضمیر I همیشه از فعل am استفاده می‌کنیم.",
                tags: ['grammar', 'verb']
            },
            {
                id: 202, type: 'multiple-choice', category: 'Grammar',
                question: "They ______ football every Friday. (آن‌ها هر جمعه فوتبال بازی می‌کنند)",
                options: ["plays", "play", "playing", "played"], correct: 1, 
                explanation: "For 'They' in present simple, we use the base form 'play'.",
                explanationFa: "برای They در زمان حال ساده، از شکل ساده فعل (play) استفاده می‌شود.",
                tags: ['grammar', 'present-simple']
            },
            {
                id: 301, type: 'true-false', category: 'Reading',
                question: "Lions are farm animals. (شیرها حیوانات مزرعه هستند)",
                options: ["True", "False"], correct: 1,
                explanation: "Lions are wild animals, not farm animals.",
                explanationFa: "شیرها حیوانات وحشی هستند، نه حیوانات مزرعه.",
                tags: ['reading', 'comprehension']
            },
            {
                id: 302, type: 'true-false', category: 'Reading',
                question: "There are 7 days in a week. (یک هفته ۷ روز دارد)",
                options: ["True", "False"], correct: 0,
                explanation: "A week consists of 7 days.",
                explanationFa: "یک هفته شامل ۷ روز است.",
                tags: ['reading', 'fact']
            },
            {
                id: 401, type: 'multiple-choice', category: 'Conversation',
                question: "A: How are you? B: ______ (پاسخ مناسب را انتخاب کنید)",
                options: ["I am Ali", "I'm fine, thank you", "Good night", "Yes, I am"], correct: 1,
                explanation: "The standard answer to 'How are you' is 'I'm fine'.",
                explanationFa: "پاسخ رایج به احوالپرسی، I'm fine (خوبم) است.",
                tags: ['conversation', 'greeting']
            }
        ];
    }

    init(lessonId) {
        this.loadData(lessonId).then(() => {
            setTimeout(() => { this.bindEvents(); }, 100);
        });
        return this;
    }

    bindEvents() {
        this.container = document.getElementById('quiz-module-root');
        if (!this.container) { 
            setTimeout(() => this.bindEvents(), 100); 
            return; 
        }
        this.renderLanding();
    }

    getHtml() {
        return `<div id="quiz-module-root" class="quiz-wrapper"></div>`;
    }

    formatMixedText(text) {
        if (!text) return "";
        if (text.includes('(')) {
            const parts = text.split('(');
            const englishPart = parts[0];
            const persianPart = '(' + parts.slice(1).join('(');
            return `${englishPart}<br><span class="fa-translation" dir="rtl">${persianPart}</span>`;
        }
        return text;
    }

    // ============================ صفحه اصلی ============================
    renderLanding() {
        this.currentView = 'landing';
        
        const incompleteQuiz = this.historyManager.getIncompleteQuiz();
        const recentExams = this.getGeneratedExams();
        
        let notificationHtml = '';
        if (incompleteQuiz) {
            notificationHtml = `
                <div class="incomplete-notification animate-pop-in">
                    <div class="notif-icon">⚠️</div>
                    <div class="notif-content">
                        <h4>آزمون ناتمام شما!</h4>
                        <p>شما یک ${this.getModeNameByType(incompleteQuiz.mode)} ناتمام دارید 
                        (${incompleteQuiz.currentIndex} از ${incompleteQuiz.totalQuestions} سوال پاسخ داده شده)</p>
                    </div>
                    <div class="notif-actions">
                        <button id="btn-resume-quiz" class="btn-notif primary">ادامه آزمون</button>
                        <button id="btn-discard-quiz" class="btn-notif secondary">حذف و شروع جدید</button>
                    </div>
                </div>
            `;
        }
        
        let recentExamsHtml = '';
        if (recentExams.length > 0) {
            recentExamsHtml = `
                <div class="recent-exams-section">
                    <h3><i class="fas fa-clock"></i> آزمون‌های اخیر شما</h3>
                    <div class="recent-exams-grid">
                        ${recentExams.slice(0, 3).map(exam => `
                            <div class="recent-exam-card">
                                <div class="recent-exam-header">
                                    <span class="exam-type">${this.getModeNameByType(exam.mode)}</span>
                                    <span class="exam-date">${exam.timestamp.split(' ')[0]}</span>
                                </div>
                                <div class="recent-exam-body">
                                    <p class="exam-info">${exam.questionCount} سوال - ${exam.categories && exam.categories.length > 0 ? exam.categories.join('، ') : 'همه موضوعات'}</p>
                                </div>
                                <div class="recent-exam-actions">
                                    <button class="btn-small view-exam-btn" data-exam-id="${exam.id}">
                                        <i class="fas fa-eye"></i> مشاهده
                                    </button>
                                    <button class="btn-small download-exam-btn" data-exam-id="${exam.id}">
                                        <i class="fas fa-download"></i> دانلود
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        this.container.innerHTML = `
            <div class="quiz-landing animate-fade-in">
                ${notificationHtml}
                ${recentExamsHtml}
                
                <div class="landing-cards">
                    <div class="quiz-card student-card">
                        <div class="icon-wrapper"><i class="fas fa-user-graduate"></i></div>
                        <h3>ورود دانش‌آموز</h3>
                        <p>آزمون سفارشی با انتخاب موضوع و تعداد سوال</p>
                        <button id="btn-student-entry" class="btn-primary">شروع آزمون جدید</button>
                        <button id="btn-custom-quiz" class="btn-outline" style="margin-top:10px;">
                            <i class="fas fa-sliders-h"></i> ساخت آزمون سفارشی
                        </button>
                        <button id="btn-student-history" class="btn-outline" style="margin-top:10px;">
                            <i class="fas fa-history"></i> تاریخچه آزمون‌ها
                        </button>
                    </div>
                    <div class="quiz-division-line"></div>
                    <div class="quiz-card teacher-card">
                        <div class="icon-wrapper"><i class="fas fa-chalkboard-teacher"></i></div>
                        <h3>پنل دبیر</h3>
                        <p>ساخت، ذخیره و مدیریت آزمون‌ها</p>
                        <button id="btn-teacher-login" class="btn-outline">ورود به پنل</button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('btn-student-entry').addEventListener('click', this.selectStudentMode);
        document.getElementById('btn-custom-quiz').addEventListener('click', () => this.renderCustomQuizBuilder(false));
        document.getElementById('btn-teacher-login').addEventListener('click', this.handleTeacherLogin);
        document.getElementById('btn-student-history').addEventListener('click', this.renderStudentHistory);
        
        if (incompleteQuiz) {
            document.getElementById('btn-resume-quiz').addEventListener('click', () => {
                this.resumeQuiz(incompleteQuiz);
            });
            document.getElementById('btn-discard-quiz').addEventListener('click', () => {
                if (confirm('آیا مطمئن هستید که می‌خواهید آزمون ناتمام را حذف کنید؟')) {
                    this.historyManager.deleteQuiz(incompleteQuiz.id);
                    this.renderLanding();
                }
            });
        }
        
        // اضافه کردن رویداد برای آزمون‌های اخیر
        this.container.querySelectorAll('.view-exam-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const examId = e.currentTarget.dataset.examId;
                const exam = this.getGeneratedExamById(examId);
                if (exam) {
                    this.viewGeneratedExam(exam);
                }
            });
        });
        
        this.container.querySelectorAll('.download-exam-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const examId = e.currentTarget.dataset.examId;
                const exam = this.getGeneratedExamById(examId);
                if (exam) {
                    this.showExamDownloadOptions(exam);
                }
            });
        });
    }

    // ============================ مشاهده آزمون تولید شده ============================
    viewGeneratedExam(exam) {
        this.currentView = 'view-generated-exam';
        this.activeQuestions = exam.questions;
        this.currentMode = exam.mode;
        this.currentCategories = exam.categories || [];
        this.questionCount = exam.questionCount;
        
        this.container.innerHTML = `
            <div class="view-exam-page animate-fade-in">
                <div class="exam-header">
                    <button id="btn-back-to-landing" class="btn-text">
                        <i class="fas fa-arrow-right"></i> بازگشت
                    </button>
                    <h2>${this.getModeNameByType(exam.mode)} - ${exam.timestamp}</h2>
                </div>
                
                <div class="exam-info-box">
                    <div class="info-row">
                        <span class="info-label">تعداد سوالات:</span>
                        <span class="info-value">${exam.questionCount}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">موضوعات:</span>
                        <span class="info-value">${exam.categories && exam.categories.length > 0 ? exam.categories.join('، ') : 'همه موضوعات'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">تاریخ تولید:</span>
                        <span class="info-value">${exam.timestamp}</span>
                    </div>
                </div>
                
                <div class="exam-actions-grid">
                    <div class="action-card">
                        <i class="fas fa-play-circle"></i>
                        <h3>شروع آزمون آنلاین</h3>
                        <p>پاسخ‌دهی تعاملی با این سوالات</p>
                        <button id="btn-start-this-exam" class="btn-action primary">
                            <i class="fas fa-play"></i> شروع آزمون
                        </button>
                    </div>
                    
                    <div class="action-card">
                        <i class="fas fa-file-pdf"></i>
                        <h3>دانلود PDF</h3>
                        <p>ذخیره برای استفاده آفلاین</p>
                        <div class="action-buttons">
                            <button id="btn-download-questions" class="btn-action secondary">
                                <i class="fas fa-file-alt"></i> سوالات
                            </button>
                            <button id="btn-download-answers" class="btn-action secondary">
                                <i class="fas fa-key"></i> پاسخنامه
                            </button>
                            <button id="btn-download-both" class="btn-action primary" style="margin-top:10px;">
                                <i class="fas fa-download"></i> هر دو
                            </button>
                        </div>
                    </div>
                    
                    <div class="action-card">
                        <i class="fas fa-eye"></i>
                        <h3>مشاهده سوالات</h3>
                        <p>پیش‌نمایش سوالات بدون پاسخ</p>
                        <button id="btn-preview-questions" class="btn-action secondary">
                            <i class="fas fa-search"></i> مشاهده
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('btn-back-to-landing').addEventListener('click', this.renderLanding);
        
        // رویداد دکمه شروع آزمون
        document.getElementById('btn-start-this-exam').addEventListener('click', () => {
            this.startStudentQuiz();
        });
        
        // رویدادهای دانلود
        document.getElementById('btn-download-questions').addEventListener('click', () => {
            this.printMode(exam.examHtml, false, () => {
                this.viewGeneratedExam(exam);
            });
        });
        
        document.getElementById('btn-download-answers').addEventListener('click', () => {
            if (confirm("آیا مطمئن هستید که می‌خواهید پاسخنامه را دانلود کنید؟")) {
                this.printMode(exam.keyHtml, true, () => {
                    this.viewGeneratedExam(exam);
                });
            }
        });
        
        document.getElementById('btn-download-both').addEventListener('click', () => {
            if (confirm("آزمون و پاسخنامه در دو تب جداگانه باز می‌شوند. آیا ادامه می‌دهید؟")) {
                this.printModeBoth(exam.examHtml, exam.keyHtml);
            }
        });
        
        // رویداد پیش‌نمایش سوالات
        document.getElementById('btn-preview-questions').addEventListener('click', () => {
            this.previewExamQuestions(exam);
        });
    }

    // ============================ پیش‌نمایش سوالات ============================
    previewExamQuestions(exam) {
        this.currentView = 'preview-exam';
        
        const questionsHtml = exam.questions.map((q, idx) => `
            <div class="preview-question">
                <div class="preview-header">
                    <span class="q-number">سوال ${idx + 1}</span>
                    <span class="q-category">${q.category}</span>
                </div>
                <div class="preview-body">
                    <p class="q-text">${this.formatMixedText(q.question)}</p>
                    ${q.type === 'multiple-choice' || q.type === 'true-false' ? `
                        <div class="preview-options">
                            ${q.options.map((opt, i) => `
                                <div class="preview-option">
                                    <span class="option-letter">${String.fromCharCode(65 + i)}</span>
                                    <span class="option-text">${opt}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="preview-text-answer">
                            <span class="answer-placeholder">پاسخ متن:</span>
                            <div class="answer-line"></div>
                        </div>
                    `}
                </div>
            </div>
        `).join('');
        
        this.container.innerHTML = `
            <div class="preview-page animate-fade-in">
                <div class="preview-header">
                    <button id="btn-back-to-exam" class="btn-text">
                        <i class="fas fa-arrow-right"></i> بازگشت
                    </button>
                    <h2>پیش‌نمایش سوالات</h2>
                    <p>${exam.questionCount} سوال - ${this.getModeNameByType(exam.mode)}</p>
                </div>
                
                <div class="preview-container">
                    ${questionsHtml}
                </div>
                
                <div class="preview-footer">
                    <button id="btn-start-from-preview" class="btn-primary">
                        <i class="fas fa-play"></i> شروع آزمون با این سوالات
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('btn-back-to-exam').addEventListener('click', () => {
            this.viewGeneratedExam(exam);
        });
        
        document.getElementById('btn-start-from-preview').addEventListener('click', () => {
            this.startStudentQuiz();
        });
    }

    // ============================ گزینه‌های دانلود آزمون ============================
    showExamDownloadOptions(exam) {
        this.container.innerHTML = `
            <div class="download-options-modal animate-fade-in">
                <div class="modal-header">
                    <h3><i class="fas fa-download"></i> گزینه‌های دانلود</h3>
                    <p>${this.getModeNameByType(exam.mode)} - ${exam.questionCount} سوال</p>
                </div>
                
                <div class="options-grid">
                    <button id="option-questions-only" class="download-option">
                        <i class="fas fa-file-alt"></i>
                        <span>فقط سوالات</span>
                        <small>PDF سوالات بدون پاسخ</small>
                    </button>
                    
                    <button id="option-answer-key" class="download-option">
                        <i class="fas fa-key"></i>
                        <span>پاسخنامه</span>
                        <small>PDF پاسخنامه تشریحی</small>
                    </button>
                    
                    <button id="option-both-separate" class="download-option">
                        <i class="fas fa-copy"></i>
                        <span>هر دو جداگانه</span>
                        <small>دو فایل PDF جداگانه</small>
                    </button>
                    
                    <button id="option-both-together" class="download-option">
                        <i class="fas fa-file-pdf"></i>
                        <span>هر دو در یک فایل</span>
                        <small>سوالات + پاسخنامه</small>
                    </button>
                </div>
                
                <div class="modal-footer">
                    <button id="btn-cancel-download" class="btn-text">انصراف</button>
                </div>
            </div>
        `;
        
        document.getElementById('option-questions-only').addEventListener('click', () => {
            this.printMode(exam.examHtml, false, () => {
                this.showAfterDownloadMessage(exam);
            });
        });
        
        document.getElementById('option-answer-key').addEventListener('click', () => {
            this.printMode(exam.keyHtml, true, () => {
                this.showAfterDownloadMessage(exam);
            });
        });
        
        document.getElementById('option-both-separate').addEventListener('click', () => {
            this.printModeBoth(exam.examHtml, exam.keyHtml);
        });
        
        document.getElementById('option-both-together').addEventListener('click', () => {
            this.printCombinedExam(exam);
        });
        
        document.getElementById('btn-cancel-download').addEventListener('click', () => {
            this.viewGeneratedExam(exam);
        });
    }
    
    // ============================ پیام بعد از دانلود ============================
    showAfterDownloadMessage(exam) {
        this.container.innerHTML = `
            <div class="after-download-message animate-fade-in">
                <div class="success-icon">✅</div>
                <h3>دانلود با موفقیت انجام شد!</h3>
                <p>آزمون شما در تاریخچه ذخیره شده و همیشه قابل دسترسی است.</p>
                
                <div class="next-actions">
                    <button id="btn-go-to-history" class="btn-primary">
                        <i class="fas fa-history"></i> مشاهده تاریخچه
                    </button>
                    <button id="btn-back-to-exam-view" class="btn-outline">
                        <i class="fas fa-arrow-right"></i> بازگشت به آزمون
                    </button>
                    <button id="btn-go-to-landing" class="btn-text">
                        <i class="fas fa-home"></i> صفحه اصلی
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('btn-go-to-history').addEventListener('click', this.renderStudentHistory);
        document.getElementById('btn-back-to-exam-view').addEventListener('click', () => {
            this.viewGeneratedExam(exam);
        });
        document.getElementById('btn-go-to-landing').addEventListener('click', this.renderLanding);
    }

    // ============================ ساخت آزمون سفارشی ============================
    renderCustomQuizBuilder(isTeacher = false) {
        this.currentView = 'custom-builder';
        
        const availableCategories = this.generator.getAvailableCategories();
        const categoryStats = this.generator.getCategoryStats();
        
        const categoryHtml = availableCategories.map(cat => {
            const count = categoryStats[cat] || 0;
            return `
                <div class="category-checkbox">
                    <input type="checkbox" id="cat-${cat}" value="${cat}" ${this.currentCategories.includes(cat) ? 'checked' : ''}>
                    <label for="cat-${cat}" class="category-label">
                        <div class="category-info">
                            <span class="category-icon">${this.getCategoryIcon(cat)}</span>
                            <span class="category-name">${this.getCategoryName(cat)}</span>
                            <span class="category-count">${count}</span>
                        </div>
                        <span class="check-icon">✓</span>
                    </label>
                </div>
            `;
        }).join('');
        
        const quantityOptions = [5, 10, 15, 20];
        
        this.container.innerHTML = `
            <div class="custom-quiz-builder animate-fade-in">
                <div class="builder-header">
                    <h2><i class="fas fa-sliders-h"></i> ساخت آزمون سفارشی</h2>
                    <p>موضوعات و تعداد سوالات مورد نظر خود را انتخاب کنید</p>
                </div>
                
                <div class="selection-summary">
                    <div class="summary-grid">
                        <div class="summary-item">
                            <span class="summary-label">تعداد سوالات موجود:</span>
                            <span class="summary-value">${this.generator.getTotalQuestions()}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">موضوعات انتخاب شده:</span>
                            <span class="summary-value" id="selected-categories-count">0</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">تعداد سوال:</span>
                            <span class="summary-value" id="selected-quantity">${this.questionCount}</span>
                        </div>
                    </div>
                </div>
                
                <div class="category-selection">
                    <h3><i class="fas fa-tags"></i> انتخاب موضوعات</h3>
                    <div class="category-grid">
                        ${categoryHtml}
                    </div>
                </div>
                
                <div class="quantity-selection">
                    <h3><i class="fas fa-list-ol"></i> تعداد سوالات</h3>
                    <div class="quantity-options">
                        ${quantityOptions.map(q => `
                            <button class="quantity-btn ${this.questionCount === q ? 'active' : ''}" 
                                    data-quantity="${q}">${q} سوال</button>
                        `).join('')}
                    </div>
                    <div class="custom-quantity">
                        <span>یا تعداد دلخواه:</span>
                        <div class="quantity-controls">
                            <button class="quantity-btn-small" id="decrease-quantity">−</button>
                            <input type="number" id="custom-quantity-input" 
                                   min="1" max="${this.generator.getTotalQuestions()}" 
                                   value="${this.questionCount}">
                            <button class="quantity-btn-small" id="increase-quantity">+</button>
                        </div>
                    </div>
                </div>
                
                <div class="builder-actions">
                    <button class="btn-builder btn-generate" id="btn-generate-quiz">
                        <i class="fas fa-magic"></i> تولید آزمون
                    </button>
                    <button class="btn-builder btn-reset" id="btn-reset-selection">
                        <i class="fas fa-redo"></i> بازنشانی
                    </button>
                    <button class="btn-builder btn-exit" id="btn-exit-builder" style="background: #6c757d;">
                        <i class="fas fa-times"></i> بازگشت
                    </button>
                </div>
            </div>
        `;
        
        this.setupBuilderEvents(isTeacher);
        this.updateSelectionSummary();
    }
    
    setupBuilderEvents(isTeacher) {
        // انتخاب موضوعات
        this.container.querySelectorAll('.category-checkbox input').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const category = e.target.value;
                if (e.target.checked) {
                    if (!this.currentCategories.includes(category)) {
                        this.currentCategories.push(category);
                    }
                } else {
                    this.currentCategories = this.currentCategories.filter(c => c !== category);
                }
                this.updateSelectionSummary();
            });
        });
        
        // دکمه‌های تعداد سوال
        this.container.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.container.querySelectorAll('.quantity-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.questionCount = parseInt(e.target.dataset.quantity);
                document.getElementById('custom-quantity-input').value = this.questionCount;
                this.updateSelectionSummary();
            });
        });
        
        // کنترل‌های کمیت سفارشی
        document.getElementById('decrease-quantity').addEventListener('click', () => {
            const input = document.getElementById('custom-quantity-input');
            let value = parseInt(input.value) || 1;
            if (value > 1) value--;
            input.value = value;
            this.questionCount = value;
            this.updateQuantityButtons();
            this.updateSelectionSummary();
        });
        
        document.getElementById('increase-quantity').addEventListener('click', () => {
            const input = document.getElementById('custom-quantity-input');
            const max = this.generator.getTotalQuestions();
            let value = parseInt(input.value) || 1;
            if (value < max) value++;
            input.value = value;
            this.questionCount = value;
            this.updateQuantityButtons();
            this.updateSelectionSummary();
        });
        
        document.getElementById('custom-quantity-input').addEventListener('change', (e) => {
            let value = parseInt(e.target.value) || 1;
            const max = this.generator.getTotalQuestions();
            if (value < 1) value = 1;
            if (value > max) value = max;
            e.target.value = value;
            this.questionCount = value;
            this.updateQuantityButtons();
            this.updateSelectionSummary();
        });
        
        // دکمه تولید
        document.getElementById('btn-generate-quiz').addEventListener('click', () => {
            this.generateCustomQuiz(isTeacher);
        });
        
        // بازنشانی
        document.getElementById('btn-reset-selection').addEventListener('click', () => {
            this.currentCategories = [];
            this.questionCount = 10;
            this.container.querySelectorAll('.category-checkbox input').forEach(cb => cb.checked = false);
            this.container.querySelectorAll('.quantity-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.quantity === '10');
            });
            document.getElementById('custom-quantity-input').value = 10;
            this.updateSelectionSummary();
        });
        
        // خروج
        document.getElementById('btn-exit-builder').addEventListener('click', () => {
            if (isTeacher) {
                this.renderTeacherPanel();
            } else {
                this.renderLanding();
            }
        });
    }
    
    updateSelectionSummary() {
        const selectedCount = this.currentCategories.length;
        const totalAvailable = this.generator.getQuestionsByCategories(this.currentCategories).length;
        
        document.getElementById('selected-categories-count').textContent = 
            selectedCount > 0 ? selectedCount + ' موضوع' : 'همه موضوعات';
        
        document.getElementById('selected-quantity').textContent = 
            this.questionCount + ' سوال';
        
        // هشدار اگر تعداد سوال انتخابی بیشتر از موجود باشد
        if (this.questionCount > totalAvailable && selectedCount > 0) {
            document.getElementById('selected-quantity').style.color = '#dc3545';
            document.getElementById('btn-generate-quiz').disabled = true;
            document.getElementById('btn-generate-quiz').innerHTML = 
                '<i class="fas fa-exclamation-triangle"></i> سوال کافی نیست';
        } else {
            document.getElementById('selected-quantity').style.color = '#333';
            document.getElementById('btn-generate-quiz').disabled = false;
            document.getElementById('btn-generate-quiz').innerHTML = 
                '<i class="fas fa-magic"></i> تولید آزمون';
        }
    }
    
    updateQuantityButtons() {
        this.container.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.quantity) === this.questionCount);
        });
    }
    
    generateCustomQuiz(isTeacher = false) {
        if (this.currentCategories.length === 0) {
            this.currentCategories = this.generator.getAvailableCategories();
        }
        
        // تولید seed منحصر به فرد
        const seed = Date.now() + Math.random();
        
        this.activeQuestions = this.generator.generateQuiz({
            categories: this.currentCategories,
            count: this.questionCount,
            randomize: true,
            seed: seed
        });
        
        if (this.activeQuestions.length === 0) {
            alert('⚠️ سوالی با معیارهای انتخابی شما یافت نشد.');
            return;
        }
        
        this.currentMode = 'custom';
        this.currentQuizId = null;
        this.studentAnswers = {};
        
        this.preparePrintVersions();
        
        const examData = {
            id: 'exam_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            timestamp: this.historyManager.getCurrentTimestamp(),
            mode: this.currentMode,
            config: {
                categories: [...this.currentCategories],
                questionCount: this.questionCount,
                seed: seed
            },
            questionCount: this.activeQuestions.length,
            categories: [...this.currentCategories],
            examHtml: this.currentExamForPrint,
            keyHtml: this.currentAnswerKeyForPrint,
            questions: JSON.parse(JSON.stringify(this.activeQuestions)),
            generatedAt: new Date().toISOString()
        };
        
        if (isTeacher) {
            this.historyManager.saveTeacherExam(examData);
            this.showExamDownloadOptions(examData);
        } else {
            // ذخیره آزمون برای کاربر
            this.saveGeneratedExam(examData);
            // نمایش گزینه‌های دانلود
            this.showExamDownloadOptions(examData);
        }
    }
    
    getCategoryIcon(category) {
        const icons = {
            'Vocabulary': '📚',
            'Grammar': '📝',
            'Reading': '📖',
            'Conversation': '💬',
            'Listening': '🎧'
        };
        return icons[category] || '📌';
    }
    
    getCategoryName(category) {
        const names = {
            'Vocabulary': 'واژگان',
            'Grammar': 'گرامر',
            'Reading': 'درک مطلب',
            'Conversation': 'مکالمه',
            'Listening': 'شنیداری'
        };
        return names[category] || category;
    }

    // ============================ انتخاب نوع آزمون ============================
    
    selectStudentMode() {
        this.currentView = 'student-mode-select';
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
                    <div class="mode-card" data-mode="custom">
                        <i class="fas fa-sliders-h"></i>
                        <span>آزمون سفارشی</span>
                        <small>انتخاب موضوع و تعداد</small>
                        ${renderActionButtons('custom')}
                    </div>
                </div>
                <button id="btn-back-landing" class="btn-text">
                    <i class="fas fa-arrow-right"></i> بازگشت
                </button>
            </div>
        `;
        
        this.container.querySelectorAll('.btn-mode-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const mode = e.currentTarget.dataset.mode;
                const action = e.currentTarget.dataset.action;
                
                if (mode === 'custom') {
                    this.renderCustomQuizBuilder(false);
                    return;
                }
                
                // تولید و ذخیره آزمون
                const exam = this.generateBalancedQuiz(mode, false);
                
                if (action === 'start') {
                    this.startStudentQuiz(mode);
                } else if (action === 'pdf-q') {
                    this.showExamDownloadOptions(exam);
                } else if (action === 'pdf-a') {
                    if(confirm("آیا مطمئن هستید؟ بهتر است ابتدا سوالات را پاسخ دهید.")) {
                        this.printMode(exam.keyHtml, true, () => {
                            this.selectStudentMode();
                        });
                    }
                }
            });
        });
        
        document.getElementById('btn-back-landing').addEventListener('click', this.renderLanding);
    }
    
    generateBalancedQuiz(mode, isTeacher = false) {
        this.currentMode = mode;
        let targetCount = 0;
        
        if (mode === 'quiz') targetCount = 5;
        else if (mode === 'standard') targetCount = 10;
        else if (mode === 'full') targetCount = this.generator.getTotalQuestions();
        
        // تولید seed منحصر به فرد
        const seed = Date.now() + Math.random();
        
        this.activeQuestions = this.generator.generateQuiz({
            categories: [],
            count: targetCount,
            randomize: true,
            seed: seed
        });
        
        this.preparePrintVersions();
        
        const examData = {
            id: 'exam_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            timestamp: this.historyManager.getCurrentTimestamp(),
            mode: mode,
            config: {
                categories: [],
                questionCount: targetCount,
                seed: seed
            },
            questionCount: this.activeQuestions.length,
            categories: [],
            examHtml: this.currentExamForPrint,
            keyHtml: this.currentAnswerKeyForPrint,
            questions: JSON.parse(JSON.stringify(this.activeQuestions)),
            generatedAt: new Date().toISOString()
        };
        
        if (isTeacher) {
            this.historyManager.saveTeacherExam(examData);
            this.lastGeneratedConfig = examData;
        } else {
            // ذخیره آزمون برای کاربر
            this.saveGeneratedExam(examData);
        }
        
        return examData;
    }
    
    preparePrintVersions() {
        let title = "آزمون";
        if (this.currentMode === 'quiz') title = "کوییز کلاسی (کوتاه)";
        else if (this.currentMode === 'standard') title = "آزمون استاندارد";
        else if (this.currentMode === 'full') title = "آزمون جامع";
        else if (this.currentMode === 'custom') title = "آزمون سفارشی";

        this.currentExamForPrint = this.generateExamPaperHtml(title, false);
        this.currentAnswerKeyForPrint = this.generateExamPaperHtml(title, true);
    }
    
    // ============================ پنل دبیر ============================
    
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
        
        const teacherHistory = this.historyManager.getTeacherHistory();
        
        let customExamsHtml = '';
        if (teacherHistory.length > 0) {
            customExamsHtml = `
                <div class="teacher-section">
                    <h3><i class="fas fa-history"></i> آزمون‌های تولید شده</h3>
                    <div class="teacher-history-list">
                        ${teacherHistory.map(exam => `
                            <div class="teacher-history-item animate-slide-up">
                                <div class="history-item-header">
                                    <div>
                                        <h4>${this.getModeNameByType(exam.mode)}</h4>
                                        <small class="en-num">${exam.timestamp}</small>
                                        <small>${exam.config ? (exam.config.categories && exam.config.categories.length > 0 ? 
                                            exam.config.categories.join('، ') : 'همه موضوعات') : 'همه موضوعات'}</small>
                                    </div>
                                    <span class="question-count-badge">${exam.questionCount} سوال</span>
                                </div>
                                <div class="history-item-actions">
                                    <button class="btn-hist-action" data-action="view-q" data-id="${exam.id}">
                                        <i class="fas fa-file-alt"></i> مشاهده سوال
                                    </button>
                                    <button class="btn-hist-action" data-action="view-a" data-id="${exam.id}">
                                        <i class="fas fa-key"></i> مشاهده پاسخنامه
                                    </button>
                                    <button class="btn-hist-action primary" data-action="both" data-id="${exam.id}">
                                        <i class="fas fa-download"></i> دانلود همزمان
                                    </button>
                                    <button class="btn-hist-action" data-action="delete" data-id="${exam.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
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
                
                ${customExamsHtml}
                
                <div class="teacher-section">
                    <h3><i class="fas fa-plus-circle"></i> تولید آزمون جدید</h3>
                    
                    <div class="teacher-controls">
                        <div class="control-group">
                            <label><i class="fas fa-sliders-h"></i> آزمون کاملاً سفارشی</label>
                            <p style="font-size:0.9rem; color:#666; margin-bottom:15px;">
                                انتخاب موضوعات و تعداد سوال دلخواه
                            </p>
                            <button class="btn-gen new-custom-exam">
                                <i class="fas fa-cogs"></i> ساخت آزمون سفارشی
                            </button>
                        </div>
                        <div class="control-group">
                            <label><i class="fas fa-bolt"></i> کوییز (۵ سوال)</label>
                            <div class="btn-row">
                                <button class="btn-gen new-exam" data-mode="quiz" data-type="exam">سوال</button>
                                <button class="btn-gen secondary new-exam" data-mode="quiz" data-type="key">پاسخنامه</button>
                            </div>
                        </div>
                        <div class="control-group">
                            <label><i class="fas fa-file-alt"></i> آزمون (۱۰ سوال)</label>
                            <div class="btn-row">
                                <button class="btn-gen new-exam" data-mode="standard" data-type="exam">سوال</button>
                                <button class="btn-gen secondary new-exam" data-mode="standard" data-type="key">پاسخنامه</button>
                            </div>
                        </div>
                        <div class="control-group">
                            <label><i class="fas fa-layer-group"></i> آزمون جامع</label>
                            <div class="btn-row">
                                <button class="btn-gen new-exam" data-mode="full" data-type="exam">سوال</button>
                                <button class="btn-gen secondary new-exam" data-mode="full" data-type="key">پاسخنامه</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('btn-back-home').addEventListener('click', this.renderLanding);
        
        // دکمه ساخت آزمون سفارشی
        document.querySelector('.new-custom-exam').addEventListener('click', () => {
            this.renderCustomQuizBuilder(true);
        });
        
        // دکمه‌های تولید آزمون‌های استاندارد
        this.container.querySelectorAll('.new-exam').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                const type = e.currentTarget.dataset.type;
                
                if (type === 'exam') {
                    this.generateAndSaveStandardQuiz(mode, true);
                } else if (type === 'key') {
                    // برای پاسخنامه، اول آزمون تولید کن بعد پاسخنامه را نشان بده
                    this.generateAndShowAnswerKey(mode, true);
                }
            });
        });
        
        // دکمه‌های تاریخچه
        this.container.querySelectorAll('.btn-hist-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                const examId = e.currentTarget.dataset.id;
                const exam = teacherHistory.find(ex => ex.id === examId);
                
                if (!exam) return;
                
                if (action === 'view-q') {
                    this.printMode(exam.examHtml, false, () => {
                        this.renderTeacherPanel();
                    });
                } else if (action === 'view-a') {
                    this.printMode(exam.keyHtml, true, () => {
                        this.renderTeacherPanel();
                    });
                } else if (action === 'both') {
                    this.printModeBoth(exam.examHtml, exam.keyHtml);
                } else if (action === 'delete') {
                    if (confirm('آیا مطمئن هستید؟')) {
                        this.historyManager.deleteTeacherExam(examId);
                        this.renderTeacherPanel();
                    }
                }
            });
        });
    }
    
    // تولید و ذخیره آزمون استاندارد
    generateAndSaveStandardQuiz(mode, isTeacher = false) {
        const examData = this.generateBalancedQuiz(mode, isTeacher);
        this.showExamDownloadOptions(examData);
    }
    
    // تولید و نمایش پاسخنامه
    generateAndShowAnswerKey(mode, isTeacher = false) {
        const examData = this.generateBalancedQuiz(mode, isTeacher);
        this.printMode(examData.keyHtml, true, () => {
            this.showAfterDownloadMessage(examData);
        });
    }
    
    // ============================ متدهای آزمون دانش‌آموز ============================
    
    startStudentQuiz(mode = 'custom') {
        this.studentAnswers = {};
        this.currentQuizId = this.historyManager.generateQuizId();
        this.currentQuizStartIndex = 0;
        
        // ذخیره اولیه
        this.saveQuizProgress(0, false);
        
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
                    <h3 class="q-text">${this.formatMixedText(q.question)}</h3>
                    
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
            this.showExitDialog(index);
        });

        const handleAnswer = (userAnswer) => {
            this.studentAnswers[q.id] = userAnswer;
            
            // ذخیره بعد از هر پاسخ
            this.saveQuizProgress(index + 1, false);
            
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
    
    saveQuizProgress(currentIndex, isCompleted = false) {
        let score = 0;
        if (isCompleted) {
            this.activeQuestions.forEach(q => {
                let userAnswer = this.studentAnswers[q.id];
                if (q.type === 'multiple-choice' || q.type === 'true-false') {
                    if (userAnswer === q.correct) score++;
                } else {
                    if (userAnswer && String(userAnswer).toLowerCase().trim() === q.correct.toLowerCase()) score++;
                }
            });
        }
        
        const quizData = {
            id: this.currentQuizId,
            timestamp: this.historyManager.getCurrentTimestamp(),
            mode: this.currentMode,
            config: {
                categories: this.currentCategories,
                questionCount: this.questionCount
            },
            questions: this.activeQuestions,
            answers: {...this.studentAnswers},
            currentIndex: currentIndex,
            totalQuestions: this.activeQuestions.length,
            score: score,
            isCompleted: isCompleted,
            completedAt: isCompleted ? this.historyManager.getCurrentTimestamp() : null,
            userId: this.currentUser
        };
        
        this.historyManager.saveQuiz(quizData);
    }
    
    finishStudentQuiz() {
        this.saveQuizProgress(this.activeQuestions.length, true);
        
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
                    <button id="btn-history" class="btn-outline">مشاهده تاریخچه</button>
                    <button id="btn-exit" class="btn-text">خروج به منو</button>
                </div>
            </div>
        `;
        document.getElementById('btn-retry').addEventListener('click', () => this.selectStudentMode());
        document.getElementById('btn-exit').addEventListener('click', this.renderLanding);
        document.getElementById('btn-history').addEventListener('click', this.renderStudentHistory);
        document.getElementById('btn-print-report').addEventListener('click', () => {
             const reportHtml = this.generateStudentAnalysisHtml(score);
             this.printMode(reportHtml, true);
        });
    }
    
    // ============================ دیالوگ خروج ============================
    
    showExitDialog(currentIndex) {
        const dialogHtml = `
            <div class="exit-dialog-overlay animate-fade-in">
                <div class="exit-dialog-box animate-slide-up">
                    <div class="dialog-header">
                        <i class="fas fa-sign-out-alt"></i>
                        <h3>خروج از آزمون</h3>
                        <p>پیشرفت شما ذخیره خواهد شد. کجا می‌خواهید بروید؟</p>
                    </div>
                    <div class="dialog-options">
                        <button class="dialog-option" id="exit-option-continue">
                            <i class="fas fa-undo"></i>
                            <span>بازگشت به آزمون</span>
                            <small>ادامه دادن آزمون</small>
                        </button>
                        <button class="dialog-option" id="exit-option-lessons">
                            <i class="fas fa-book"></i>
                            <span>بازگشت به صفحه دروس</span>
                            <small>مشاهده لیست دروس</small>
                        </button>
                        <button class="dialog-option" id="exit-option-landing">
                            <i class="fas fa-home"></i>
                            <span>بازگشت به صفحه اصلی</span>
                            <small>منوی اولیه آزمون</small>
                        </button>
                    </div>
                    <div class="dialog-footer">
                        <small>پیشرفت شما در سوال ${currentIndex + 1} ذخیره خواهد شد</small>
                    </div>
                </div>
            </div>
        `;
        
        const dialog = document.createElement('div');
        dialog.innerHTML = dialogHtml;
        document.body.appendChild(dialog);
        
        document.getElementById('exit-option-continue').addEventListener('click', () => {
            dialog.remove();
        });
        
        document.getElementById('exit-option-lessons').addEventListener('click', () => {
            this.saveQuizProgress(currentIndex, false);
            dialog.remove();
            if (typeof window.lessonManager !== 'undefined' && window.lessonManager.showLessons) {
                window.lessonManager.showLessons();
            } else if (this.lessonManager && this.lessonManager.showLessons) {
                this.lessonManager.showLessons();
            } else {
                this.renderLanding();
            }
        });
        
        document.getElementById('exit-option-landing').addEventListener('click', () => {
            this.saveQuizProgress(currentIndex, false);
            dialog.remove();
            this.renderLanding();
        });
    }
    
    // ============================ تاریخچه ============================
    
    resumeQuiz(quizData) {
        this.currentQuizId = quizData.id;
        this.currentMode = quizData.mode;
        this.activeQuestions = quizData.questions;
        this.studentAnswers = quizData.answers;
        this.currentQuizStartIndex = quizData.currentIndex;
        
        this.renderStudentQuestion(quizData.currentIndex);
    }
    
    renderStudentHistory() {
        const history = this.historyManager.getHistory();
        const generatedExams = this.getGeneratedExams();
        
        if (history.length === 0 && generatedExams.length === 0) {
            this.container.innerHTML = `
                <div class="empty-state animate-fade-in">
                    <i class="fas fa-inbox" style="font-size:4rem; color:#ddd;"></i>
                    <h3>هنوز آزمونی ثبت نشده</h3>
                    <button id="btn-back-landing" class="btn-primary">بازگشت</button>
                </div>
            `;
            document.getElementById('btn-back-landing').addEventListener('click', this.renderLanding);
            return;
        }
        
        let historyItems = '';
        
        // آزمون‌های تولید شده (PDFها)
        if (generatedExams.length > 0) {
            historyItems += `
                <div class="history-section">
                    <h3><i class="fas fa-file-pdf"></i> آزمون‌های تولید شده</h3>
                    ${generatedExams.map(exam => `
                        <div class="history-item animate-slide-up">
                            <div class="history-header">
                                <div>
                                    <h4>${this.getModeNameByType(exam.mode)}</h4>
                                    <small>${exam.timestamp}</small>
                                    <small>${exam.categories && exam.categories.length > 0 ? 
                                        exam.categories.join('، ') : 'همه موضوعات'}</small>
                                </div>
                                <span class="status-badge pdf-badge">📄 PDF</span>
                            </div>
                            <div class="history-body">
                                <div class="score-display">${exam.questionCount} سوال</div>
                                <div class="history-actions-grid">
                                    <button class="btn-hist-action" data-action="view-q" data-id="${exam.id}" data-type="generated">
                                        <i class="fas fa-file-alt"></i> مشاهده سوال
                                    </button>
                                    <button class="btn-hist-action" data-action="view-a" data-id="${exam.id}" data-type="generated">
                                        <i class="fas fa-key"></i> مشاهده پاسخنامه
                                    </button>
                                    <button class="btn-hist-action primary" data-action="both" data-id="${exam.id}" data-type="generated">
                                        <i class="fas fa-download"></i> دانلود هر دو
                                    </button>
                                    <button class="btn-hist-action" data-action="start" data-id="${exam.id}" data-type="generated">
                                        <i class="fas fa-play"></i> شروع آنلاین
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // آزمون‌های آنلاین انجام شده
        if (history.length > 0) {
            historyItems += `
                <div class="history-section">
                    <h3><i class="fas fa-laptop"></i> آزمون‌های آنلاین</h3>
                    ${history.map(quiz => {
                        const statusBadge = quiz.isCompleted 
                            ? `<span class="status-badge completed">✅ تکمیل شده</span>`
                            : `<span class="status-badge incomplete">⚠️ ناتمام (${quiz.currentIndex}/${quiz.totalQuestions})</span>`;
                        
                        const scoreDisplay = quiz.isCompleted 
                            ? `<div class="score-display">${quiz.score} / ${quiz.totalQuestions}</div>`
                            : `<div class="score-display incomplete-score">-</div>`;
                        
                        return `
                            <div class="history-item animate-slide-up">
                                <div class="history-header">
                                    <div>
                                        <h4>${this.getModeNameByType(quiz.mode)}</h4>
                                        <small>${quiz.timestamp}</small>
                                    </div>
                                    ${statusBadge}
                                </div>
                                <div class="history-body">
                                    ${scoreDisplay}
                                    <div class="history-actions-grid">
                                        ${quiz.isCompleted ? `
                                            <button class="btn-hist-action" data-action="view" data-id="${quiz.id}" data-type="online">
                                                <i class="fas fa-eye"></i> مشاهده نتایج
                                            </button>
                                            <button class="btn-hist-action" data-action="pdf-q" data-id="${quiz.id}" data-type="online">
                                                <i class="fas fa-file-pdf"></i> دانلود سوال
                                            </button>
                                            <button class="btn-hist-action" data-action="pdf-a" data-id="${quiz.id}" data-type="online">
                                                <i class="fas fa-key"></i> دانلود پاسخنامه
                                            </button>
                                        ` : `
                                            <button class="btn-hist-action primary" data-action="resume" data-id="${quiz.id}" data-type="online">
                                                <i class="fas fa-play"></i> ادامه آزمون
                                            </button>
                                            <button class="btn-hist-action danger" data-action="delete" data-id="${quiz.id}" data-type="online">
                                                <i class="fas fa-trash"></i> حذف
                                            </button>
                                        `}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
        
        this.container.innerHTML = `
            <div class="history-page animate-fade-in">
                <div class="page-header">
                    <h2><i class="fas fa-history"></i> تاریخچه آزمون‌های من</h2>
                    <button id="btn-back-landing" class="btn-text">
                        <i class="fas fa-arrow-right"></i> بازگشت
                    </button>
                </div>
                <div class="history-list">
                    ${historyItems}
                </div>
            </div>
        `;
        
        document.getElementById('btn-back-landing').addEventListener('click', this.renderLanding);
        
        // رویدادهای آزمون‌های تولید شده
        this.container.querySelectorAll('.btn-hist-action[data-type="generated"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                const examId = e.currentTarget.dataset.id;
                const exam = generatedExams.find(ex => ex.id === examId);
                
                if (!exam) return;
                
                if (action === 'view-q') {
                    this.printMode(exam.examHtml, false, () => {
                        this.renderStudentHistory();
                    });
                } else if (action === 'view-a') {
                    this.printMode(exam.keyHtml, true, () => {
                        this.renderStudentHistory();
                    });
                } else if (action === 'both') {
                    this.printModeBoth(exam.examHtml, exam.keyHtml);
                } else if (action === 'start') {
                    // بارگذاری سوالات و شروع آزمون
                    this.activeQuestions = exam.questions;
                    this.currentMode = exam.mode;
                    this.currentCategories = exam.categories || [];
                    this.questionCount = exam.questionCount;
                    this.startStudentQuiz();
                }
            });
        });
        
        // رویدادهای آزمون‌های آنلاین
        this.container.querySelectorAll('.btn-hist-action[data-type="online"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                const quizId = e.currentTarget.dataset.id;
                const quiz = history.find(q => q.id === quizId);
                
                if (!quiz) return;
                
                if (action === 'view') {
                    this.viewQuizResult(quiz);
                } else if (action === 'resume') {
                    this.resumeQuiz(quiz);
                } else if (action === 'delete') {
                    if (confirm('آیا مطمئن هستید؟')) {
                        this.historyManager.deleteQuiz(quizId);
                        this.renderStudentHistory();
                    }
                } else if (action === 'pdf-q') {
                    const html = this.generateExamPaperFromHistory(quiz, false);
                    this.printMode(html, false);
                } else if (action === 'pdf-a') {
                    const html = this.generateExamPaperFromHistory(quiz, true);
                    this.printMode(html, true);
                }
            });
        });
    }
    
    viewQuizResult(quiz) {
        const percent = Math.round((quiz.score / quiz.totalQuestions) * 100);
        let msg = "تلاش خوبی بود!";
        if(percent === 100) msg = "فوق‌العاده بود!";
        else if(percent >= 80) msg = "عالی!";
        else if(percent < 50) msg = "نیاز به تمرین بیشتر.";
        
        this.container.innerHTML = `
            <div class="quiz-result animate-fade-in">
                <div class="result-header">
                    <h3>${this.getModeNameByType(quiz.mode)} - ${quiz.timestamp}</h3>
                    <p class="result-msg">${msg}</p>
                </div>
                <div class="score-circle">
                    <span class="score-val en-num">${quiz.score}</span>
                    <span class="score-total en-num">/ ${quiz.totalQuestions}</span>
                </div>
                <div class="result-actions">
                    <button id="btn-view-details" class="btn-primary">مشاهده پاسخ‌های من</button>
                    <button id="btn-print-report" class="btn-outline">دانلود کارنامه (PDF)</button>
                    <button id="btn-back-history" class="btn-text">بازگشت به تاریخچه</button>
                </div>
            </div>
        `;
        
        document.getElementById('btn-back-history').addEventListener('click', () => this.renderStudentHistory());
        document.getElementById('btn-print-report').addEventListener('click', () => {
            const reportHtml = this.generateStudentAnalysisHtmlFromHistory(quiz);
            this.printMode(reportHtml, true);
        });
        document.getElementById('btn-view-details').addEventListener('click', () => {
            this.showDetailedAnswers(quiz);
        });
    }
    
    showDetailedAnswers(quiz) {
        const detailsHtml = quiz.questions.map((q, idx) => {
            const userAnswer = quiz.answers[q.id];
            let isCorrect = false;
            if (q.type === 'multiple-choice' || q.type === 'true-false') {
                if (userAnswer === q.correct) isCorrect = true;
            } else {
                if (userAnswer && String(userAnswer).toLowerCase().trim() === q.correct.toLowerCase()) isCorrect = true;
            }
            
            return `
                <div class="detail-question ${isCorrect ? 'correct-answer' : 'wrong-answer'}">
                    <div class="detail-header">
                        <span class="q-num en-num">${idx + 1}.</span>
                        <span class="detail-status">${isCorrect ? '✅ صحیح' : '❌ نادرست'}</span>
                    </div>
                    <div class="detail-content">
                        <p class="detail-q-text">${this.formatMixedText(q.question)}</p>
                        <div class="detail-answer-row">
                            <strong>پاسخ شما:</strong> 
                            <span class="user-ans">${this.formatUserAnswer(q, userAnswer)}</span>
                        </div>
                        ${!isCorrect ? `
                            <div class="detail-answer-row correct-ans-row">
                                <strong>پاسخ صحیح:</strong> 
                                <span class="correct-ans">${this.formatCorrectAnswer(q)}</span>
                            </div>
                        ` : ''}
                        <div class="detail-explanation">
                            <p class="en-exp ltr-content">${q.explanation}</p>
                            <p class="fa-exp">${q.explanationFa}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        this.container.innerHTML = `
            <div class="detailed-view animate-fade-in">
                <div class="page-header">
                    <h2>پاسخ‌های جزئی</h2>
                    <button id="btn-back-result" class="btn-text">
                        <i class="fas fa-arrow-right"></i> بازگشت
                    </button>
                </div>
                <div class="details-list">
                    ${detailsHtml}
                </div>
            </div>
        `;
        
        document.getElementById('btn-back-result').addEventListener('click', () => this.viewQuizResult(quiz));
    }
    
    // ============================ متدهای کمکی ============================
    
    getModeNameFA() {
        const names = {
            'quiz': 'کوییز',
            'standard': 'آزمون استاندارد',
            'full': 'آزمون جامع',
            'custom': 'آزمون سفارشی'
        };
        return names[this.currentMode] || this.currentMode;
    }
    
    getModeNameByType(mode) {
        const names = {
            'quiz': 'کوییز کلاسی',
            'standard': 'آزمون ۱۰ سوالی',
            'full': 'آزمون جامع',
            'custom': 'آزمون سفارشی'
        };
        return names[mode] || mode;
    }
    
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
                                <div class="q-content" style="unicode-bidi: plaintext; text-align: left;">
                                    ${this.formatMixedText(q.question)} 
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
    
    generateExamPaperFromHistory(quiz, withAnswers) {
        const date = quiz.timestamp;
        let title = this.getModeNameByType(quiz.mode);
        
        return `
            <div class="printable-paper">
                <div class="paper-header">
                    <div class="header-right">
                        <h1>${title} - زبان انگلیسی</h1>
                        <p>نام و نام خانوادگی: .............................</p>
                    </div>
                    <div class="header-left">
                        <p>تاریخ: ${date}</p>
                        <p>تعداد سوالات: ${quiz.totalQuestions}</p>
                        ${withAnswers ? '<span class="key-badge">پاسخنامه تشریحی</span>' : ''}
                    </div>
                </div>
                <div class="paper-body">
                    ${quiz.questions.map((q, idx) => `
                        <div class="paper-question">
                            <div class="q-row">
                                <span class="q-num en-num">${idx + 1}.</span>
                                <div class="q-content" style="unicode-bidi: plaintext; text-align: left;">
                                    ${this.formatMixedText(q.question)} 
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
                                <div class="q-content" style="unicode-bidi: plaintext; text-align: left;">
                                    ${this.formatMixedText(q.question)} 
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
    
    generateStudentAnalysisHtmlFromHistory(quiz) {
        const date = quiz.timestamp;
        return `
            <div class="printable-paper">
                <div class="paper-header">
                    <div class="header-right">
                        <h1>کارنامه تحلیلی دانش‌آموز</h1>
                        <p>نتیجه: ${quiz.score} از ${quiz.totalQuestions}</p>
                    </div>
                    <div class="header-left">
                        <p>تاریخ: ${date}</p>
                        <p>نوع آزمون: ${this.getModeNameByType(quiz.mode)}</p>
                    </div>
                </div>
                <div class="paper-body">
                    ${quiz.questions.map((q, idx) => {
                        const userAnswer = quiz.answers[q.id];
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
                                <div class="q-content" style="unicode-bidi: plaintext; text-align: left;">
                                    ${this.formatMixedText(q.question)} 
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
    
    // تولید آزمون ترکیبی (سوالات + پاسخنامه)
    printCombinedExam(exam) {
        const combinedHtml = `
            <div class="printable-paper">
                <div class="paper-header">
                    <div class="header-right">
                        <h1>${this.getModeNameByType(exam.mode)} - سوالات + پاسخنامه</h1>
                        <p>نام و نام خانوادگی: .............................</p>
                    </div>
                    <div class="header-left">
                        <p>تاریخ: ${exam.timestamp}</p>
                        <p>تعداد سوالات: ${exam.questionCount}</p>
                        <span class="key-badge">نسخه کامل</span>
                    </div>
                </div>
                
                <div class="section-divider">
                    <h2>📝 بخش سوالات</h2>
                </div>
                
                <div class="paper-body">
                    ${exam.questions.map((q, idx) => `
                        <div class="paper-question">
                            <div class="q-row">
                                <span class="q-num en-num">${idx + 1}.</span>
                                <div class="q-content" style="unicode-bidi: plaintext; text-align: left;">
                                    ${this.formatMixedText(q.question)} 
                                    <span style="font-size:0.8em; color:#888; float:right;">[${q.category}]</span>
                                </div>
                            </div>
                            ${this.renderPaperOptions(q, false)}
                        </div>
                    `).join('')}
                </div>
                
                <div class="page-break"></div>
                
                <div class="section-divider">
                    <h2>🔑 بخش پاسخنامه</h2>
                </div>
                
                <div class="paper-body">
                    ${exam.questions.map((q, idx) => `
                        <div class="paper-question answer-key-section">
                            <div class="q-row">
                                <span class="q-num en-num">${idx + 1}.</span>
                                <div class="q-content" style="unicode-bidi: plaintext; text-align: left;">
                                    ${this.formatMixedText(q.question)} 
                                </div>
                            </div>
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
                        </div>
                    `).join('')}
                </div>
                
                <div class="paper-footer">Generated by Smart Quiz App - All rights reserved</div>
            </div>
        `;
        
        this.printMode(combinedHtml, true);
    }
    
    // ✅ دانلود همزمان (باز کردن دو تب چاپ)
    printModeBoth(examHtml, keyHtml) {
        // ابتدا سوال
        this.printMode(examHtml, false, () => {
            // بعد از 1 ثانیه، پاسخنامه
            setTimeout(() => {
                this.printMode(keyHtml, true);
            }, 1000);
        });
    }
    
    // ✅ به‌روزرسانی printMode برای callback
    printMode(htmlContent, isKey = false, onClose = null) {
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
        
        // اصلاح شده: اضافه کردن confirm قبل از بستن
        document.getElementById('btn-close-print').addEventListener('click', () => {
            const shouldClose = confirm('آیا می‌خواهید از حالت چاپ خارج شوید؟');
            if (shouldClose) {
                printLayer.remove();
                document.body.classList.remove('printing-mode');
                if (onClose) onClose();
                else {
                    // اگر callback خاصی تعریف نشده، به صفحه مناسب برگرد
                    if (this.currentView === 'teacher-panel') {
                        this.renderTeacherPanel();
                    }
                }
            }
        });
    }
}
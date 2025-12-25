// js/app.js - نسخه اصلاح شده با رفع مشکل Speaking

import { LessonManager } from './modules/LessonManager.js';
import { Vocabulary } from './modules/Vocabulary.js';
import { Grammar } from './modules/Grammar.js';
import { Conversation } from './modules/Conversation.js';
import { Speaking } from './modules/Speaking.js';
import { Listening } from './modules/Listening.js';
import { Review } from './modules/Review.js';
import { Quiz } from './modules/Quiz.js';
import { Games } from './modules/Games.js';
import { Flashcards } from './modules/Flashcards.js';
import { AudioManager } from './modules/AudioManager.js';
import { ProgressManager } from './modules/ProgressManager.js';
import { SectionRenderer } from './modules/SectionRenderer.js';
import { UI } from './utils/UI.js';

const SECTIONS_CONFIG = [
    { id: 'vocab', name: 'واژگان', icon: 'fas fa-book' },
    { id: 'grammar', name: 'گرامر', icon: 'fas fa-code' },
    { id: 'conversation', name: 'مکالمه', icon: 'fas fa-comments' },
    { id: 'speaking', name: 'گفتار', icon: 'fas fa-microphone' },
    { id: 'listening', name: 'شنیدار', icon: 'fas fa-headphones' },
    { id: 'review', name: 'مرور', icon: 'fas fa-redo' },
    { id: 'quiz', name: 'آزمون', icon: 'fas fa-clipboard-list' },
    { id: 'games', name: 'بازی‌ها', icon: 'fas fa-gamepad' },
    { id: 'flashcard', name: 'فلش‌کارت', icon: 'fas fa-clone' }
];

export class English7App {
    constructor() {
        console.time('AppInitialization');
        
        // اصلاح ۱: پاس دادن 'this' به LessonManager تا به app.games دسترسی داشته باشد
        this.lessonManager = new LessonManager(this);
        
        this.audioManager = new AudioManager();
        this.progressManager = new ProgressManager(this.lessonManager);
        
        // ماژول‌ها - فقط یک بار Speaking را instantiate کنیم
        this.vocabulary = new Vocabulary(this.lessonManager);
        this.grammar = new Grammar();
        this.conversation = new Conversation(); 
        this.listening = new Listening();
        this.review = new Review(this.lessonManager);
        this.quiz = new Quiz(this.lessonManager);
        this.games = new Games();
        this.speaking = new Speaking(this); // <-- فقط همین یک خط برای Speaking
        this.flashcards = new Flashcards(this.lessonManager, this.audioManager);
        
        this.sectionRenderer = new SectionRenderer(this);
        
        this.state = {
            currentSection: 'vocab',
            isLessonActive: false
        };
        
        // sectionHandlers برای SectionRenderer
        this.sectionHandlers = {};
        
        this.dom = {};
        this.staticTemplates = {}; 
        
        this.scrollToTopBtn = null;
        
        window.app = this;
        window.conversationModule = this.conversation;
        
        console.log('🎯 English7App instanced successfully.');
    }

    async init() {
        try {
            await this.waitForDOM();
            this.cacheDOM(); 
            
            await Promise.all([
                this.lessonManager.loadConfig(),
            ]);
            
            this.lessonManager.loadUserData();
            
            // رجیستر کردن section handlers
            this.registerSectionHandlers();
            
            this.initNavigation();
            this.setupEventListeners();
            this.renderHomePage();
            
            UI.showSuccess('برنامه آماده است!');
            console.timeEnd('AppInitialization');
            
        } catch (error) {
            console.error('❌ Critical Error during initialization:', error);
            UI.showError('خطا در بارگذاری برنامه. لطفاً صفحه را رفرش کنید.');
        }
    }

    waitForDOM() {
        return new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    cacheDOM() {
        this.dom = {
            homePage: document.getElementById('home-page'),
            lessonPage: document.getElementById('lesson-page'),
            lessonTitle: document.getElementById('lesson-title'),
            lessonSubtitle: document.getElementById('lesson-subtitle'),
            lessonsContainer: document.getElementById('lessons-container'),
            sectionContainer: document.getElementById('section-container'),
            navButtons: document.querySelectorAll('.nav-btn'),
            backButton: document.querySelector('.btn-back')
        };

        const quizModule = document.getElementById('quiz-module');
        if (quizModule) {
            this.staticTemplates.quiz = quizModule.outerHTML;
            quizModule.remove(); 
        }
    }
    
    // متد جدید برای رجیستر کردن section handlers
    registerSectionHandlers() {
        console.log('📝 Registering section handlers...');
        
        this.sectionHandlers = {
            vocab: {
                module: this.vocabulary,
                dataKey: 'vocabulary',
                requiresInit: true
            },
            grammar: {
                module: this.grammar,
                dataKey: 'grammar',
                requiresInit: true
            },
            speaking: {
                module: this.speaking, // <-- اضافه کردن Speaking
                dataKey: 'speaking',
                requiresInit: true
            },
            games: {
                module: this.games,
                dataKey: 'games',
                requiresInit: true
            },
            flashcard: {
                module: this.flashcards,
                dataKey: 'flashcards',
                requiresInit: true
            }
        };
        
        console.log('✅ Registered handlers:', Object.keys(this.sectionHandlers));
    }

    /* ==================== Navigation & UI Logic ==================== */
    
    initNavigation() {
        this.createScrollToTopButton();
        this.setupScrollEvents();
    }
    
    createScrollToTopButton() {
        const existingBtn = document.getElementById('scroll-to-top');
        if (existingBtn) existingBtn.remove();
        
        this.scrollToTopBtn = document.createElement('button');
        this.scrollToTopBtn.id = 'scroll-to-top';
        this.scrollToTopBtn.className = 'scroll-to-top-btn';
        this.scrollToTopBtn.innerHTML = `
            <i class="fas fa-chevron-up"></i>
            <span class="btn-text">بالا</span>
        `;
        this.scrollToTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
        
        document.body.appendChild(this.scrollToTopBtn);
    }
    
    setupScrollEvents() {
        let isScrolling = false;
        
        const handleScroll = () => {
            if (!isScrolling) {
                window.requestAnimationFrame(() => {
                    const currentScrollY = window.scrollY;
                    if (this.scrollToTopBtn) {
                        this.scrollToTopBtn.classList.toggle('visible', currentScrollY > 300);
                    }
                    isScrolling = false;
                });
                isScrolling = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    /* ==================== Core Business Logic ==================== */

    setupEventListeners() {
        this.dom.navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                if(section) this.switchSection(section);
            });
        });
        
        this.dom.backButton?.addEventListener('click', () => this.goToHome());
    }

    renderHomePage() {
        if (!this.dom.homePage) return;
        this._cleanupModals();
        
        this.dom.homePage.classList.add('active');
        this.dom.lessonPage?.classList.remove('active');
        this.state.isLessonActive = false;
        
        const lessons = this.lessonManager.getAllLessons();
        
        if (!lessons || lessons.length === 0) {
            if(this.dom.lessonsContainer) this.dom.lessonsContainer.innerHTML = '<div class="no-lessons">هیچ درسی یافت نشد</div>';
            return;
        }

        const html = lessons.map(lesson => {
            const progress = this.progressManager.getLessonProgress(lesson.id);
            return `
                <div class="lesson-card">
                    <div class="lesson-icon">${lesson.icon}</div>
                    <h3>درس ${lesson.id}: ${lesson.title}</h3>
                    <p class="subtitle">${lesson.subtitle}</p>
                    <div class="lesson-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <span class="progress-text">${progress}% تکمیل</span>
                    </div>
                    <button class="btn-gradient start-lesson-btn" data-lesson-id="${lesson.id}">
                        <i class="fas fa-play-circle"></i>
                        ${progress > 0 ? 'ادامه' : 'شروع یادگیری'}
                    </button>
                </div>
            `;
        }).join('');
        
        if (this.dom.lessonsContainer) {
            this.dom.lessonsContainer.innerHTML = html;
            this.dom.lessonsContainer.onclick = (e) => {
                const btn = e.target.closest('.start-lesson-btn');
                if (btn) {
                    this.openLesson(btn.dataset.lessonId);
                }
            };
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async openLesson(lessonId) {
        const lesson = this.lessonManager.setCurrentLesson(lessonId);
        if (!lesson) {
            UI.showError('درس یافت نشد');
            return;
        }
        
        this._cleanupModals();
        
        this.dom.homePage?.classList.remove('active');
        this.dom.lessonPage?.classList.add('active');
        this.state.isLessonActive = true;
        
        if (this.dom.lessonTitle) this.dom.lessonTitle.textContent = `درس ${lesson.id}: ${lesson.title}`;
        if (this.dom.lessonSubtitle) this.dom.lessonSubtitle.textContent = lesson.subtitle;

        try {
            UI.showLoading(true);
            
            // بارگذاری داده‌های درس
            await Promise.all([
                this.lessonManager.loadLessonData(lessonId),
                this.conversation.loadData(lessonId),
                this.listening.loadData(lessonId),
                this.review.loadData(lessonId),
                // بررسی شرطی برای loadData در Quiz
                this.quiz.loadData ? this.quiz.loadData(lessonId) : Promise.resolve()
            ]);
            UI.showLoading(false);
        } catch (e) {
            console.warn('Error loading module data for lesson', lessonId, e);
            UI.showLoading(false);
        }

        await this.switchSection('vocab');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        UI.showSuccess(`درس ${lessonId} باز شد`);
    }

    async switchSection(sectionId) {
        if (!sectionId) return;
        
        if (this.state.currentSection === 'conversation' && this.conversation) this.conversation.stopPlayback(); 
        if (this.state.currentSection === 'listening' && this.listening) this.listening.stopPlayback();
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();

        this.state.currentSection = sectionId;
        
        this.dom.navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === sectionId);
        });
        
        if (this.dom.sectionContainer) {
            this.dom.sectionContainer.innerHTML = `
                <div class="loading-section">
                    <div class="loader"></div>
                    <p>در حال بارگذاری ${this.getSectionName(sectionId)}...</p>
                </div>
            `;
            
            try {
                let content = '';

                // 1. Conversation
                if (sectionId === 'conversation') {
                    content = this.conversation.getHtml();
                    this.dom.sectionContainer.innerHTML = content;
                    this.conversation.bindEvents(); 
                } 
                // 2. Listening
                else if (sectionId === 'listening') {
                    content = this.listening.getHtml();
                    this.dom.sectionContainer.innerHTML = content;
                    this.listening.bindEvents();
                }
                // 3. Review
                else if (sectionId === 'review') {
                    content = this.review.getHtml();
                    this.dom.sectionContainer.innerHTML = content;
                    this.review.bindEvents();
                }
                // 4. Quiz - اصلاح شده
                else if (sectionId === 'quiz') {
                    if (typeof this.quiz.getHtml === 'function') {
                        content = this.quiz.getHtml();
                        this.dom.sectionContainer.innerHTML = content;
                        
                        // استفاده از setTimeout برای اطمینان از بارگذاری DOM
                        setTimeout(() => {
                            if (this.quiz && typeof this.quiz.init === 'function') {
                                const lessonId = this.lessonManager.currentLessonId || '1';
                                this.quiz.init(lessonId);
                            } else if (typeof this.quiz.bindEvents === 'function') {
                                const lessonId = this.lessonManager.currentLessonId || '1';
                                this.quiz.bindEvents(lessonId);
                            }
                        }, 50);
                    } 
                    else if (this.staticTemplates.quiz) {
                        this.dom.sectionContainer.innerHTML = this.staticTemplates.quiz;
                        const qMod = document.getElementById('quiz-module');
                        if(qMod) qMod.style.display = 'block';
                    }
                }
                // 5. Speaking - استفاده از sectionRenderer برای Speaking
                else if (sectionId === 'speaking') {
                    console.log('🎤 Loading Speaking section via SectionRenderer...');
                    
                    // استفاده از sectionRenderer برای Speaking
                    try {
                        // مقداردهی اولیه ماژول Speaking
                        if (this.speaking) {
                            await this.speaking.init(this.lessonManager.currentLessonData);
                        }
                        
                        // render کردن Speaking
                        content = await this.sectionRenderer.renderSection(sectionId);
                        this.dom.sectionContainer.innerHTML = content;
                        
                        console.log('✅ Speaking section rendered successfully');
                    } catch (speakingError) {
                        console.error('❌ Error loading Speaking section:', speakingError);
                        this.dom.sectionContainer.innerHTML = `
                            <div class="error-section">
                                <i class="fas fa-exclamation-triangle"></i>
                                <p>خطا در بارگذاری بخش گفتار. لطفاً دوباره تلاش کنید.</p>
                                <button class="btn-gradient" onclick="app.switchSection('speaking')">
                                    تلاش مجدد
                                </button>
                            </div>
                        `;
                    }
                }
                // 6. Other Standard Sections (شامل games و vocab و grammar و flashcard)
                else {
                    // استفاده از SectionRenderer برای سایر بخش‌ها
                    content = await this.sectionRenderer.renderSection(sectionId);
                    
                    // ============================================
                    // بخش حیاتی: پاک‌سازی فیزیکی کدهای مزاحم قدیمی
                    // ============================================
                    content = this._sanitizeLegacyContent(content);
                    
                    this.dom.sectionContainer.innerHTML = content;
                }
                
            } catch (error) {
                console.error(`Failed to render section ${sectionId}:`, error);
                this.dom.sectionContainer.innerHTML = `
                    <div class="error-section">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>خطا در بارگذاری بخش. لطفاً دوباره تلاش کنید.</p>
                        <button class="btn-gradient" onclick="app.switchSection('${sectionId}')">
                            تلاش مجدد
                        </button>
                    </div>
                `;
            }
        }
    }

    /**
     * این تابع مثل یک صافی عمل می‌کند و کدهای قدیمی HTML
     * (مثل نوار ناوبری متنی) را از محتوا حذف می‌کند.
     */
    _sanitizeLegacyContent(htmlContent) {
        if (!htmlContent) return '';
        if (typeof htmlContent !== 'string') return htmlContent;

        // 1. حذف تگ‌های <center> که معمولاً حاوی لینک‌های قدیمی هستند
        // این کار تمام محتوای داخل سنتر را حذف می‌کند (چون در طراحی جدید سنتر استفاده نمی‌شود)
        let cleanHtml = htmlContent.replace(/<center>[\s\S]*?<\/center>/gi, '');

        // 2. حذف دایوهایی با کلاس nav-links
        cleanHtml = cleanHtml.replace(/<div[^>]*class=["']nav-links["'][^>]*>[\s\S]*?<\/div>/gi, '');

        // 3. حذف لینک‌های تکی که در ابتدای متن رها شده‌اند (مثل: <a href="#vocab">...</a>)
        // این رجکس لینک‌هایی که با | جدا شده‌اند را هم پیدا می‌کند
        cleanHtml = cleanHtml.replace(/^\s*(<a\s+href=["']#[^"']*["'][^>]*>.*?<\/a>\s*\|?\s*)+/gim, '');

        return cleanHtml;
    }

    getSectionName(sectionId) {
        const section = SECTIONS_CONFIG.find(s => s.id === sectionId);
        return section ? section.name : sectionId;
    }

    goToHome() {
        console.log('Navigating to Home');
        
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();

        if (this.conversation) this.conversation.stopPlayback();
        if (this.listening) this.listening.stopPlayback();
        
        this._cleanupModals();
        this.renderHomePage();
    }

    _cleanupModals() {
        document.querySelectorAll('.word-modal').forEach(modal => modal.remove());
        document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
    }

    /* ==================== Public Methods / Delegates ==================== */
    
    resetProgress() {
        if(confirm('آیا از حذف تمام پیشرفت‌های خود مطمئن هستید؟')) {
            localStorage.clear();
            location.reload();
        }
    }

    playWordAudio(word, accent = 'us') {
        this.audioManager.playWord(word, accent);
    }

    toggleWord(wordId) {
        const learned = this.vocabulary.toggleWord(wordId);
        UI.showSuccess(learned ? 'کلمه یادگرفته شد' : 'کلمه از لیست حذف شد');
    }
    
    flipFlashcard() { this.flashcards?.flipCard(); }
    nextFlashcard() { this.flashcards?.nextCard(); }
    prevFlashcard() { this.flashcards?.prevCard(); }
    markFlashcardAsLearned() { this.flashcards?.markAsLearned(); }
    shuffleFlashcards() { this.flashcards?.shuffleCards(); }
    restartFlashcards() { this.flashcards?.restartDeck(); }
    
    playFrontAudio(accent = 'us') { this.flashcards?.playFrontAudio(accent); }
    playExampleAudio(accent = 'us') { this.flashcards?.playExampleAudio(accent); }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!window.app) {
        new English7App().init();
    }
});
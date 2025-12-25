// js/utils/SectionRenderer.js (یا js/modules/SectionRenderer.js بسته به ساختار پوشه شما)

export class SectionRenderer {
    constructor(app) {
        this.app = app;
        this.sections = {
            vocab: app.vocabulary,
            grammar: app.grammar,
            conversation: app.conversation,
            speaking: app.speaking,
            listening: app.listening,
            review: app.review,
            quiz: app.quiz,
            games: app.games,
            flashcard: app.flashcards
        };
    }

    async renderSection(sectionName) {
        const section = this.sections[sectionName];
        if (!section) {
            console.error(`SectionRenderer: Module not found for '${sectionName}'`);
            return '<div class="error">بخش مورد نظر یافت نشد.</div>';
        }

        try {
            console.log(`Rendering section: ${sectionName}`);
            
            // 1. دریافت HTML از ماژول
            const html = await section.render();
            
            // 2. تلاش برای اتصال رویدادها (Event Binding)
            // استفاده از setTimeout برای اطمینان از قرارگیری HTML در صفحه
            if (typeof section.bindEvents === 'function') {
                setTimeout(() => {
                    this._bindSectionEvents(section, sectionName);
                }, 50);
            }

            // 3. ثبت پیشرفت در درس
            this._updateProgress(sectionName);
            
            return html;
        } catch (error) {
            console.error(`Error rendering section ${sectionName}:`, error);
            return `<div class="error">خطا در بارگذاری بخش: ${error.message}</div>`;
        }
    }

    // متد داخلی برای مدیریت هوشمند اتصال رویدادها
    _bindSectionEvents(section, sectionName) {
        let container = null;

        // استراتژی مخصوص برای بخش Speaking
        if (sectionName === 'speaking') {
            // ابتدا سعی کن speaking-container را پیدا کن
            const speakingContainer = document.querySelector('.speaking-container') || 
                                    document.getElementById('speaking-container');
            
            // اگر speaking-container پیدا شد
            if (speakingContainer) {
                container = speakingContainer;
                console.log(`✅ Speaking: Found speaking-container for events binding`);
            } 
            // اگر speaking-container پیدا نشد، section-container را بررسی کن
            else {
                const sectionContainer = document.getElementById('section-container');
                if (sectionContainer) {
                    container = sectionContainer;
                    console.log(`✅ Speaking: Using section-container for events binding`);
                }
            }
        } 
        // استراتژی مخصوص برای بخش بازی‌ها
        else if (sectionName === 'games') {
            const gameEl = document.querySelector('.games-menu') || document.querySelector('.game-container');
            if (gameEl) {
                container = gameEl.parentElement;
            }
        } 
        
        // برای سایر بخش‌ها: اگر کانتینر هنوز پیدا نشده، از کانتینر اصلی محتوا استفاده کن
        if (!container) {
            container = document.getElementById('section-container') || 
                       document.getElementById('content');
        }

        if (container) {
            console.log(`✅ Binding events for ${sectionName} on:`, container);
            
            try {
                // برای بخش Speaking، container را به عنوان پارامتر بفرست
                if (sectionName === 'speaking') {
                    section.bindEvents(container);
                } else {
                    // برای سایر بخش‌ها از متد استاندارد استفاده کن
                    section.bindEvents(container);
                }
                console.log(`✅ Events bound successfully for ${sectionName}`);
            } catch (bindError) {
                console.error(`❌ Error binding events for ${sectionName}:`, bindError);
                
                // برای بخش Speaking، یک fallback اضافه کن
                if (sectionName === 'speaking') {
                    this._bindSpeakingFallback(container);
                }
            }
        } else {
            console.warn(`⚠️ SectionRenderer: Could not find container to bind events for ${sectionName}`);
            
            // برای بخش Speaking، یک fallback اضافه کن
            if (sectionName === 'speaking') {
                this._bindSpeakingFallback(document.body);
            }
        }
    }

    // متد fallback برای بخش Speaking
    _bindSpeakingFallback(container) {
        console.log('🔄 Trying fallback binding for Speaking...');
        
        // 1. Event delegation ساده
        container.addEventListener('click', (e) => {
            const target = e.target;
            
            // دکمه‌های level
            const levelBtn = target.closest('.level-btn');
            if (levelBtn && this.app.speaking) {
                const level = levelBtn.dataset.level;
                console.log(`Level button clicked: ${level}`);
                if (level && this.app.speaking.changeLevel) {
                    this.app.speaking.changeLevel(level);
                }
                return;
            }
            
            // دکمه‌های start exercise
            const startBtn = target.closest('.start-exercise-btn');
            if (startBtn && this.app.speaking) {
                const exerciseId = startBtn.dataset.exerciseId;
                console.log(`Start exercise button clicked: ${exerciseId}`);
                if (exerciseId && this.app.speaking.startExercise) {
                    this.app.speaking.startExercise(exerciseId);
                }
                return;
            }
            
            // دکمه back
            const backBtn = target.closest('#back-to-menu-btn');
            if (backBtn && this.app.speaking) {
                console.log('Back button clicked');
                if (this.app.speaking.backToMenu) {
                    this.app.speaking.backToMenu();
                }
                return;
            }
        });
        
        console.log('✅ Speaking fallback events bound');
    }

    _updateProgress(sectionName) {
        const lesson = this.app.lessonManager.getCurrentLesson();
        if (lesson && this.app.progressManager) {
            this.app.progressManager.markSectionCompleted(lesson.id, sectionName);
        }
    }

    getSectionName(section) {
        const names = {
            vocab: 'واژگان',
            grammar: 'گرامر',
            conversation: 'مکالمه',
            speaking: 'گفتار',
            listening: 'شنیدار',
            review: 'مرور',
            quiz: 'آزمون',
            games: 'بازی‌ها',
            flashcard: 'فلش‌کارت'
        };
        return names[section] || section;
    }

    getAllSections() {
        return Object.keys(this.sections);
    }
}
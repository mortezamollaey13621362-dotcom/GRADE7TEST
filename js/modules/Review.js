// js/modules/Review.js
import { UI } from '../utils/UI.js';

export class Review {
    constructor(lessonManager) {
        this.lessonManager = lessonManager;
        this.data = null;
        this.lessonId = null;
        this.activeTab = null; 
    }

    /**
     * بارگذاری داده‌های مرور از فایل JSON
     */
    async loadData(lessonId) {
        this.lessonId = lessonId;
        this.data = null;
        
        try {
            const response = await fetch(`data/lesson${lessonId}/review.json`);
            
            if (!response.ok) {
                console.warn(`Review data not found for lesson ${lessonId}`);
                return;
            }
            
            this.data = await response.json();
            
            // انتخاب تب اول به عنوان پیش‌فرض
            if (this.data && this.data.tabs && this.data.tabs.length > 0) {
                this.activeTab = this.data.tabs[0].id;
            }
            
        } catch (error) {
            console.error('Error loading review data:', error);
            UI.showError('خطا در بارگذاری بخش مرور');
        }
    }

    /**
     * تولید HTML برای نمایش در صفحه
     */
    getHtml() {
        if (!this.data || !this.data.tabs) {
            return `
                <div class="review-empty-state" style="text-align: center; padding: 40px; color: #b2bec3;">
                    <div class="text-center p-5">
                        <i class="fas fa-clipboard-list fa-3x mb-3 text-muted"></i>
                        <p>محتوای مرور برای این درس هنوز آماده نشده است.</p>
                    </div>
                </div>
            `;
        }

        // ساخت نوار تب‌ها
        const tabsHeader = this.data.tabs.map(tab => `
            <button class="review-tab-btn ${tab.id === this.activeTab ? 'active' : ''}" 
                    data-tab="${tab.id}">
                <i class="${this.getTabIcon(tab.id)}"></i>
                <span>${tab.title}</span>
            </button>
        `).join('');

        // یافتن دیتای تب فعال
        const activeTabData = this.data.tabs.find(t => t.id === this.activeTab);
        const contentHtml = activeTabData ? this.renderTabContent(activeTabData) : '';

        return `
            <div class="review-container animate-fade-in">
                <div class="review-header">
                    <h3><i class="fas fa-redo me-2"></i>مرور و تمرین</h3>
                </div>
                
                <div class="review-tabs-wrapper">
                    <div class="review-tabs">
                        ${tabsHeader}
                    </div>
                </div>

                <div class="review-content-area" id="review-content-area">
                    ${contentHtml}
                </div>
            </div>
        `;
    }

    /**
     * اتصال رویدادها پس از رندر شدن HTML
     */
    bindEvents() {
        const container = document.querySelector('.review-container');
        if (!container) return;

        // رویداد کلیک روی تب‌ها
        const tabButtons = container.querySelectorAll('.review-tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // پیدا کردن دکمه (چون ممکن است روی آیکون کلیک شده باشد)
                const targetBtn = e.target.closest('.review-tab-btn');
                if(targetBtn) {
                    const tabId = targetBtn.dataset.tab;
                    this.switchTab(tabId);
                }
            });
        });

        // بایند کردن رویدادهای مخصوص محتوا
        this.bindTabSpecificEvents(container);
    }

    // --- توابع داخلی و کمکی ---

    switchTab(tabId) {
        this.activeTab = tabId;
        
        // بروزرسانی کلاس active دکمه‌ها
        document.querySelectorAll('.review-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // رندر مجدد محتوا
        const activeTabData = this.data.tabs.find(t => t.id === tabId);
        const contentArea = document.getElementById('review-content-area');
        
        if (contentArea && activeTabData) {
            // افکت محو شدن و ظاهر شدن
            contentArea.style.opacity = '0';
            setTimeout(() => {
                contentArea.innerHTML = this.renderTabContent(activeTabData);
                contentArea.style.opacity = '1';
                this.bindTabSpecificEvents(document.querySelector('.review-container'));
            }, 150);
        }
    }

    renderTabContent(tabData) {
        // این بخش هوشمند شده تا هر نوع دیتایی را نشان دهد
        // حتی اگر ID آن را نشناسد، محتوای متنی آن را چاپ می‌کند
        
        // تشخیص بر اساس IDهای رایج
        const id = tabData.id.toLowerCase();

        if (id.includes('warmup') || id.includes('part1')) {
            return `
                <div class="tab-pane-content">
                    <h4 class="text-primary mb-3">🔥 ${tabData.title}</h4>
                    <div class="p-3 bg-light rounded border">${this.formatContent(tabData.content)}</div>
                </div>`;
        }
        
        if (id.includes('structure') || id.includes('grammar') || id.includes('part2')) {
            return `
                <div class="tab-pane-content">
                    <h4 class="text-success mb-3">🏗️ ${tabData.title}</h4>
                    <div class="p-3 bg-white rounded shadow-sm border">${this.formatContent(tabData.content)}</div>
                </div>`;
        }

        if (id.includes('comprehension') || id.includes('reading') || id.includes('part3')) {
            return `
                <div class="tab-pane-content">
                    <h4 class="text-info mb-3">🧠 ${tabData.title}</h4>
                    <div class="p-3 bg-light rounded">${this.formatContent(tabData.content)}</div>
                </div>`;
        }

        if (id.includes('mastery') || id.includes('practice') || id.includes('part4')) {
             return `
                <div class="tab-pane-content">
                    <h4 class="text-warning mb-3">🏆 ${tabData.title}</h4>
                    <div class="p-3 bg-white rounded border border-warning">${this.formatContent(tabData.content)}</div>
                </div>`;
        }

        // حالت‌های خاص قدیمی
        if (id === 'scramble') return this.renderScramble(tabData.content);
        if (id === 'dictation') return this.renderDictation(tabData.content);

        // *** حالت پیش‌فرض عمومی (برای رفع ارور "یافت نشد") ***
        // اگر هیچکدام نبود، محتوا را خام نشان بده
        return `
            <div class="tab-pane-content">
                <h4>📌 ${tabData.title}</h4>
                <div class="generic-content">
                    ${this.formatContent(tabData.content)}
                </div>
            </div>`;
    }

    // یک تابع کمکی برای اینکه اگر محتوا آبجکت بود خراب نشود
    formatContent(content) {
        if (typeof content === 'string') return content;
        if (Array.isArray(content)) return content.join('<br>');
        if (typeof content === 'object') return JSON.stringify(content, null, 2);
        return content;
    }

    bindTabSpecificEvents(container) {
        // اتصال دکمه‌های صوتی اگر وجود داشته باشند
        container.querySelectorAll('.play-audio-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const text = e.currentTarget.dataset.text;
                if(text && window.app && window.app.audioManager) {
                    window.app.audioManager.playText(text);
                }
            });
        });

        // دکمه‌های اسکرامبل
        const checkScrambleBtn = container.querySelector('#check-scramble-btn');
        if (checkScrambleBtn) {
            checkScrambleBtn.addEventListener('click', () => this.checkScrambleAnswer());
        }
    }

    getTabIcon(id) {
        // نگاشت آیکون‌ها بر اساس نام تب‌ها
        const lowerId = id.toLowerCase();
        
        if (lowerId.includes('warmup') || lowerId.includes('part1')) return 'fas fa-fire';
        if (lowerId.includes('structure') || lowerId.includes('grammar')) return 'fas fa-layer-group';
        if (lowerId.includes('comprehension') || lowerId.includes('reading')) return 'fas fa-brain';
        if (lowerId.includes('mastery') || lowerId.includes('part4')) return 'fas fa-trophy';
        
        if (lowerId.includes('scramble')) return 'fas fa-random';
        if (lowerId.includes('dictation')) return 'fas fa-pen-alt';
        if (lowerId.includes('chat')) return 'fas fa-comments';
        if (lowerId.includes('quiz')) return 'fas fa-question-circle';

        return 'fas fa-star'; // آیکون پیش‌فرض
    }

    // --- رندرهای خاص ---
    renderScramble(content) {
        return `
            <div class="tab-pane-content scramble-section">
                <h4>مرتب‌سازی جملات</h4>
                <div class="scramble-area text-muted p-3 border rounded">
                   ${this.formatContent(content)}
                </div>
            </div>
        `;
    }

    renderDictation(content) {
        return `<div class="tab-pane-content"><h4>دیکته و نوشتن</h4><p>${this.formatContent(content)}</p></div>`;
    }
}

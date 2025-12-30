// js/modules/Grammar.js

const currentLesson = {
    title: "ضمایر فاعلی و افعال To Be",
    level: "مقدماتی",
    // داده‌ها به دو تاپیک (تب) تقسیم شده‌اند
    topics: [
        {
            title: "مفاهیم پایه", // عنوان تب اول
            sections: [
                {
                    type: "intro",
                    icon: "👋",
                    text: "در زبان انگلیسی، برای اینکه بگوییم «من هستم»، «تو هستی» و... از افعال <b>To Be</b> استفاده می‌کنیم. این پایه‌ترین بخش گرامر است."
                },
                {
                    type: "formula",
                    title: "فرمول ساخت جمله مثبت",
                    content: "Subject (فاعل) + am / is / are + ..."
                },
                {
                    type: "table",
                    title: "جدول صرف فعل",
                    headers: ["فاعل", "فعل To Be", "مثال", "ترجمه"],
                    rows: [
                        { col1: "I", col2: "am", col3: "I am happy.", col4: "من خوشحال هستم." },
                        { col1: "You", col2: "are", col3: "You are smart.", col4: "تو باهوش هستی." },
                        { col1: "He / She / It", col2: "is", col3: "He is a teacher.", col4: "او معلم است." },
                        { col1: "We / They", col2: "are", col3: "We are friends.", col4: "ما دوست هستیم." }
                    ]
                }
            ]
        },
        {
            title: "نکات و مثال‌ها", // عنوان تب دوم
            sections: [
                {
                    type: "warning",
                    title: "⚠️ نکته مهم!",
                    text: "برای I همیشه am، برای مفرد (He/She/It) همیشه is و برای جمع (We/You/They) همیشه are می‌آید."
                },
                {
                    type: "examples",
                    title: "🗣️ مثال‌های بیشتر",
                    items: [
                        { en: "Tehran is big.", fa: "تهران بزرگ است." },
                        { en: "My father is at home.", fa: "پدرم در خانه است." }
                    ]
                }
            ]
        }
    ],
    // ۵ سوال تستی برای آزمون نهایی (مشترک برای کل درس)
    quiz: [
        { q: "She _____ a nurse.", options: ["am", "is", "are"], answer: 1 }, 
        { q: "They _____ happy.", options: ["is", "am", "are"], answer: 2 }, 
        { q: "I _____ a student.", options: ["are", "am", "is"], answer: 1 }, 
        { q: "_____ you ready?", options: ["Is", "Am", "Are"], answer: 2 },   
        { q: "It _____ a cat.", options: ["am", "are", "is"], answer: 2 }     
    ]
};

export class Grammar {
    constructor() {
        this.data = currentLesson;
        this.activeTopicIndex = 0; // تب فعال پیش‌فرض (تب اول)
        
        // متغیرهای آزمون
        this.currentQIndex = 0;
        this.score = 0;

        // بایندینگ برای استفاده در ایونت لیسنرها
        this.switchTab = this.switchTab.bind(this);
        this.startPractice = this.startPractice.bind(this);
        
        // مدیریت کلیک‌ها به صورت متمرکز
        this.initEventListeners();
    }

    initEventListeners() {
        // گوش دادن به کلیک‌ها در کل صفحه (Delegation)
        // این روش بهینه‌تر از اضافه کردن لیسنر به تک‌تک عناصر است
        document.addEventListener('click', (e) => {
            // ۱. کلیک روی تب‌ها
            if (e.target.matches('.grammar-tab-btn')) {
                const index = parseInt(e.target.dataset.index);
                this.switchTab(index);
            }
            
            // ۲. کلیک روی دکمه شروع آزمون
            if (e.target.closest('.btn-quiz-start')) {
                this.startPractice();
            }

            // ۳. دکمه بستن نهایی آزمون
            if (e.target.id === 'btnCloseFinal' || e.target.id === 'btnCloseQuiz') {
                const modal = document.getElementById('grammarQuizModal');
                if (modal) modal.style.display = 'none';
            }

            // ۴. دکمه تکرار آزمون
            if (e.target.id === 'btnRestartQuiz') {
                this.startPractice();
            }
        });
    }

    // --- منطق تب‌ها ---

    switchTab(index) {
        this.activeTopicIndex = index;
        
        // آپدیت کردن محتوا
        const contentContainer = document.getElementById('grammar-dynamic-content');
        if (contentContainer) {
            contentContainer.innerHTML = this.renderSections();
            // تریگر کردن انیمیشن (Reset Animation)
            contentContainer.classList.remove('fade-in');
            void contentContainer.offsetWidth; // Force reflow
            contentContainer.classList.add('fade-in');
        }

        // آپدیت کردن کلاس active دکمه‌های تب
        const tabButtons = document.querySelectorAll('.grammar-tab-btn');
        tabButtons.forEach((btn, idx) => {
            if (idx === index) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }

    renderTabs() {
        return this.data.topics.map((topic, index) => `
            <button class="grammar-tab-btn ${index === this.activeTopicIndex ? 'active' : ''}" 
                    data-index="${index}">
                ${topic.title}
            </button>
        `).join('');
    }

    // --- منطق رندر محتوا ---

    renderSections() {
        // دریافت سکشن‌های مربوط به تب فعال
        const activeSections = this.data.topics[this.activeTopicIndex].sections;
        let contentHTML = '';

        activeSections.forEach(section => {
            if (section.type === 'intro') {
                contentHTML += `
                    <div class="grammar-card intro-card">
                        <span class="grammar-icon">${section.icon}</span>
                        <p>${section.text}</p>
                    </div>`;
            } else if (section.type === 'formula') {
                contentHTML += `
                    <div class="grammar-card formula-card">
                        <h5>${section.title}</h5>
                        <code class="formula-box">${section.content}</code>
                    </div>`;
            } else if (section.type === 'table') {
                let rowsHTML = section.rows.map(row => `
                    <tr>
                        <td><b>${row.col1}</b></td>
                        <td><span class="badge-verb">${row.col2}</span></td>
                        <td class="text-left" style="direction: ltr;">${row.col3}</td>
                        <td class="text-muted">${row.col4}</td>
                    </tr>`).join('');
                contentHTML += `
                    <div class="grammar-card">
                        <h4>${section.title}</h4>
                        <div class="table-responsive">
                            <table class="grammar-table">
                                <thead><tr>${section.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                                <tbody>${rowsHTML}</tbody>
                            </table>
                        </div>
                    </div>`;
            } else if (section.type === 'warning') {
                contentHTML += `
                    <div class="grammar-card warning-card">
                        <h5>${section.title}</h5>
                        <p>${section.text}</p>
                    </div>`;
            } else if (section.type === 'examples') {
                let listHTML = section.items.map(item => `
                    <li class="example-item">
                        <span class="en-text">${item.en}</span>
                        <span class="fa-text">${item.fa}</span>
                    </li>`).join('');
                contentHTML += `
                    <div class="grammar-card">
                        <h4>${section.title}</h4>
                        <ul class="example-list">${listHTML}</ul>
                    </div>`;
            }
        });
        return contentHTML;
    }

    render() {
        return `
            <div class="section-header">
                <h3 class="text-gradient"><i class="fas fa-book-open"></i> ${this.data.title}</h3>
                <span class="level-badge">${this.data.level}</span>
            </div>

            <!-- نوار تب‌ها -->
            <div class="grammar-tabs-wrapper" id="grammar-tabs-container">
                ${this.renderTabs()}
            </div>

            <!-- محتوای متغیر (بر اساس تب) -->
            <div id="grammar-dynamic-content" class="grammar-content-wrapper fade-in">
                ${this.renderSections()}
            </div>

            <!-- دکمه آزمون (همیشه پایین صفحه هست) -->
            <div class="quiz-section mt-4">
                <div class="quiz-info-card">
                    <p>مطالب همه تب‌ها را خواندید؟</p>
                    <button class="btn-quiz-start">
                        <i class="fas fa-gamepad"></i> شروع آزمون نهایی
                    </button>
                </div>
            </div>

            <!-- مودال آزمون -->
            <div id="grammarQuizModal" class="quiz-modal-overlay" style="display:none;"></div>
        `;
    }

    // --- منطق آزمون (Quiz) ---

    startPractice() {
        this.currentQIndex = 0;
        this.score = 0;
        const modal = document.getElementById('grammarQuizModal');
        if (modal) {
            modal.style.display = 'flex';
            this.renderQuestion();
        }
    }

    renderQuestion() {
        const modal = document.getElementById('grammarQuizModal');
        const qData = this.data.quiz[this.currentQIndex];
        const progress = ((this.currentQIndex + 1) / this.data.quiz.length) * 100;

        modal.innerHTML = `
            <div class="quiz-box animate-pop">
                <div class="quiz-header">
                    <span>سوال ${this.currentQIndex + 1} از ${this.data.quiz.length}</span>
                    <button class="close-quiz" id="btnCloseQuiz">&times;</button>
                </div>
                <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${progress}%"></div></div>
                
                <h3 class="quiz-question">${qData.q}</h3>
                
                <div class="quiz-options">
                    ${qData.options.map((opt, idx) => `
                        <button class="quiz-option-btn" data-index="${idx}">${opt}</button>
                    `).join('')}
                </div>
            </div>
        `;

        // هندل کردن کلیک گزینه‌ها (فقط برای همین مودال رندر شده)
        const buttons = modal.querySelectorAll('.quiz-option-btn');
        buttons.forEach(btn => {
            btn.onclick = (e) => this.checkAnswer(parseInt(e.target.dataset.index), qData.answer, buttons);
        });
    }

    checkAnswer(selectedIndex, correctIndex, buttons) {
        buttons.forEach(btn => btn.disabled = true);

        if (selectedIndex === correctIndex) {
            this.score++;
            buttons[selectedIndex].classList.add('correct');
            buttons[selectedIndex].innerHTML += ' <i class="fas fa-check"></i>';
        } else {
            buttons[selectedIndex].classList.add('wrong');
            buttons[correctIndex].classList.add('correct');
        }

        setTimeout(() => {
            this.currentQIndex++;
            if (this.currentQIndex < this.data.quiz.length) {
                this.renderQuestion();
            } else {
                this.showResult();
            }
        }, 1500);
    }

    showResult() {
        const modal = document.getElementById('grammarQuizModal');
        let message = "";
        let icon = "";
        
        if (this.score === 5) { message = "فوق‌العاده بود! 🌟"; icon = "🏆"; }
        else if (this.score >= 3) { message = "خوب بود! 👍"; icon = "👏"; }
        else { message = "نیاز به تمرین بیشتر داری 💪"; icon = "📚"; }

        modal.innerHTML = `
            <div class="quiz-box result-box animate-pop">
                <div class="result-icon">${icon}</div>
                <h2>پایان آزمون</h2>
                <p>امتیاز شما: <b>${this.score}</b> از <b>${this.data.quiz.length}</b></p>
                <p class="result-msg">${message}</p>
                <div class="quiz-actions">
                    <button class="btn-quiz-restart" id="btnRestartQuiz">تکرار آزمون</button>
                    <button class="btn-quiz-close-final" id="btnCloseFinal">بستن</button>
                </div>
            </div>
        `;
    }
}

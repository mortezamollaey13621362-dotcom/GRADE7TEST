// js/modules/Games.js - نسخه کاملاً اصلاح شده برای games.json تو

export class Games {
    constructor(app) {
        console.log("🎮 Games Module Created");
        this.app = app;
        this.gamesData = []; // داده‌های games.json
        this.availableGames = []; // بازی‌های موجود از فایل
        this.container = null;
        this.activeGame = null;
        this.currentGame = null; // بازی فعلی از لیست
        
        this.gameState = {
            score: 0,
            cards: [],
            flippedCards: [],
            matchedPairs: 0,
            scrambleWord: null,
            userAnswer: [],
            currentGameId: null
        };
    }

    async init(data) {
        console.log("✅ Games Module Initialized");
        this.lessonData = data || {};
        
        // بارگذاری games.json
        await this._loadGamesConfig();
        
        this.activeGame = null;
        this.currentGame = null;
    }

    render() {
        if (this.activeGame && this.currentGame) {
            return this._getGameHtml();
        }
        return this._getMenuHtml();
    }

    _getMenuHtml() {
        if (this.availableGames.length === 0) {
            return `
                <div class="games-menu animate__animated animate__fadeIn">
                    <div class="game-intro">
                        <h3>اتاق بازی و سرگرمی 🎮</h3>
                        <p>در حال بارگذاری بازی‌ها...</p>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="games-menu animate__animated animate__fadeIn">
                <div class="game-intro">
                    <h3>اتاق بازی و سرگرمی 🎮</h3>
                    <p>${this.availableGames.length} بازی برای تمرین</p>
                </div>

                <div class="games-grid">
                    ${this._renderGameCards()}
                </div>
            </div>
        `;
    }

    _renderGameCards() {
        return this.availableGames.map((game, index) => {
            const icon = game.type === 'memory' ? '🧠' : '🔤';
            const typeText = game.type === 'memory' ? 'حافظه' : 'مرتب‌سازی';
            
            return `
                <div class="game-select-card" data-game-id="${game.id}">
                    <div class="card-icon ${game.type === 'memory' ? 'memory-icon' : 'word-icon'}">
                        ${icon}
                    </div>
                    <div class="card-info">
                        <h4>${game.title}</h4>
                        <span>${typeText} • ${game.type === 'memory' ? game.pairs.length + ' جفت' : game.items.length + ' کلمه'}</span>
                    </div>
                    <div class="arrow">❮</div>
                </div>
            `;
        }).join('');
    }

    _getGameHtml() {
        if (!this.currentGame) return this._getMenuHtml();
        
        const isMemory = this.currentGame.type === 'memory';
        
        let content = '';
        if (isMemory) {
            content = `<div class="memory-grid" id="memory-board">در حال آماده‌سازی بازی...</div>`;
        } else {
            content = `
                <div class="scramble-ui">
                    <div class="hint-box">
                        <span class="hint-label">معنی:</span>
                        <h3 class="hint-text" id="scramble-hint">${this.gameState.scrambleWord?.hint || '...'}</h3>
                    </div>
                    <div class="answer-slots" id="answer-slots"></div>
                    <div class="letters-pool" id="letters-pool"></div>
                    <div class="scramble-actions">
                        <button class="btn-small-round" id="reset-scramble">↺ پاک کردن</button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="game-container animate__animated animate__fadeIn">
                <div class="game-header">
                    <button class="btn-back" id="btn-exit-game">🏠 خروج</button>
                    <div class="game-stats">
                        <span>${this.currentGame.title}</span>
                        <span style="margin-right: 15px;">امتیاز: <b id="score-display">${this.gameState.score}</b></span>
                    </div>
                </div>
                ${content}
            </div>
        `;
    }

    bindEvents(container) {
        this.container = container;
        console.log("🎯 Games: bindEvents called");
        
        container.onclick = (e) => {
            // شروع بازی از منو
            const card = e.target.closest('.game-select-card');
            if (card) {
                const gameId = card.dataset.gameId;
                this.launchGameById(gameId);
                return;
            }

            // خروج از بازی
            if (e.target.closest('#btn-exit-game')) {
                this.exitGame();
                return;
            }

            // دکمه ریست
            if (e.target.closest('#reset-scramble')) {
                this._resetScramble();
                return;
            }
        };

        if (this.activeGame && this.currentGame) {
            setTimeout(() => {
                if (this.currentGame.type === 'memory') {
                    this._renderMemoryBoard();
                } else if (this.currentGame.type === 'scramble') {
                    this._renderScrambleLevel();
                }
            }, 100);
        }
    }

    exitGame() {
        console.log("🏠 Games: Exiting to menu");
        this.activeGame = null;
        this.currentGame = null;
        this.gameState.score = 0;
        this.gameState.currentGameId = null;
        
        if (this.app?.renderer) {
            this.app.renderer.renderSection('games');
        } else if (this.container) {
            this.container.innerHTML = this.render();
            this.bindEvents(this.container);
        }
    }

    async launchGameById(gameId) {
        console.log(`🚀 Games: Launching game ${gameId}`);
        
        const game = this.availableGames.find(g => g.id === gameId);
        if (!game) {
            console.error(`❌ Games: Game ${gameId} not found`);
            return;
        }
        
        this.currentGame = game;
        this.activeGame = game.type;
        this.gameState.score = 0;
        this.gameState.currentGameId = gameId;
        
        console.log(`🎮 Games: Starting "${game.title}"`);
        
        // تنظیم داده‌های بازی
        if (game.type === 'memory') {
            this._setupMemoryData(game);
        } else if (game.type === 'scramble') {
            this._setupScrambleData(game);
        }
        
        // رندر مجدد UI
        this._forceRerender();
    }

    // --- بارگذاری games.json ---
    async _loadGamesConfig() {
        try {
            console.log("📂 Games: Loading games.json...");
            
            // از درس جاری بگیر
            const lessonId = this.app?.lessonManager?.currentLessonId || '1';
            const response = await fetch(`data/lesson${lessonId}/games.json`);
            
            if (response.ok) {
                const gamesConfig = await response.json();
                this.availableGames = gamesConfig.games || [];
                console.log(`✅ Games: Loaded ${this.availableGames.length} games from games.json`);
                
                // اگر memory و scramble جدا هستند، نمایش بده
                const memoryGames = this.availableGames.filter(g => g.type === 'memory');
                const scrambleGames = this.availableGames.filter(g => g.type === 'scramble');
                
                console.log(`📊 Games: ${memoryGames.length} memory games, ${scrambleGames.length} scramble games`);
                
            } else {
                console.log("ℹ️ Games: No games.json found");
                this.availableGames = this._getDefaultGames();
            }
            
        } catch (error) {
            console.error("❌ Games: Error loading games.json:", error);
            this.availableGames = this._getDefaultGames();
        }
    }

    _getDefaultGames() {
        // بازی‌های پیش‌فرض اگر games.json نبود
        return [
            {
                id: "memory_fallback",
                type: "memory",
                title: "بازی حافظه",
                pairs: [
                    { en: "Hello", fa: "سلام" },
                    { en: "Goodbye", fa: "خداحافظ" },
                    { en: "Thank you", fa: "متشکرم" },
                    { en: "Please", fa: "لطفاً" }
                ]
            },
            {
                id: "scramble_fallback",
                type: "scramble",
                title: "مرتب‌سازی کلمات",
                items: [
                    { word: "HELLO", hint: "سلام" },
                    { word: "THANK", hint: "تشکر" },
                    { word: "PLEASE", hint: "لطفاً" }
                ]
            }
        ];
    }

    // رندر مجدد اجباری
    _forceRerender() {
        if (this.app?.renderer) {
            this.app.renderer.renderSection('games');
        } else if (this.container) {
            this.container.innerHTML = this.render();
            this.bindEvents(this.container);
            
            setTimeout(() => {
                if (this.currentGame?.type === 'memory') {
                    this._renderMemoryBoard();
                } else if (this.currentGame?.type === 'scramble') {
                    this._renderScrambleLevel();
                }
            }, 50);
        } else {
            console.error("❌ Games: No container available for rendering");
        }
    }

    // --- بازی حافظه ---
    _setupMemoryData(game) {
        console.log(`🃏 Memory: Setting up "${game.title}"`);
        
        if (!game.pairs || game.pairs.length === 0) {
            console.error("❌ Memory: No pairs found in game config");
            return;
        }
        
        console.log(`🎯 Memory: ${game.pairs.length} pairs available`);
        
        // استفاده از همه جفت‌های بازی
        const pairs = game.pairs;
        
        let deck = [];
        pairs.forEach((pair, idx) => {
            deck.push({ id: idx, content: pair.en, type: 'en' });
            deck.push({ id: idx, content: pair.fa, type: 'fa' });
        });
        
        // ترکیب تصادفی کارت‌ها
        deck.sort(() => 0.5 - Math.random());
        
        this.gameState.cards = deck;
        this.gameState.flippedCards = [];
        this.gameState.matchedPairs = 0;
        
        console.log(`✅ Memory: Created ${deck.length} cards from game config`);
    }

    _renderMemoryBoard() {
        const board = document.getElementById('memory-board');
        if (!board) {
            console.error("❌ Memory: Board element not found");
            return;
        }
        
        console.log(`🎨 Memory: Rendering ${this.gameState.cards.length} cards`);
        
        board.innerHTML = '';
        this.gameState.cards.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'memory-card';
            cardEl.dataset.index = index;
            cardEl.innerHTML = `
                <div class="front-face"></div>
                <div class="back-face ${card.type === 'en' ? 'en-text' : ''}">${card.content}</div>
            `;
            cardEl.onclick = (e) => {
                e.stopPropagation();
                this._handleCardFlip(cardEl, card);
            };
            board.appendChild(cardEl);
        });
        
        console.log("✅ Memory: Board rendered successfully");
    }

    _handleCardFlip(element, cardData) {
        if (this.gameState.flippedCards.length >= 2) return;
        if (element.classList.contains('flip') || element.classList.contains('matched')) return;
        
        console.log(`🃏 Memory: Flipping card ${cardData.id} (${cardData.content})`);
        
        element.classList.add('flip');
        this.gameState.flippedCards.push({ element, data: cardData });
        
        if (this.gameState.flippedCards.length === 2) {
            setTimeout(() => this._checkMemoryMatch(), 500);
        }
    }

    _checkMemoryMatch() {
        const [c1, c2] = this.gameState.flippedCards;
        console.log(`🔍 Memory: Checking match ${c1.data.id} vs ${c2.data.id}`);
        
        if (c1.data.id === c2.data.id) {
            console.log("✅ Memory: Match found!");
            c1.element.classList.add('matched');
            c2.element.classList.add('matched');
            this.gameState.score += 10;
            this.gameState.matchedPairs++;
            this._updateScore();
            this.gameState.flippedCards = [];
            
            if (this.gameState.matchedPairs >= this.gameState.cards.length / 2) {
                setTimeout(() => {
                    alert(`🎉 تبریک! شما برنده شدید!\nامتیاز نهایی: ${this.gameState.score}`);
                    this.exitGame();
                }, 800);
            }
        } else {
            console.log("❌ Memory: No match");
            setTimeout(() => {
                c1.element.classList.remove('flip');
                c2.element.classList.remove('flip');
                this.gameState.flippedCards = [];
            }, 1000);
        }
    }

    // --- بازی Scramble ---
    _setupScrambleData(game) {
        console.log(`🔤 Scramble: Setting up "${game.title}"`);
        
        if (!game.items || game.items.length === 0) {
            console.error("❌ Scramble: No items found in game config");
            return;
        }
        
        console.log(`🎯 Scramble: ${game.items.length} words available`);
        
        // انتخاب تصادفی یک کلمه از لیست
        const shuffledItems = [...game.items].sort(() => 0.5 - Math.random());
        const selectedItem = shuffledItems[0];
        
        this.gameState.scrambleWord = {
            word: selectedItem.word.toUpperCase(),
            hint: selectedItem.hint
        };
        
        this.gameState.userAnswer = Array(this.gameState.scrambleWord.word.length).fill(null);
        
        console.log(`✅ Scramble: Selected word: ${this.gameState.scrambleWord.word}`);
    }

    _renderScrambleLevel() {
        const wordData = this.gameState.scrambleWord;
        const correctWord = wordData.word.toUpperCase();
        
        console.log(`🎨 Scramble: Rendering word ${correctWord}`);
        
        // نمایش معنی
        const hintEl = document.getElementById('scramble-hint');
        if (hintEl) {
            hintEl.textContent = wordData.hint;
            console.log(`💡 Scramble: Hint set to "${wordData.hint}"`);
        }
        
        // ایجاد جایگاه‌ها - چپ به راست
        const slotsContainer = document.getElementById('answer-slots');
        if (slotsContainer) {
            slotsContainer.style.direction = 'ltr';
            slotsContainer.style.textAlign = 'center';
            slotsContainer.innerHTML = '';
            
            for (let i = 0; i < correctWord.length; i++) {
                const slot = document.createElement('div');
                slot.className = 'slot';
                slot.dataset.index = i;
                slot.style.direction = 'ltr';
                slot.style.fontFamily = "'Arial', 'Segoe UI', sans-serif";
                slotsContainer.appendChild(slot);
            }
            console.log(`📦 Scramble: Created ${correctWord.length} slots`);
        }
        
        // ایجاد حروف - چپ به راست
        const poolContainer = document.getElementById('letters-pool');
        if (poolContainer) {
            poolContainer.style.direction = 'ltr';
            poolContainer.style.textAlign = 'center';
            poolContainer.innerHTML = '';
            
            // حروف را بهم بریز
            let letters = correctWord.split('').sort(() => 0.5 - Math.random());
            
            letters.forEach((char, index) => {
                const btn = document.createElement('button');
                btn.className = 'letter-btn';
                btn.dataset.letter = char;
                btn.dataset.index = index;
                btn.textContent = char;
                btn.style.direction = 'ltr';
                btn.style.fontFamily = "'Arial', 'Segoe UI', sans-serif";
                
                btn.onclick = (e) => {
                    e.stopPropagation();
                    this._handleScrambleInput(char, e.target);
                };
                poolContainer.appendChild(btn);
            });
            
            console.log(`🔤 Scramble: Created ${letters.length} scrambled letter buttons`);
        }
        
        console.log("✅ Scramble: Level rendered");
    }

    _handleScrambleInput(char, btnElement) {
        if (btnElement.classList.contains('used')) return;
        
        // پیدا کردن اولین جایگاه خالی از چپ
        const emptyIndex = this.gameState.userAnswer.indexOf(null);
        if (emptyIndex === -1) {
            console.log("⚠️ Scramble: All slots are full");
            return;
        }
        
        console.log(`🔤 Scramble: Adding ${char} to slot ${emptyIndex} (from left)`);
        
        // اضافه کردن حرف به جایگاه خالی
        this.gameState.userAnswer[emptyIndex] = char;
        btnElement.classList.add('used');
        this._updateSlots();
        
        // بررسی اگر همه جایگاه‌ها پر شدند
        if (!this.gameState.userAnswer.includes(null)) {
            const attempt = this.gameState.userAnswer.join('');
            const correct = this.gameState.scrambleWord.word;
            
            console.log(`🔍 Scramble: Checking ${attempt} vs ${correct}`);
            
            if (attempt === correct) {
                console.log("✅ Scramble: Correct!");
                this.gameState.score += 20;
                this._updateScore();
                
                // افکت موفقیت
                const slots = document.querySelectorAll('.slot');
                slots.forEach(s => {
                    s.classList.add('correct-anim');
                    s.style.direction = 'ltr';
                });
                
                setTimeout(() => {
                    // انتخاب کلمه جدید از همین بازی
                    if (this.currentGame?.items?.length > 1) {
                        this._setupScrambleData(this.currentGame);
                        this._renderScrambleLevel();
                    } else {
                        alert('آفرین! همه کلمات را حل کردید! 🎉');
                        this.exitGame();
                    }
                }, 1000);
            } else {
                console.log("❌ Scramble: Incorrect");
                const slots = document.getElementById('answer-slots');
                if (slots) {
                    slots.classList.add('shake-anim');
                    setTimeout(() => slots.classList.remove('shake-anim'), 500);
                }
            }
        }
    }

    _resetScramble() {
        console.log("🔄 Scramble: Resetting");
        this.gameState.userAnswer.fill(null);
        this._updateSlots();
        document.querySelectorAll('.letter-btn').forEach(b => b.classList.remove('used'));
    }

    _updateSlots() {
        const slots = document.querySelectorAll('.slot');
        slots.forEach((slot, index) => {
            const char = this.gameState.userAnswer[index];
            slot.textContent = char || '';
            slot.style.direction = 'ltr';
            slot.style.fontFamily = "'Arial', 'Segoe UI', sans-serif";
            
            if (char) {
                slot.classList.add('filled');
                slot.classList.remove('empty');
            } else {
                slot.classList.remove('filled');
                slot.classList.add('empty');
            }
        });
    }

    _updateScore() {
        const el = document.getElementById('score-display');
        if (el) {
            el.textContent = this.gameState.score;
            // افکت
            el.style.transform = 'scale(1.2)';
            setTimeout(() => el.style.transform = 'scale(1)', 200);
        }
    }
}
// js/modules/AudioManager.js - نسخه بهبود یافته
export class AudioManager {
    constructor() {
        this.audioCache = new Map();
        this.isOnline = navigator.onLine;
        this.userInteracted = false;
        this.initInteractivity();
        this.initCache();
    }

    initInteractivity() {
        // علامت‌گذاری تعامل کاربر
        const events = ['click', 'touchstart', 'keydown'];
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.userInteracted = true;
            }, { once: true }); // فقط یک بار کافی است
        });
    }

    initCache() {
        try {
            const cached = localStorage.getItem('english7_audio_cache');
            if (cached) {
                const cacheData = JSON.parse(cached);
                cacheData.forEach(item => {
                    this.audioCache.set(item.key, item.data);
                });
                console.log(`🎵 ${cacheData.length} صدا از کش بازیابی شد`);
            }
        } catch (e) {
            console.warn('⚠️ خطا در بازیابی کش صوتی');
        }
    }

    async playWord(word, accent = 'us') {
        const cacheKey = `${word}_${accent}`;
        
        // 1. بررسی کش حافظه
        if (this.audioCache.has(cacheKey)) {
            this.playFromCache(cacheKey);
            return;
        }

        // 2. بررسی کش localStorage
        const localCached = await this.getFromStorage(cacheKey);
        if (localCached) {
            this.playAudioBlob(localCached, word);
            return;
        }

        // 3. اگر آنلاین هستیم و کاربر تعامل داشته
        if (this.isOnline && this.userInteracted) {
            await this.fetchAndCache(word, accent, cacheKey);
        } else {
            // 4. استفاده از TTS داخلی
            this.playTTS(word, accent);
        }
    }

    async fetchAndCache(word, accent, cacheKey) {
        try {
            // استفاده از سرویس رایگان (مثال)
            const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
            const response = await fetch(apiUrl);
            
            if (response.ok) {
                const data = await response.json();
                const phonetic = data[0]?.phonetic || word;
                
                // استفاده از Web Speech API برای تولید صدا
                this.playAndCacheTTS(word, accent, cacheKey);
            } else {
                this.playTTS(word, accent);
            }
        } catch (error) {
            console.warn('📡 خطا در دریافت از API، استفاده از TTS:', error);
            this.playTTS(word, accent);
        }
    }

    playTTS(word, accent = 'us') {
        if (!('speechSynthesis' in window)) {
            console.error('❌ TTS پشتیبانی نمی‌شود');
            return;
        }

        // توقف صداهای قبلی
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = accent === 'uk' ? 'en-GB' : 'en-US';
        utterance.rate = 0.9;
        utterance.volume = 0.8;
        utterance.pitch = 1.0;

        // انتخاب بهترین voice
        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
            v.lang.startsWith(utterance.lang) && 
            v.name.includes('Google') || v.name.includes('Microsoft')
        );
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => console.log(`▶️ پخش: ${word}`);
        utterance.onerror = (e) => console.warn(`⚠️ خطای TTS: ${e.error}`);
        
        speechSynthesis.speak(utterance);
    }

    async playAndCacheTTS(word, accent, cacheKey) {
        // تولید صدا با TTS و ذخیره (ساده‌شده)
        this.playTTS(word, accent);
        
        // علامت‌گذاری که صدا موجود است (برای دفعات بعد)
        this.audioCache.set(cacheKey, 'tts_available');
        this.saveCacheToStorage();
    }

    playFromCache(cacheKey) {
        const cached = this.audioCache.get(cacheKey);
        
        if (cached === 'tts_available') {
            const [word, accent] = cacheKey.split('_');
            this.playTTS(word, accent);
        } else if (cached && cached.startsWith('data:audio')) {
            this.playAudioBlob(cached, cacheKey);
        }
    }

    playAudioBlob(dataUrl, cacheKey) {
        if (!this.userInteracted) {
            console.log('⏳ منتظر تعامل کاربر...');
            return;
        }

        const audio = new Audio(dataUrl);
        audio.volume = 0.8;
        
        audio.oncanplay = () => {
            audio.play().catch(e => {
                if (e.name !== 'NotAllowedError') {
                    console.warn('⚠️ خطای پخش:', e);
                }
            });
        };
        
        audio.onerror = () => {
            console.warn(`❌ خطا در پخش صدا از کش: ${cacheKey}`);
            this.audioCache.delete(cacheKey);
        };
    }

    async getFromStorage(cacheKey) {
        try {
            const item = localStorage.getItem(`audio_${cacheKey}`);
            return item || null;
        } catch (e) {
            console.warn('⚠️ خطا در خواندن از حافظه');
            return null;
        }
    }

    saveToStorage(cacheKey, data) {
        try {
            localStorage.setItem(`audio_${cacheKey}`, data);
            return true;
        } catch (e) {
            console.warn('⚠️ حافظه پر است، کش قدیمی‌تر پاک می‌شود');
            this.cleanOldCache();
            return false;
        }
    }

    saveCacheToStorage() {
        const cacheArray = Array.from(this.audioCache.entries()).map(([key, data]) => ({
            key,
            data
        }));
        
        try {
            localStorage.setItem('english7_audio_cache', JSON.stringify(cacheArray));
        } catch (e) {
            console.warn('⚠️ خطا در ذخیره کش کلی');
        }
    }

    cleanOldCache() {
        // پاک کردن کش‌های قدیمی‌تر
        const keys = Object.keys(localStorage);
        const audioKeys = keys.filter(k => k.startsWith('audio_'));
        
        if (audioKeys.length > 50) { // اگر بیش از 50 فایل صوتی داریم
            for (let i = 0; i < 10; i++) { // 10 تای قدیمی را پاک کن
                localStorage.removeItem(audioKeys[i]);
            }
        }
    }

    preloadLessonAudio(lessonId) {
        // فقط اگر کاربر تعامل داشته
        if (!this.userInteracted) {
            console.log('⏳ پیش‌بارگذاری صدا بعد از تعامل کاربر');
            return;
        }

        console.log('🔄 پیش‌بارگذاری صداهای درس...');
        const words = ['manager', 'teacher', 'doctor', 'student'];
        
        // با تاخیر و یکی یکی
        words.forEach((word, index) => {
            setTimeout(() => {
                if (this.userInteracted) {
                    this.playWord(word, 'us');
                }
            }, index * 1000); // هر 1 ثانیه یک کلمه
        });
    }

    clearCache() {
        this.audioCache.clear();
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('audio_') || key === 'english7_audio_cache') {
                localStorage.removeItem(key);
            }
        });
        console.log('🗑️ کش صوتی پاک شد');
    }

    getCacheStats() {
        const total = this.audioCache.size;
        const localKeys = Object.keys(localStorage).filter(k => k.startsWith('audio_')).length;
        return {
            memoryCache: total,
            localStorage: localKeys,
            userInteracted: this.userInteracted,
            isOnline: this.isOnline
        };
    }
}
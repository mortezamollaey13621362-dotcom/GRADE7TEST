// js/modules/QuizHistoryManager.js - نسخه کامل

export class QuizHistoryManager {
    constructor(userId = 'default') {
        this.userId = userId;
        this.studentKey = `english7_quiz_history_${userId}`;
        this.teacherKey = `english7_teacher_history_${userId}`;
        this.studentGeneratedExamsKey = `english7_student_generated_exams_${userId}`;
        this.maxStudentHistory = 20; // افزایش ظرفیت
        this.maxTeacherHistory = 30;
        this.maxGeneratedExams = 50; // حداکثر آزمون‌های تولید شده
    }
    
    // ===== دانش‌آموز =====
    saveQuiz(quizData) {
        const history = this.getHistory();
        const existingIndex = history.findIndex(h => h.id === quizData.id);
        
        if (existingIndex >= 0) {
            history[existingIndex] = quizData;
        } else {
            history.unshift(quizData);
            if (history.length > this.maxStudentHistory) {
                history.pop();
            }
        }
        
        localStorage.setItem(this.studentKey, JSON.stringify(history));
        return quizData.id;
    }
    
    getHistory(filters = {}) {
        const data = localStorage.getItem(this.studentKey);
        let history = data ? JSON.parse(data) : [];
        
        // اعمال فیلترها
        if (filters.mode) {
            history = history.filter(h => h.mode === filters.mode);
        }
        
        if (filters.completed !== undefined) {
            history = history.filter(h => h.isCompleted === filters.completed);
        }
        
        if (filters.date) {
            const targetDate = new Date(filters.date).toDateString();
            history = history.filter(h => {
                const quizDate = new Date(h.completedAt || h.timestamp).toDateString();
                return quizDate === targetDate;
            });
        }
        
        return history;
    }
    
    getIncompleteQuiz() {
        const history = this.getHistory();
        return history.find(h => !h.isCompleted);
    }
    
    deleteQuiz(quizId) {
        let history = this.getHistory();
        history = history.filter(h => h.id !== quizId);
        localStorage.setItem(this.studentKey, JSON.stringify(history));
        return true;
    }
    
    getQuizStats() {
        const history = this.getHistory();
        const completed = history.filter(h => h.isCompleted);
        const incomplete = history.filter(h => !h.isCompleted);
        
        const totalScore = completed.reduce((sum, quiz) => sum + quiz.score, 0);
        const totalQuestions = completed.reduce((sum, quiz) => sum + quiz.totalQuestions, 0);
        
        return {
            totalQuizzes: history.length,
            completed: completed.length,
            incomplete: incomplete.length,
            averageScore: completed.length > 0 ? (totalScore / totalQuestions * 100).toFixed(1) : 0,
            totalQuestionsAnswered: totalQuestions
        };
    }
    
    // ===== آزمون‌های تولید شده دانش‌آموز =====
    saveStudentGeneratedExam(examData) {
        try {
            const exams = this.getStudentGeneratedExams();
            
            // بررسی تکراری نبودن
            const existingIndex = exams.findIndex(e => e.id === examData.id);
            if (existingIndex >= 0) {
                exams[existingIndex] = examData;
            } else {
                exams.unshift(examData);
                
                // محدود کردن تعداد
                if (exams.length > this.maxGeneratedExams) {
                    exams.pop();
                }
            }
            
            localStorage.setItem(this.studentGeneratedExamsKey, JSON.stringify(exams));
            console.log('✅ آزمون تولید شده ذخیره شد:', examData.id);
            return true;
        } catch (error) {
            console.error('❌ خطا در ذخیره آزمون تولید شده:', error);
            return false;
        }
    }
    
    getStudentGeneratedExams(filters = {}) {
        try {
            const data = localStorage.getItem(this.studentGeneratedExamsKey);
            let exams = data ? JSON.parse(data) : [];
            
            // اعمال فیلترها
            if (filters.mode) {
                exams = exams.filter(e => e.mode === filters.mode);
            }
            
            if (filters.category) {
                exams = exams.filter(e => 
                    e.config && 
                    e.config.categories && 
                    e.config.categories.includes(filters.category)
                );
            }
            
            // مرتب‌سازی بر اساس تاریخ (جدیدترین اول)
            exams.sort((a, b) => {
                return new Date(b.generatedAt || b.timestamp) - new Date(a.generatedAt || a.timestamp);
            });
            
            return exams;
        } catch (error) {
            console.error('❌ خطا در دریافت آزمون‌های تولید شده:', error);
            return [];
        }
    }
    
    getGeneratedExamById(examId) {
        const exams = this.getStudentGeneratedExams();
        return exams.find(exam => exam.id === examId);
    }
    
    deleteStudentGeneratedExam(examId) {
        try {
            let exams = this.getStudentGeneratedExams();
            exams = exams.filter(exam => exam.id !== examId);
            localStorage.setItem(this.studentGeneratedExamsKey, JSON.stringify(exams));
            console.log('✅ آزمون تولید شده حذف شد:', examId);
            return true;
        } catch (error) {
            console.error('❌ خطا در حذف آزمون تولید شده:', error);
            return false;
        }
    }
    
    getGeneratedExamsStats() {
        const exams = this.getStudentGeneratedExams();
        const byMode = {};
        const byCategory = {};
        
        exams.forEach(exam => {
            // آمار بر اساس نوع
            byMode[exam.mode] = (byMode[exam.mode] || 0) + 1;
            
            // آمار بر اساس دسته‌بندی
            if (exam.config && exam.config.categories) {
                exam.config.categories.forEach(cat => {
                    byCategory[cat] = (byCategory[cat] || 0) + 1;
                });
            } else {
                byCategory['همه موضوعات'] = (byCategory['همه موضوعات'] || 0) + 1;
            }
        });
        
        return {
            totalExams: exams.length,
            byMode: byMode,
            byCategory: byCategory,
            totalQuestions: exams.reduce((sum, exam) => sum + exam.questionCount, 0),
            lastGenerated: exams.length > 0 ? exams[0].timestamp : 'هیچ'
        };
    }
    
    // ===== معلم =====
    saveTeacherExam(examData) {
        const history = this.getTeacherHistory();
        
        // بررسی تکراری نبودن
        const existingIndex = history.findIndex(e => e.id === examData.id);
        if (existingIndex >= 0) {
            history[existingIndex] = examData;
        } else {
            history.unshift(examData);
            
            if (history.length > this.maxTeacherHistory) {
                history.pop();
            }
        }
        
        localStorage.setItem(this.teacherKey, JSON.stringify(history));
        console.log('✅ آزمون دبیر ذخیره شد:', examData.id);
        return examData.id;
    }
    
    getTeacherHistory(filters = {}) {
        const data = localStorage.getItem(this.teacherKey);
        let history = data ? JSON.parse(data) : [];
        
        // اعمال فیلترها
        if (filters.mode) {
            history = history.filter(h => h.mode === filters.mode);
        }
        
        if (filters.category) {
            history = history.filter(h => 
                h.config && 
                h.config.categories && 
                h.config.categories.includes(filters.category)
            );
        }
        
        if (filters.dateRange) {
            const startDate = new Date(filters.dateRange.start);
            const endDate = new Date(filters.dateRange.end);
            
            history = history.filter(h => {
                const examDate = new Date(h.timestamp || h.generatedAt);
                return examDate >= startDate && examDate <= endDate;
            });
        }
        
        // مرتب‌سازی بر اساس تاریخ (جدیدترین اول)
        history.sort((a, b) => {
            return new Date(b.timestamp || b.generatedAt) - new Date(a.timestamp || a.generatedAt);
        });
        
        return history;
    }
    
    deleteTeacherExam(examId) {
        let history = this.getTeacherHistory();
        history = history.filter(h => h.id !== examId);
        localStorage.setItem(this.teacherKey, JSON.stringify(history));
        return true;
    }
    
    getTeacherStats() {
        const history = this.getTeacherHistory();
        const byMode = {};
        const byCategory = {};
        
        history.forEach(exam => {
            // آمار بر اساس نوع
            byMode[exam.mode] = (byMode[exam.mode] || 0) + 1;
            
            // آمار بر اساس دسته‌بندی
            if (exam.config && exam.config.categories) {
                exam.config.categories.forEach(cat => {
                    byCategory[cat] = (byCategory[cat] || 0) + 1;
                });
            } else {
                byCategory['همه موضوعات'] = (byCategory['همه موضوعات'] || 0) + 1;
            }
        });
        
        return {
            totalExams: history.length,
            byMode: byMode,
            byCategory: byCategory,
            totalQuestions: history.reduce((sum, exam) => sum + exam.questionCount, 0),
            lastGenerated: history.length > 0 ? history[0].timestamp : 'هیچ'
        };
    }
    
    // ===== یوتیلیتی =====
    generateQuizId() {
        return `quiz_${this.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    generateExamId() {
        return `exam_${this.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    generateUniqueExamId() {
        // ID منحصر به فرد برای آزمون‌های تولید شده
        return `generated_exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    getCurrentTimestamp() {
        const now = new Date();
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        
        const datePart = now.toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        
        const timePart = now.toLocaleTimeString('fa-IR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        return `${datePart} - ${timePart}`;
    }
    
    getSimpleTimestamp() {
        const now = new Date();
        return now.toLocaleDateString('fa-IR');
    }
    
    // پاک‌سازی تاریخچه قدیمی (بیش از 30 روز)
    cleanupOldRecords() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // تاریخچه آزمون‌های آنلاین دانش‌آموز
        let studentHistory = this.getHistory();
        studentHistory = studentHistory.filter(quiz => {
            const quizDate = new Date(quiz.completedAt || quiz.timestamp);
            return quizDate > thirtyDaysAgo;
        });
        localStorage.setItem(this.studentKey, JSON.stringify(studentHistory));
        
        // تاریخچه آزمون‌های تولید شده دانش‌آموز
        let generatedExams = this.getStudentGeneratedExams();
        generatedExams = generatedExams.filter(exam => {
            const examDate = new Date(exam.generatedAt || exam.timestamp);
            return examDate > thirtyDaysAgo;
        });
        localStorage.setItem(this.studentGeneratedExamsKey, JSON.stringify(generatedExams));
        
        // تاریخچه دبیر
        let teacherHistory = this.getTeacherHistory();
        teacherHistory = teacherHistory.filter(exam => {
            const examDate = new Date(exam.timestamp || exam.generatedAt);
            return examDate > thirtyDaysAgo;
        });
        localStorage.setItem(this.teacherKey, JSON.stringify(teacherHistory));
        
        return {
            studentRemoved: studentHistory.length,
            generatedRemoved: generatedExams.length,
            teacherRemoved: teacherHistory.length
        };
    }
    
    // پاک‌سازی کامل تاریخچه (برای تست)
    clearAllHistory() {
        localStorage.removeItem(this.studentKey);
        localStorage.removeItem(this.studentGeneratedExamsKey);
        localStorage.removeItem(this.teacherKey);
        console.log('🧹 تمام تاریخچه‌ها پاک شدند');
        return true;
    }
    
    // تهیه پشتیبان از تاریخچه
    exportHistory() {
        const data = {
            studentHistory: this.getHistory(),
            studentGeneratedExams: this.getStudentGeneratedExams(),
            teacherHistory: this.getTeacherHistory(),
            exportDate: new Date().toISOString(),
            userId: this.userId
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quiz_history_backup_${this.userId}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return true;
    }
    
    // بازیابی از پشتیبان
    importHistory(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.studentHistory) {
                localStorage.setItem(this.studentKey, JSON.stringify(data.studentHistory));
            }
            
            if (data.studentGeneratedExams) {
                localStorage.setItem(this.studentGeneratedExamsKey, JSON.stringify(data.studentGeneratedExams));
            }
            
            if (data.teacherHistory) {
                localStorage.setItem(this.teacherKey, JSON.stringify(data.teacherHistory));
            }
            
            console.log('✅ تاریخچه با موفقیت بازیابی شد');
            return true;
        } catch (error) {
            console.error('❌ خطا در بازیابی تاریخچه:', error);
            return false;
        }
    }
    
    // گرفتن حجم ذخیره‌سازی
    getStorageSize() {
        const studentHistory = localStorage.getItem(this.studentKey) || '';
        const generatedExams = localStorage.getItem(this.studentGeneratedExamsKey) || '';
        const teacherHistory = localStorage.getItem(this.teacherKey) || '';
        
        const totalSize = (
            new Blob([studentHistory]).size +
            new Blob([generatedExams]).size +
            new Blob([teacherHistory]).size
        ) / 1024; // به کیلوبایت
        
        return {
            studentHistoryKB: (new Blob([studentHistory]).size / 1024).toFixed(2),
            generatedExamsKB: (new Blob([generatedExams]).size / 1024).toFixed(2),
            teacherHistoryKB: (new Blob([teacherHistory]).size / 1024).toFixed(2),
            totalKB: totalSize.toFixed(2)
        };
    }
}
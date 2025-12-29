// data-parser.js
class TelegramDataParser {
    constructor() {
        this.telegramData = null;
    }

    async loadJSON(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Не удалось загрузить файл: ${response.status}`);
            }
            
            this.telegramData = await response.json();
            console.log('Данные успешно загружены');
            return this.telegramData;
            
        } catch (error) {
            console.error('Ошибка загрузки JSON:', error);
            return null;
        }
    }

    getTotalMessages() {
        if (!this.telegramData || !this.telegramData.messages) {
            return 0;
        }
        return this.telegramData.messages.length;
    }

    getMessagesByUser(userName) {
        if (!this.telegramData || !this.telegramData.messages) {
            return [];
        }
        return this.telegramData.messages.filter(msg => msg.from === userName);
    }

    getMessageCountByUser(userName) {
        return this.getMessagesByUser(userName).length;
    }

    getMostFrequentWords(limit = 10) {
        if (!this.telegramData || !this.telegramData.messages) {
            return [];
        }

        const wordMap = {};
        const stopWords = new Set(['и', 'в', 'не', 'на', 'я', 'ты', 'мы', 'вы', 'он', 'она', 'оно', 'они', 'как', 'что', 'это', 'так', 'для', 'но', 'а', 'или', 'же', 'бы', 'то', 'вот', 'по', 'у', 'же', 'да', 'нет', 'из', 'от', 'к', 'до', 'за', 'со', 'во', 'об', 'при', 'над', 'под', 'перед', 'через', 'между', 'когда', 'где', 'куда', 'откуда', 'почему', 'зачем', 'какой', 'чей', 'сколько', 'очень', 'можно', 'нужно', 'хочу', 'могу', 'должен', 'есть', 'быть', 'стать', 'делать', 'сказать', 'хорошо', 'плохо', 'большой', 'маленький', 'новый', 'старый', 'другой', 'свой', 'наш', 'ваш', 'их', 'его', 'её', 'их', 'мой', 'твой', 'свои', 'своей', 'своих', 'нам', 'вам', 'им', 'него', 'неё', 'них', 'мне', 'тебе', 'ему', 'ей', 'нам', 'вам', 'им', 'мной', 'тобой', 'ним', 'ней', 'нами', 'вами', 'ними']);

        this.telegramData.messages.forEach(message => {
            if (message.text && typeof message.text === 'string') {
                const words = message.text
                    .toLowerCase()
                    .replace(/[^\w\s\u0400-\u04FF]/g, ' ')
                    .split(/\s+/)
                    .filter(word => word.length > 2 && !stopWords.has(word));

                words.forEach(word => {
                    wordMap[word] = (wordMap[word] || 0) + 1;
                });
            }
        });

        return Object.entries(wordMap)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([word, count]) => ({ word, count }));
    }

    getMessageStats() {
        if (!this.telegramData || !this.telegramData.messages) {
            return {
                total: 0,
                myMessages: 0,
                partnerMessages: 0,
                otherMessages: 0,
                balance: '0/0'
            };
        }

        const total = this.getTotalMessages();
        
        // Находим имена пользователей из данных
        const users = {};
        this.telegramData.messages.forEach(msg => {
            if (msg.from) {
                users[msg.from] = (users[msg.from] || 0) + 1;
            }
        });

        const userNames = Object.keys(users);
        const myName = 'Михаил Страховский'; // или определить автоматически
        const partnerName = userNames.find(name => name !== myName) || 'Партнер';

        const myMessages = this.getMessageCountByUser(myName);
        const partnerMessages = this.getMessageCountByUser(partnerName);
        const otherMessages = total - myMessages - partnerMessages;

        const balance = `${Math.round((myMessages / total) * 100)}/${Math.round((partnerMessages / total) * 100)}`;

        return {
            total,
            myMessages,
            partnerMessages,
            otherMessages,
            balance,
            myName,
            partnerName,
            averagePerDay: Math.round(total / 365)
        };
    }

    getMessagesByMonth() {
        if (!this.telegramData || !this.telegramData.messages) {
            return {};
        }

        const months = {};
        
        this.telegramData.messages.forEach(message => {
            if (message.date) {
                const date = new Date(message.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const monthName = date.toLocaleString('ru-RU', { month: 'long' });
                
                if (!months[monthKey]) {
                    months[monthKey] = {
                        name: monthName,
                        count: 0,
                        year: date.getFullYear(),
                        month: date.getMonth() + 1
                    };
                }
                months[monthKey].count++;
            }
        });

        return months;
    }

    getMostActiveMonth() {
        const months = this.getMessagesByMonth();
        if (Object.keys(months).length === 0) return null;

        let maxCount = 0;
        let mostActiveMonth = null;

        Object.values(months).forEach(month => {
            if (month.count > maxCount) {
                maxCount = month.count;
                mostActiveMonth = month;
            }
        });

        return mostActiveMonth;
    }
}

// Экспортируем класс для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TelegramDataParser;
}
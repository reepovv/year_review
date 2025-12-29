// parse-chat.js - запускается в терминале: node parse-chat.js
const fs = require('fs');
const path = require('path');

class TelegramDataParser {
    constructor(data) {
        this.telegramData = data;
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
        const stopWords = new Set(['и', 'в', 'не', 'на', 'я', 'ты', 'мы', 'вы', 'он', 'она', 'оно', 'они', 'как', 'что', 'это', 'так', 'для', 'но', 'а', 'или', 'же', 'бы', 'то', 'вот', 'по', 'у', 'же', 'да', 'нет', 'из', 'от', 'к', 'до', 'за', 'со', 'во', 'об', 'при', 'над', 'под', 'чей', 'наш', 'ваш', 'их', 'его', 'её', 'их', 'мой', 'твой', 'свои', 'своей', 'своих', 'нам', 'вам', 'им', 'него', 'неё', 'них', 'тебе', 'ему', 'ей', 'нам', 'вам', 'им', 'мной', 'тобой', 'ним', 'ней', 'нами', 'вами', 'ними']);

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
        const myName = 'Михаил Страховский';
        const partnerName = userNames.find(name => name !== myName) || 'Партнер';

        const myMessages = this.getMessageCountByUser(myName);
        const partnerMessages = this.getMessageCountByUser(partnerName);
        const otherMessages = total - myMessages - partnerMessages;

        const myPercent = total > 0 ? Math.round((myMessages / total) * 100) : 0;
        const partnerPercent = total > 0 ? Math.round((partnerMessages / total) * 100) : 0;

        return {
            total,
            myMessages,
            partnerMessages,
            otherMessages,
            balance: `${myPercent}/${partnerPercent}`,
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
                        name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
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

    getAllStats() {
        const stats = this.getMessageStats();
        const mostActiveMonth = this.getMostActiveMonth();
        const frequentWords = this.getMostFrequentWords(10);
        
        const formatNumber = (num) => num.toLocaleString('ru-RU');
        
        return {
            year: new Date().getFullYear(),
            partnerName: stats.partnerName,
            stats: {
                total: formatNumber(stats.total),
                myMessages: formatNumber(stats.myMessages),
                partnerMessages: formatNumber(stats.partnerMessages),
                balance: stats.balance,
                averagePerDay: formatNumber(stats.averagePerDay)
            },
            mostActiveMonth: mostActiveMonth ? {
                name: mostActiveMonth.name,
                count: formatNumber(mostActiveMonth.count)
            } : null,
            frequentWords: frequentWords.map(item => ({
                word: item.word,
                count: formatNumber(item.count)
            }))
        };
    }
}

// Основная функция
function main() {
    try {
        // Читаем файл result.json
        const dataPath = path.join(__dirname, 'result.json');
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const telegramData = JSON.parse(rawData);
        
        // Парсим данные
        const parser = new TelegramDataParser(telegramData);
        const allStats = parser.getAllStats();
        
        // Выводим статистику в консоль
        console.log('='.repeat(50));
        console.log('📊 СТАТИСТИКА ЧАТА');
        console.log('='.repeat(50));
        console.log(`Год: ${allStats.year}`);
        console.log(`Имя партнера: ${allStats.partnerName}`);
        console.log('');
        console.log('📈 Основная статистика:');
        console.log(`Всего сообщений: ${allStats.stats.total}`);
        console.log(`Мои сообщения: ${allStats.stats.myMessages}`);
        console.log(`Сообщения ${allStats.partnerName}: ${allStats.stats.partnerMessages}`);
        console.log(`Баланс: ${allStats.stats.balance}`);
        console.log(`В среднем за день: ${allStats.stats.averagePerDay}`);
        console.log('');
        
        if (allStats.mostActiveMonth) {
            console.log('🔥 Самый активный месяц:');
            console.log(`${allStats.mostActiveMonth.name} (${allStats.mostActiveMonth.count} сообщений)`);
            console.log('');
        }
        
        if (allStats.frequentWords.length > 0) {
            console.log('🗣️ Частые слова:');
            allStats.frequentWords.forEach(item => {
                console.log(`  "${item.word}" - ${item.count} раз`);
            });
        }
        
        console.log('');
        console.log('='.repeat(50));
        console.log('✅ Код для вставки в HTML:');
        console.log('='.repeat(50));
        
        
        // Также сохраняем статистику в отдельный файл
        const outputPath = path.join(__dirname, 'stats.json');
        fs.writeFileSync(outputPath, JSON.stringify(allStats, null, 2));
        console.log('');
        console.log(`📁 Статистика также сохранена в файл: ${outputPath}`);
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        console.error('Убедитесь, что:');
        console.error('1. Файл result.json находится в той же папке');
        console.error('2. Файл содержит корректный JSON из Telegram');
        process.exit(1);
    }
}

// Запускаем парсинг
if (require.main === module) {
    main();
}

module.exports = TelegramDataParser;
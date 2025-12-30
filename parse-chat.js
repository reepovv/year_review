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

    // Функции для видеосообщений (кружочков)
    getVideoMessages() {
        if (!this.telegramData || !this.telegramData.messages) {
            return [];
        }
        return this.telegramData.messages.filter(msg => 
            msg.media_type === 'video_message' || 
            msg.mime_type === 'video/mp4' ||
            (msg.file && msg.file.includes('round_video_messages'))
        );
    }

    getTotalVideoMessages() {
        return this.getVideoMessages().length;
    }

    getVideoMessagesByUser(userName) {
        const videoMessages = this.getVideoMessages();
        return videoMessages.filter(msg => msg.from === userName);
    }

    getVideoMessageCountByUser(userName) {
        return this.getVideoMessagesByUser(userName).length;
    }

    getTotalVideoDurationByUser(userName) {
        const videoMessages = this.getVideoMessagesByUser(userName);
        let totalDuration = 0;
        
        videoMessages.forEach(msg => {
            if (msg.duration_seconds && typeof msg.duration_seconds === 'number') {
                totalDuration += msg.duration_seconds;
            }
        });
        
        return totalDuration;
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours} ч ${minutes} мин ${secs} сек`;
        } else if (minutes > 0) {
            return `${minutes} мин ${secs} сек`;
        } else {
            return `${secs} сек`;
        }
    }

    getVideoMessageStats() {
        const myName = 'Михаил Страховский';
        const users = {};
        
        // Находим имена пользователей
        this.telegramData.messages.forEach(msg => {
            if (msg.from) {
                users[msg.from] = true;
            }
        });

        const userNames = Object.keys(users);
        const partnerName = userNames.find(name => name !== myName) || 'Партнер';

        const totalVideoMessages = this.getTotalVideoMessages();
        const myVideoMessages = this.getVideoMessageCountByUser(myName);
        const partnerVideoMessages = this.getVideoMessageCountByUser(partnerName);
        
        const myVideoDuration = this.getTotalVideoDurationByUser(myName);
        const partnerVideoDuration = this.getTotalVideoDurationByUser(partnerName);
        const totalVideoDuration = myVideoDuration + partnerVideoDuration;

        return {
            total: totalVideoMessages,
            myVideoMessages: myVideoMessages,
            partnerVideoMessages: partnerVideoMessages,
            myVideoDuration: myVideoDuration,
            partnerVideoDuration: partnerVideoDuration,
            totalVideoDuration: totalVideoDuration,
            myVideoDurationFormatted: this.formatDuration(myVideoDuration),
            partnerVideoDurationFormatted: this.formatDuration(partnerVideoDuration),
            totalVideoDurationFormatted: this.formatDuration(totalVideoDuration),
            partnerName: partnerName,
            myName: myName
        };
    }

    getFirstVideoMessage() {
        const videoMessages = this.getVideoMessages();
        
        if (videoMessages.length === 0) {
            return null;
        }
        
        // Сортируем по дате (самый ранний первый)
        const sortedMessages = videoMessages.sort((a, b) => {
            const timeA = a.date_unixtime ? parseInt(a.date_unixtime) : 0;
            const timeB = b.date_unixtime ? parseInt(b.date_unixtime) : 0;
            return timeA - timeB;
        });
        
        return sortedMessages[0];
    }

    getFirstVideoMessageDetails() {
        const firstVideoMessage = this.getFirstVideoMessage();
        
        if (!firstVideoMessage) {
            return {
                exists: false,
                message: "Видеосообщений не найдено"
            };
        }
        
        return {
            exists: true,
            file: firstVideoMessage.file || "Не указан",
            date: firstVideoMessage.date || "Не указана",
            from: firstVideoMessage.from || "Не указан",
            duration_seconds: firstVideoMessage.duration_seconds || 0,
            duration_formatted: this.formatDuration(firstVideoMessage.duration_seconds || 0),
            width: firstVideoMessage.width || "Не указано",
            height: firstVideoMessage.height || "Не указано",
            file_size: firstVideoMessage.file_size || 0,
            file_size_formatted: this.formatFileSize(firstVideoMessage.file_size || 0)
        };
    }

    formatFileSize(bytes) {
        if (bytes === 0) return "0 Б";
        
        const k = 1024;
        const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getMostFrequentVideoMessagesByUser(userName, limit = 5) {
        const videoMessages = this.getVideoMessagesByUser(userName);
        
        // Группируем по продолжительности (близкие значения считаем одинаковыми)
        const durationMap = {};
        const durationRanges = [
            { min: 0, max: 5, label: "0-5 сек" },
            { min: 6, max: 15, label: "6-15 сек" },
            { min: 16, max: 30, label: "16-30 сек" },
            { min: 31, max: 60, label: "31-60 сек" },
            { min: 61, max: Infinity, label: "более 60 сек" }
        ];
        
        videoMessages.forEach(msg => {
            const duration = msg.duration_seconds || 0;
            let rangeLabel = "другое";
            
            for (const range of durationRanges) {
                if (duration >= range.min && duration <= range.max) {
                    rangeLabel = range.label;
                    break;
                }
            }
            
            durationMap[rangeLabel] = (durationMap[rangeLabel] || 0) + 1;
        });

        return Object.entries(durationMap)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([durationRange, count]) => ({ 
                durationRange: durationRange,
                count: count 
            }));
    }

    getAllVideoStats() {
        const videoStats = this.getVideoMessageStats();
        const myName = 'Михаил Страховский';
        const partnerName = videoStats.partnerName;
        
        const myVideoPatterns = this.getMostFrequentVideoMessagesByUser(myName, 3);
        const partnerVideoPatterns = this.getMostFrequentVideoMessagesByUser(partnerName, 3);
        const firstVideoDetails = this.getFirstVideoMessageDetails();

        return {
            total: videoStats.total,
            myVideoMessages: videoStats.myVideoMessages,
            partnerVideoMessages: videoStats.partnerVideoMessages,
            myVideoDuration: videoStats.myVideoDuration,
            partnerVideoDuration: videoStats.partnerVideoDuration,
            totalVideoDuration: videoStats.totalVideoDuration,
            myVideoDurationFormatted: videoStats.myVideoDurationFormatted,
            partnerVideoDurationFormatted: videoStats.partnerVideoDurationFormatted,
            totalVideoDurationFormatted: videoStats.totalVideoDurationFormatted,
            myVideoPatterns: myVideoPatterns,
            partnerVideoPatterns: partnerVideoPatterns,
            firstVideoMessage: firstVideoDetails,
            partnerName: partnerName,
            myName: myName
        };
    }

    // Функции для стикеров
    getStickers() {
        if (!this.telegramData || !this.telegramData.messages) {
            return [];
        }
        return this.telegramData.messages.filter(msg => 
            msg.media_type === 'sticker' || 
            (msg.text_entities && msg.text_entities.some(e => e.type === 'sticker'))
        );
    }

    getTotalStickers() {
        return this.getStickers().length;
    }

    getStickersByUser(userName) {
        const stickers = this.getStickers();
        return stickers.filter(sticker => sticker.from === userName);
    }

    getStickerCountByUser(userName) {
        return this.getStickersByUser(userName).length;
    }

    getStickerStats() {
        const myName = 'Михаил Страховский';
        const users = {};
        
        // Находим имена пользователей
        this.telegramData.messages.forEach(msg => {
            if (msg.from) {
                users[msg.from] = true;
            }
        });

        const userNames = Object.keys(users);
        const partnerName = userNames.find(name => name !== myName) || 'Партнер';

        const totalStickers = this.getTotalStickers();
        const myStickers = this.getStickerCountByUser(myName);
        const partnerStickers = this.getStickerCountByUser(partnerName);

        return {
            total: totalStickers,
            myStickers: myStickers,
            partnerStickers: partnerStickers,
            partnerName: partnerName,
            myName: myName
        };
    }

    getMostFrequentStickersByUser(userName, limit = 5) {
        const stickers = this.getStickersByUser(userName);
        const stickerMap = {};
        
        stickers.forEach(sticker => {
            // Просто берем имя файла как есть
            const stickerId = sticker.file || 'unknown';
            stickerMap[stickerId] = (stickerMap[stickerId] || 0) + 1;
        });

        return Object.entries(stickerMap)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([sticker, count]) => ({ 
                sticker: sticker,
                count: count 
            }));
    }

    getMostFrequentStickers(limit = 10) {
        const stickers = this.getStickers();
        const stickerMap = {};
        
        stickers.forEach(sticker => {
            // Просто берем имя файла как есть
            const stickerId = sticker.file || 'unknown';
            stickerMap[stickerId] = (stickerMap[stickerId] || 0) + 1;
        });

        return Object.entries(stickerMap)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([sticker, count]) => ({ 
                sticker: sticker,
                count: count 
            }));
    }

    getAllStickerStats() {
        const stats = this.getStickerStats();
        const myName = 'Михаил Страховский';
        const partnerName = stats.partnerName;
        
        const myTopStickers = this.getMostFrequentStickersByUser(myName, 3);
        const partnerTopStickers = this.getMostFrequentStickersByUser(partnerName, 3);
        const topStickersOverall = this.getMostFrequentStickers(5);

        return {
            total: stats.total,
            myStickers: stats.myStickers,
            partnerStickers: stats.partnerStickers,
            myTopStickers: myTopStickers,
            partnerTopStickers: partnerTopStickers,
            topStickersOverall: topStickersOverall,
            partnerName: partnerName,
            myName: myName
        };
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

    getVoiceMessages() {
        if (!this.telegramData || !this.telegramData.messages) {
            return [];
        }
        return this.telegramData.messages.filter(msg => 
            msg.media_type === 'voice_message' ||
            (msg.mime_type && msg.mime_type.includes('audio/')) ||
            (msg.file && msg.file.includes('voice_messages'))
        );
    }

    getTotalVoiceMessages() {
        return this.getVoiceMessages().length;
    }

    getVoiceMessagesByUser(userName) {
        const voiceMessages = this.getVoiceMessages();
        return voiceMessages.filter(msg => msg.from === userName);
    }

    getVoiceMessageCountByUser(userName) {
        return this.getVoiceMessagesByUser(userName).length;
    }

    getTotalVoiceDurationByUser(userName) {
        const voiceMessages = this.getVoiceMessagesByUser(userName);
        let totalDuration = 0;
        
        voiceMessages.forEach(msg => {
            if (msg.duration_seconds && typeof msg.duration_seconds === 'number') {
                totalDuration += msg.duration_seconds;
            }
        });
        
        return totalDuration;
    }

    getVoiceMessageStats() {
        const myName = 'Михаил Страховский';
        const users = {};
        
        // Находим имена пользователей
        this.telegramData.messages.forEach(msg => {
            if (msg.from) {
                users[msg.from] = true;
            }
        });

        const userNames = Object.keys(users);
        const partnerName = userNames.find(name => name !== myName) || 'Партнер';

        const totalVoiceMessages = this.getTotalVoiceMessages();
        const myVoiceMessages = this.getVoiceMessageCountByUser(myName);
        const partnerVoiceMessages = this.getVoiceMessageCountByUser(partnerName);
        
        const myVoiceDuration = this.getTotalVoiceDurationByUser(myName);
        const partnerVoiceDuration = this.getTotalVoiceDurationByUser(partnerName);
        const totalVoiceDuration = myVoiceDuration + partnerVoiceDuration;

        return {
            total: totalVoiceMessages,
            myVoiceMessages: myVoiceMessages,
            partnerVoiceMessages: partnerVoiceMessages,
            myVoiceDuration: myVoiceDuration,
            partnerVoiceDuration: partnerVoiceDuration,
            totalVoiceDuration: totalVoiceDuration,
            myVoiceDurationFormatted: this.formatDuration(myVoiceDuration),
            partnerVoiceDurationFormatted: this.formatDuration(partnerVoiceDuration),
            totalVoiceDurationFormatted: this.formatDuration(totalVoiceDuration),
            partnerName: partnerName,
            myName: myName
        };
    }

    getFirstVoiceMessage() {
        const voiceMessages = this.getVoiceMessages();
        
        if (voiceMessages.length === 0) {
            return null;
        }
        
        // Сортируем по дате (самый ранний первый)
        const sortedMessages = voiceMessages.sort((a, b) => {
            const timeA = a.date_unixtime ? parseInt(a.date_unixtime) : 0;
            const timeB = b.date_unixtime ? parseInt(b.date_unixtime) : 0;
            return timeA - timeB;
        });
        
        return sortedMessages[0];
    }

    getFirstVoiceMessageDetails() {
        const firstVoiceMessage = this.getFirstVoiceMessage();
        
        if (!firstVoiceMessage) {
            return {
                exists: false,
                message: "Голосовых сообщений не найдено"
            };
        }
        
        return {
            exists: true,
            file: firstVoiceMessage.file || "Не указан",
            date: firstVoiceMessage.date || "Не указана",
            from: firstVoiceMessage.from || "Не указан",
            duration_seconds: firstVoiceMessage.duration_seconds || 0,
            duration_formatted: this.formatDuration(firstVoiceMessage.duration_seconds || 0),
            file_size: firstVoiceMessage.file_size || 0,
            file_size_formatted: this.formatFileSize(firstVoiceMessage.file_size || 0)
        };
    }

    getMostFrequentVoiceMessagesByUser(userName, limit = 5) {
        const voiceMessages = this.getVoiceMessagesByUser(userName);
        
        // Группируем по продолжительности (близкие значения считаем одинаковыми)
        const durationMap = {};
        const durationRanges = [
            { min: 0, max: 5, label: "0-5 сек" },
            { min: 6, max: 15, label: "6-15 сек" },
            { min: 16, max: 30, label: "16-30 сек" },
            { min: 31, max: 60, label: "31-60 сек" },
            { min: 61, max: 120, label: "1-2 мин" },
            { min: 121, max: 300, label: "2-5 мин" },
            { min: 301, max: Infinity, label: "более 5 мин" }
        ];
        
        voiceMessages.forEach(msg => {
            const duration = msg.duration_seconds || 0;
            let rangeLabel = "другое";
            
            for (const range of durationRanges) {
                if (duration >= range.min && duration <= range.max) {
                    rangeLabel = range.label;
                    break;
                }
            }
            
            durationMap[rangeLabel] = (durationMap[rangeLabel] || 0) + 1;
        });

        return Object.entries(durationMap)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([durationRange, count]) => ({ 
                durationRange: durationRange,
                count: count 
            }));
    }

    getAllVoiceStats() {
        const voiceStats = this.getVoiceMessageStats();
        const myName = 'Михаил Страховский';
        const partnerName = voiceStats.partnerName;
        
        const myVoicePatterns = this.getMostFrequentVoiceMessagesByUser(myName, 3);
        const partnerVoicePatterns = this.getMostFrequentVoiceMessagesByUser(partnerName, 3);
        const firstVoiceDetails = this.getFirstVoiceMessageDetails();

        return {
            total: voiceStats.total,
            myVoiceMessages: voiceStats.myVoiceMessages,
            partnerVoiceMessages: voiceStats.partnerVoiceMessages,
            myVoiceDuration: voiceStats.myVoiceDuration,
            partnerVoiceDuration: voiceStats.partnerVoiceDuration,
            totalVoiceDuration: voiceStats.totalVoiceDuration,
            myVoiceDurationFormatted: voiceStats.myVoiceDurationFormatted,
            partnerVoiceDurationFormatted: voiceStats.partnerVoiceDurationFormatted,
            totalVoiceDurationFormatted: voiceStats.totalVoiceDurationFormatted,
            myVoicePatterns: myVoicePatterns,
            partnerVoicePatterns: partnerVoicePatterns,
            firstVoiceMessage: firstVoiceDetails,
            partnerName: partnerName,
            myName: myName
        };
    }

    // Обновляем метод getAllStats для включения голосовых сообщений:
    getAllStats() {
        const stats = this.getMessageStats();
        const stickerStats = this.getAllStickerStats();
        const videoStats = this.getAllVideoStats();
        const voiceStats = this.getAllVoiceStats(); // Добавляем голосовые
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
            videoStats: {
                total: formatNumber(videoStats.total),
                myVideoMessages: formatNumber(videoStats.myVideoMessages),
                partnerVideoMessages: formatNumber(videoStats.partnerVideoMessages),
                myVideoDuration: videoStats.myVideoDurationFormatted,
                partnerVideoDuration: videoStats.partnerVideoDurationFormatted,
                totalVideoDuration: videoStats.totalVideoDurationFormatted,
                myVideoPatterns: videoStats.myVideoPatterns.map(p => ({
                    durationRange: p.durationRange,
                    count: formatNumber(p.count)
                })),
                partnerVideoPatterns: videoStats.partnerVideoPatterns.map(p => ({
                    durationRange: p.durationRange,
                    count: formatNumber(p.count)
                })),
                firstVideoMessage: videoStats.firstVideoMessage
            },
            voiceStats: {  // Добавляем секцию голосовых сообщений
                total: formatNumber(voiceStats.total),
                myVoiceMessages: formatNumber(voiceStats.myVoiceMessages),
                partnerVoiceMessages: formatNumber(voiceStats.partnerVoiceMessages),
                myVoiceDuration: voiceStats.myVoiceDurationFormatted,
                partnerVoiceDuration: voiceStats.partnerVoiceDurationFormatted,
                totalVoiceDuration: voiceStats.totalVoiceDurationFormatted,
                myVoicePatterns: voiceStats.myVoicePatterns.map(p => ({
                    durationRange: p.durationRange,
                    count: formatNumber(p.count)
                })),
                partnerVoicePatterns: voiceStats.partnerVoicePatterns.map(p => ({
                    durationRange: p.durationRange,
                    count: formatNumber(p.count)
                })),
                firstVoiceMessage: voiceStats.firstVoiceMessage
            },
            stickerStats: {
                total: formatNumber(stickerStats.total),
                myStickers: formatNumber(stickerStats.myStickers),
                partnerStickers: formatNumber(stickerStats.partnerStickers),
                myTopStickers: stickerStats.myTopStickers.map(s => ({
                    sticker: s.sticker,
                    count: formatNumber(s.count)
                })),
                partnerTopStickers: stickerStats.partnerTopStickers.map(s => ({
                    sticker: s.sticker,
                    count: formatNumber(s.count)
                })),
                topStickersOverall: stickerStats.topStickersOverall.map(s => ({
                    sticker: s.sticker,
                    count: formatNumber(s.count)
                }))
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
        console.log('='.repeat(60));
        console.log('📊 СТАТИСТИКА ЧАТА');
        console.log('='.repeat(60));
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
        
        console.log('🎥 Статистика видеосообщений:');
        console.log(`Всего видеосообщений: ${allStats.videoStats.total}`);
        console.log(`Мои видеосообщения: ${allStats.videoStats.myVideoMessages}`);
        console.log(`Видеосообщения ${allStats.partnerName}: ${allStats.videoStats.partnerVideoMessages}`);
        console.log(`Общая длительность моих видео: ${allStats.videoStats.myVideoDuration}`);
        console.log(`Общая длительность видео ${allStats.partnerName}: ${allStats.videoStats.partnerVideoDuration}`);
        console.log(`Общая длительность всех видео: ${allStats.videoStats.totalVideoDuration}`);
        console.log('');

        console.log('🎙️ Статистика голосовых сообщений:');
        console.log(`Всего голосовых: ${allStats.voiceStats.total}`);
        console.log(`Мои голосовые: ${allStats.voiceStats.myVoiceMessages}`);
        console.log(`Голосовые ${allStats.partnerName}: ${allStats.voiceStats.partnerVoiceMessages}`);
        console.log(`Общая длительность моих голосовых: ${allStats.voiceStats.myVoiceDuration}`);
        console.log(`Общая длительность голосовых ${allStats.partnerName}: ${allStats.voiceStats.partnerVoiceDuration}`);
        console.log(`Общая длительность всех голосовых: ${allStats.voiceStats.totalVoiceDuration}`);
        console.log('');
        
        // Выводим информацию о первом голосовом сообщении
        console.log('📅 Первое голосовое сообщение:');
        const firstVoice = allStats.voiceStats.firstVoiceMessage;
        if (firstVoice.exists) {
            console.log(`Файл: ${firstVoice.file}`);
            console.log(`Дата: ${firstVoice.date}`);
            console.log(`От: ${firstVoice.from}`);
            console.log(`Длительность: ${firstVoice.duration_formatted}`);
            console.log(`Размер: ${firstVoice.file_size_formatted}`);
        } else {
            console.log(firstVoice.message);
        }
        console.log('');
        
        // Выводим информацию о первом видеосообщении
        console.log('📅 Первое видеосообщение:');
        const firstVideo = allStats.videoStats.firstVideoMessage;
        if (firstVideo.exists) {
            console.log(`Файл: ${firstVideo.file}`);
            console.log(`Дата: ${firstVideo.date}`);
            console.log(`От: ${firstVideo.from}`);
            console.log(`Длительность: ${firstVideo.duration_formatted}`);
            console.log(`Размер: ${firstVideo.file_size_formatted}`);
        } else {
            console.log(firstVideo.message);
        }
        console.log('');
        
        console.log('🎨 Статистика стикеров:');
        console.log(`Всего стикеров: ${allStats.stickerStats.total}`);
        console.log(`Мои стикеры: ${allStats.stickerStats.myStickers}`);
        console.log(`Стикеры ${allStats.partnerName}: ${allStats.stickerStats.partnerStickers}`);
        console.log('');
        
        if (allStats.stickerStats.myTopStickers.length > 0) {
            console.log('🏆 Мои популярные стикеры:');
            allStats.stickerStats.myTopStickers.forEach(item => {
                console.log(`  ${item.sticker} - ${item.count} раз`);
            });
            console.log('');
        }
        
        if (allStats.stickerStats.partnerTopStickers.length > 0) {
            console.log(`🏆 Популярные стикеры ${allStats.partnerName}:`);
            allStats.stickerStats.partnerTopStickers.forEach(item => {
                console.log(`  ${item.sticker} - ${item.count} раз`);
            });
            console.log('');
        }
        
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
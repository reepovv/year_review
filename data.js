// Данные для Instagram-сторис
const storiesData = {
    year: 2024,
    partnerName: "Аня",
    
    // Массив сторис
    stories: [
        {
            type: "intro",
            emoji: "❤️",
            title: "Наш 2024 год",
            text: "Каждое сообщение — это история нашей любви. Давай вспомним самые важные моменты!",
            duration: 8,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        },
        {
            type: "stat",
            emoji: "💬",
            title: "Мы написали",
            value: "12,478",
            label: "сообщений друг другу",
            duration: 10,
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
        },
        {
            type: "stat",
            emoji: "📅",
            title: "Это примерно",
            value: "34",
            label: "сообщения каждый день",
            duration: 8,
            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
        },
        {
            type: "stat",
            emoji: "👫",
            title: "Распределение",
            value: "50/50",
            label: "Ты отправила 6,136 сообщений, я — 6,342",
            duration: 12,
            background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
        },
        {
            type: "stat",
            emoji: "🔥",
            title: "Самый активный",
            value: "Март",
            label: "Именно в марте мы общались больше всего",
            duration: 8,
            background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
        },
        {
            type: "words",
            emoji: "🗣️",
            title: "Самые частые слова",
            words: [
                { word: "любовь", count: 324 },
                { word: "скучаю", count: 287 },
                { word: "котик", count: 256 },
                { word: "обнимаю", count: 176 },
                { word: "красивая", count: 132 }
            ],
            duration: 12,
            background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
        },
        {
            type: "message",
            emoji: "💌",
            title: "Лучшее сообщение",
            author: "Аня",
            date: "12 мая",
            text: "Ты лучшее, что случилось со мной в этом году. Иногда перечитываю наши первые сообщения и улыбаюсь как дурочка 😊",
            duration: 15,
            background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
        },
        {
            type: "stat",
            emoji: "📸",
            title: "Мы обменялись",
            value: "876",
            label: "фотографиями и 245 голосовыми",
            duration: 10,
            background: "linear-gradient(135deg, #a9c9ff 0%, #ffbbec 100%)"
        },
        {
            type: "moment",
            emoji: "🌊",
            title: "15 июля",
            text: "Наша первая поездка на море. Помнишь, как мы до утра сидели на берегу и слушали шум волн?",
            image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            duration: 15,
            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
        },
        {
            type: "moment",
            emoji: "🐱",
            title: "3 октября",
            text: "День, когда мы решили завести котика! Нашему Мурзику уже 2 месяца 🥰",
            image: "https://images.unsplash.com/photo-1514888286974-6d03bde4ba47?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            duration: 12,
            background: "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)"
        },
        {
            type: "moment",
            emoji: "🎂",
            title: "12 ноября",
            text: "Твой день рождения! Я так волновался, готовя сюрприз. Твои глаза, когда ты увидела торт — это бесценно.",
            image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            duration: 15,
            background: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)"
        },
        {
            type: "message",
            emoji: "✨",
            title: "Ещё одно",
            author: "Ты",
            date: "7 сентября",
            text: "Только что осознал, что думаю о тебе каждую свободную минуту. Это и безумие, и самое прекрасное чувство одновременно.",
            duration: 15,
            background: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)"
        },
        {
            type: "stat",
            emoji: "😊",
            title: "Мы отправили",
            value: "1,543",
            label: "стикера с улыбками и сердечками",
            duration: 10,
            background: "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)"
        },
        {
            type: "outro",
            emoji: "🌟",
            title: "Спасибо тебе!",
            text: "За каждый смех, за каждое сообщение, за каждую минуту этого года. Я люблю тебя больше, чем все эти цифры могут показать. ❤️",
            duration: 15,
            background: "linear-gradient(135deg, #ff6b8b 0%, #6a5af9 100%)"
        }
    ]
};

// Заглушки для изображений, если своих нет
const fallbackImages = [
    'https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1492684223066-e9e4aab4d25e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
];
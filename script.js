// Основные переменные сторис
let currentStoryIndex = 0;
let totalStories = 0;
let storyInterval = null;
let storyPaused = false;
let storyMuted = false;
let progressIntervals = [];
let storyDuration = 10000; // 10 секунд по умолчанию

// Элементы DOM
const startBtn = document.getElementById('startStories');
const storyContainer = document.getElementById('storyContainer');
const storyProgress = document.getElementById('storyProgress');
const storyContent = document.getElementById('storyContent');
const prevStoryBtn = document.getElementById('prevStory');
const nextStoryBtn = document.getElementById('nextStory');
const closeStoryBtn = document.getElementById('closeStory');
const pauseStoryBtn = document.getElementById('pauseStory');
const muteStoryBtn = document.getElementById('muteStory');
const replayStoryBtn = document.getElementById('replayStory');
const storyTimer = document.getElementById('storyTimer');
const storyUsername = document.getElementById('storyUsername');
const backgroundMusic = document.getElementById('backgroundMusic');
const transitionSound = document.getElementById('transitionSound');

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    totalStories = storiesData.stories.length;
    storyUsername.textContent = `${storiesData.partnerName} ❤️`;
    
    // Создаем прогресс-бары
    createProgressBars();
    
    // Создаем слайды сторис
    createStorySlides();
    
    // Инициализируем события
    setupEventListeners();
    
    console.log('📱 Instagram Stories готовы!');
});

// Создание прогресс-баров
function createProgressBars() {
    storyProgress.innerHTML = '';
    for (let i = 0; i < totalStories; i++) {
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.innerHTML = `<div class="progress-fill" id="progress-${i}"></div>`;
        storyProgress.appendChild(progressBar);
    }
}

// Создание слайдов сторис
function createStorySlides() {
    storyContent.innerHTML = '';
    
    storiesData.stories.forEach((story, index) => {
        const slide = document.createElement('div');
        slide.className = 'story-slide';
        slide.id = `story-${index}`;
        slide.style.display = 'none';
        
        // Генерируем контент в зависимости от типа сторис
        let contentHTML = '';
        
        switch (story.type) {
            case 'intro':
            case 'outro':
            case 'moment':
                contentHTML = `
                    <div class="story-emoji">${story.emoji}</div>
                    <h1 class="story-title">${story.title}</h1>
                    <p class="story-text">${story.text}</p>
                    ${story.image ? `<img src="${story.image}" class="story-image" alt="${story.title}" onerror="this.src='${fallbackImages[index % fallbackImages.length]}'">` : ''}
                `;
                break;
                
            case 'stat':
                contentHTML = `
                    <div class="story-emoji">${story.emoji}</div>
                    <h1 class="story-title">${story.title}</h1>
                    <span class="story-stat-number">${story.value}</span>
                    <p class="story-stat-label">${story.label}</p>
                `;
                break;
                
            case 'words':
                const wordsHTML = story.words.map(word => 
                    `<span style="font-size: ${16 + word.count / 10}px; margin: 5px; display: inline-block;">
                        ${word.word}
                    </span>`
                ).join(' ');
                
                contentHTML = `
                    <div class="story-emoji">${story.emoji}</div>
                    <h1 class="story-title">${story.title}</h1>
                    <div style="margin: 30px 0;">
                        ${wordsHTML}
                    </div>
                `;
                break;
                
            case 'message':
                contentHTML = `
                    <div class="story-emoji">${story.emoji}</div>
                    <h1 class="story-title">${story.title}</h1>
                    <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; margin: 20px 0; max-width: 500px;">
                        <div style="font-weight: 600; margin-bottom: 10px; color: #ff6b8b;">${story.author}</div>
                        <div style="font-size: 1.3rem; margin-bottom: 10px;">${story.text}</div>
                        <div style="font-size: 0.9rem; opacity: 0.8;">${story.date}</div>
                    </div>
                `;
                break;
        }
        
        slide.innerHTML = contentHTML;
        storyContent.appendChild(slide);
    });
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Старт сторис
    startBtn.addEventListener('click', startStories);
    
    // Навигация
    prevStoryBtn.addEventListener('click', () => navigateStory(-1));
    nextStoryBtn.addEventListener('click', () => navigateStory(1));
    
    // Закрытие
    closeStoryBtn.addEventListener('click', closeStories);
    
    // Контролы
    pauseStoryBtn.addEventListener('click', togglePause);
    muteStoryBtn.addEventListener('click', toggleMute);
    replayStoryBtn.addEventListener('click', replayCurrentStory);
    
    // Свайпы для мобильных
    setupSwipeGestures();
    
    // Клавиатура
    document.addEventListener('keydown', handleKeyPress);
    
    // Касания/клики для навигации
    storyContent.addEventListener('click', (e) => {
        if (e.clientX < window.innerWidth / 2) {
            navigateStory(-1); // Левая часть - назад
        } else {
            navigateStory(1); // Правая часть - вперед
        }
    });
}

// Запуск сторис
function startStories() {
    startBtn.style.display = 'none';
    storyContainer.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Стартуем музыку
    backgroundMusic.volume = 0.3;
    backgroundMusic.play().catch(e => {
        console.log('Автовоспроизведение музыки заблокировано');
    });
    
    // Показываем первый сторис
    showStory(0);
}

// Показать конкретный сторис
function showStory(index) {
    // Обновляем индекс
    currentStoryIndex = index;
    
    // Скрываем все слайды
    document.querySelectorAll('.story-slide').forEach(slide => {
        slide.classList.remove('active');
    });
    
    // Показываем текущий слайд
    const currentSlide = document.getElementById(`story-${index}`);
    currentSlide.classList.add('active');
    
    // Устанавливаем фон
    const currentStory = storiesData.stories[index];
    storyContainer.style.background = currentStory.background;
    
    // Устанавливаем длительность
    storyDuration = (currentStory.duration || 10) * 1000;
    
    // Обновляем таймер
    updateTimer();
    
    // Сбрасываем все прогресс-бары
    resetProgressBars();
    
    // Запускаем прогресс текущего сторис
    startProgressBar(index);
    
    // Проигрываем звук перехода
    playTransitionSound();
    
    // Запускаем таймер для автосмены
    startStoryTimer();
}

// Навигация по сторис
function navigateStory(direction) {
    const newIndex = currentStoryIndex + direction;
    
    // Проверяем границы
    if (newIndex >= 0 && newIndex < totalStories) {
        showStory(newIndex);
    } else if (newIndex >= totalStories) {
        // Если это последний сторис - завершаем
        closeStories();
    }
}

// Запуск прогресс-бара
function startProgressBar(index) {
    // Останавливаем все предыдущие интервалы
    progressIntervals.forEach(interval => clearInterval(interval));
    progressIntervals = [];
    
    // Запускаем прогресс для текущего сторис
    const progressFill = document.getElementById(`progress-${index}`);
    if (progressFill) {
        progressFill.classList.add('active');
        
        // Обновляем ширину каждые 100мс
        const interval = setInterval(() => {
            if (!storyPaused) {
                const currentWidth = parseFloat(progressFill.style.width) || 0;
                const increment = 100 / (storyDuration / 100);
                
                if (currentWidth < 100) {
                    progressFill.style.width = `${currentWidth + increment}%`;
                }
            }
        }, 100);
        
        progressIntervals.push(interval);
    }
}

// Сброс всех прогресс-баров
function resetProgressBars() {
    document.querySelectorAll('.progress-fill').forEach(progress => {
        progress.style.width = '0%';
        progress.classList.remove('active');
    });
}

// Запуск таймера автосмены
function startStoryTimer() {
    // Останавливаем предыдущий таймер
    if (storyInterval) {
        clearTimeout(storyInterval);
    }
    
    // Запускаем новый таймер
    storyInterval = setTimeout(() => {
        if (!storyPaused) {
            navigateStory(1);
        }
    }, storyDuration);
}

// Обновление таймера
function updateTimer() {
    const seconds = storyDuration / 1000;
    storyTimer.textContent = `${seconds} сек`;
}

// Воспроизведение звука перехода
function playTransitionSound() {
    if (!storyMuted) {
        transitionSound.currentTime = 0;
        transitionSound.play().catch(e => {
            // Игнорируем ошибки автовоспроизведения
        });
    }
}

// Переключение паузы
function togglePause() {
    storyPaused = !storyPaused;
    
    if (storyPaused) {
        pauseStoryBtn.innerHTML = '<i class="fas fa-play"></i>';
        if (storyInterval) {
            clearTimeout(storyInterval);
        }
    } else {
        pauseStoryBtn.innerHTML = '<i class="fas fa-pause"></i>';
        startStoryTimer();
        startProgressBar(currentStoryIndex);
    }
}

// Переключение звука
function toggleMute() {
    storyMuted = !storyMuted;
    
    if (storyMuted) {
        muteStoryBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        backgroundMusic.volume = 0;
    } else {
        muteStoryBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        backgroundMusic.volume = 0.3;
    }
}

// Повторить текущий сторис
function replayCurrentStory() {
    showStory(currentStoryIndex);
}

// Закрыть сторис
function closeStories() {
    storyContainer.classList.remove('active');
    startBtn.style.display = 'flex';
    document.body.style.overflow = 'auto';
    
    // Останавливаем все таймеры
    if (storyInterval) {
        clearTimeout(storyInterval);
    }
    progressIntervals.forEach(interval => clearInterval(interval));
    
    // Останавливаем музыку
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    
    // Сбрасываем состояние
    currentStoryIndex = 0;
    storyPaused = false;
}

// Настройка свайпов для мобильных
function setupSwipeGestures() {
    let startX = 0;
    let endX = 0;
    
    storyContainer.addEventListener('touchstart', (e) => {
        startX = e.changedTouches[0].screenX;
    });
    
    storyContainer.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const threshold = 50;
        const diff = endX - startX;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                navigateStory(-1); // Свайп вправо - назад
            } else {
                navigateStory(1); // Свайп влево - вперед
            }
        }
    }
}

// Обработка нажатий клавиш
function handleKeyPress(e) {
    if (!storyContainer.classList.contains('active')) return;
    
    switch(e.key) {
        case 'ArrowLeft':
        case 'a':
            navigateStory(-1);
            break;
        case 'ArrowRight':
        case 'd':
        case ' ':
            navigateStory(1);
            break;
        case 'Escape':
            closeStories();
            break;
        case 'p':
            togglePause();
            break;
        case 'm':
            toggleMute();
            break;
    }
}

// Добавляем анимации
function animateElements() {
    // Анимация пульсации для эмодзи
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        @keyframes slideIn {
            from { 
                opacity: 0;
                transform: translateY(20px);
            }
            to { 
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .story-emoji {
            animation: pulse 2s infinite;
        }
        
        .story-slide.active {
            animation: slideIn 0.5s ease-out;
        }
    `;
    document.head.appendChild(style);
}

// Инициализируем анимации
animateElements();

// Добавляем функцию для быстрого тестирования
window.testStories = function() {
    console.log('Тест сторис:');
    console.log('Всего сторис:', totalStories);
    console.log('Текущий сторис:', currentStoryIndex);
    console.log('Данные:', storiesData.stories[currentStoryIndex]);
};
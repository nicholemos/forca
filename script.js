// Configurações da API e do jogo
const CONFIG = {
    apiKey: 'f3853edb736e04c1a9cb685d8a8951d0',
    maxErrors: 5,
    maxPages: 500,
    allowedChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    punctuation: [',', '.', ';', ':', '!', '?', '-', "'"],
    validLanguages: ['pt', 'en', 'es', 'fr', 'it', 'de', 'nl', 'pl'],
    messages: {
        win: '🎉 Parabéns! Você venceu! 🎉',
        lose: '😔 Você perdeu! Veja o filme:',
        errorAPI: '❌ Não foi possível carregar os dados. Tente novamente mais tarde.',
        newGame: '🎮 Novo jogo iniciado! Boa sorte!'
    },
    sounds: {
        button: 'https://www.soundjay.com/buttons/button-21.wav',
        error: 'https://www.soundjay.com/buttons/beep-03.wav',
        victory: 'https://www.soundjay.com/human/applause-3.wav',
        lose: 'https://www.soundjay.com/human/fart-squeak-01.wav'
    }
};

// Elementos do DOM
const DOM = {
    winCount: document.getElementById('win-count'),
    loseCount: document.getElementById('lose-count'),
    movieCover: document.getElementById('movie-cover'),
    movieApproval: document.getElementById('movie-approval'),
    movieInfoBox: document.getElementById('movie-info-box'),
    wordContainer: document.getElementById('word'),
    wrongLettersSpan: document.getElementById('wrong-letters-span'),
    errorImage: document.getElementById('error-image'),
    resetButton: document.getElementById('reset-button'),
    virtualKeyboard: document.getElementById('virtual-keyboard'),
    categoryInputs: document.querySelectorAll('input[name="category"]')
};

// Estado do jogo
let gameState = {
    randomItem: '',
    correctLetters: [],
    wrongLetters: [],
    errorCount: 0,
    isGameActive: true,
    winCount: parseInt(localStorage.getItem('hangman-wins') || '0'),
    loseCount: parseInt(localStorage.getItem('hangman-losses') || '0')
};

// Classe para gerenciar áudio
class AudioManager {
    constructor() {
        this.sounds = {};
        this.loadSounds();
    }

    loadSounds() {
        Object.entries(CONFIG.sounds).forEach(([key, url]) => {
            this.sounds[key] = new Audio(url);
            this.sounds[key].preload = 'auto';
            this.sounds[key].volume = 0.3;
        });
    }

    play(soundName) {
        try {
            if (this.sounds[soundName]) {
                this.sounds[soundName].currentTime = 0;
                this.sounds[soundName].play().catch(e => console.log('Audio play failed:', e));
            }
        } catch (error) {
            console.log('Audio error:', error);
        }
    }
}

// Classe principal do jogo
class HangmanGame {
    constructor() {
        this.audioManager = new AudioManager();
        this.init();
    }

    init() {
        this.updateScoreboard();
        this.setupEventListeners();
        this.getRandomItem();
        this.showWelcomeMessage();
    }

    showWelcomeMessage() {
        this.showNotification(CONFIG.messages.newGame, 'success');
    }

    setupEventListeners() {
        // Botão de reset
        DOM.resetButton.addEventListener('click', () => {
            this.audioManager.play('button');
            this.getRandomItem();
            this.showNotification(CONFIG.messages.newGame, 'success');
        });

        // Mudança de categoria
        DOM.categoryInputs.forEach(input => {
            input.addEventListener('change', () => {
                if (gameState.isGameActive) {
                    this.getRandomItem();
                }
            });
        });

        // Teclado físico
        document.addEventListener('keydown', (e) => {
            const letter = e.key.toUpperCase();
            if (/^[A-Z0-9]$/.test(letter)) {
                this.handleLetterInput(letter);
            }
        });
    }

    async getRandomItem() {
        try {
            this.showLoading(true);
            
            const category = document.querySelector('input[name="category"]:checked').value;
            const endpoint = category === 'filmes' ? 'movie/popular' : 'tv/popular';
            const page = Math.floor(Math.random() * CONFIG.maxPages) + 1;
            
            const apiUrl = `https://api.themoviedb.org/3/${endpoint}?api_key=${CONFIG.apiKey}&language=pt-BR&page=${page}`;
            
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('API request failed');
            
            const data = await response.json();
            
            // Filtrar resultados válidos
            const validResults = data.results.filter(item => 
                item.original_language && 
                CONFIG.validLanguages.includes(item.original_language) &&
                (item.title || item.name)
            );

            if (validResults.length === 0) {
                throw new Error('No valid results found');
            }

            const item = validResults[Math.floor(Math.random() * validResults.length)];
            
            gameState.randomItem = item.title || item.name;
            
            // Configurar informações do filme/série
            if (item.poster_path) {
                DOM.movieCover.src = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
            }
            DOM.movieApproval.textContent = `Classificação: ${item.vote_average.toFixed(1)}/10`;

            this.resetGame();
            
        } catch (error) {
            console.error('Error fetching item:', error);
            this.showNotification(CONFIG.messages.errorAPI, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    resetGame() {
        gameState.correctLetters = [];
        gameState.wrongLetters = [];
        gameState.errorCount = 0;
        gameState.isGameActive = true;
        
        this.hideMovieInfo();
        this.updateUI();
    }

    updateUI() {
        this.displayWord();
        this.updateWrongLetters();
        this.updateErrorImage();
        this.updateVirtualKeyboard();
    }

    displayWord() {
        const displayed = gameState.randomItem.split('').map(letter => {
            const normalizedLetter = letter.toUpperCase();

            // Pontuação e espaços
            if (CONFIG.punctuation.includes(letter)) return letter;
            if (letter === ' ') return '&nbsp;';

            // Verificar se a letra foi adivinhada
            const isCorrect = gameState.correctLetters.some(correctLetter => {
                return this.getLetterVariants(correctLetter).includes(normalizedLetter);
            });

            // Letra incorreta (para exibição final)
            if (gameState.wrongLetters.includes(normalizedLetter) && !isCorrect && !gameState.isGameActive) {
                return `<span class="incorrect-letter">${letter}</span>`;
            }

            // Letra correta
            if (isCorrect) {
                return `<span class="correct-letter">${letter}</span>`;
            }

            return '_';
        });

        DOM.wordContainer.innerHTML = displayed.join('');

        // Verificar condições de fim de jogo
        if (gameState.isGameActive) {
            if (gameState.errorCount >= CONFIG.maxErrors) {
                this.endGame(false);
            } else if (!displayed.includes('_')) {
                this.endGame(true);
            }
        }
    }

    getLetterVariants(letter) {
        const variants = {
            'A': ['A', 'Á', 'À', 'Ã', 'Â'],
            'E': ['E', 'É', 'Ê'],
            'I': ['I', 'Í'],
            'O': ['O', 'Ó', 'Ô', 'Õ'],
            'U': ['U', 'Ú', 'Û'],
            'C': ['C', 'Ç'],
        };
        
        return variants[letter] || [letter];
    }

    updateWrongLetters() {
        DOM.wrongLettersSpan.textContent = gameState.wrongLetters.join(', ');
    }

    handleLetterInput(letter) {
        if (!gameState.isGameActive || 
            gameState.wrongLetters.includes(letter) || 
            gameState.correctLetters.includes(letter)) {
            return;
        }

        this.audioManager.play('button');

        const normalizedLetter = letter.toUpperCase();
        const matchingLetter = this.findMatchingLetter(normalizedLetter);

        if (matchingLetter) {
            gameState.correctLetters.push(matchingLetter);
            this.animateCorrectLetter();
        } else {
            gameState.wrongLetters.push(normalizedLetter);
            gameState.errorCount++;
            this.audioManager.play('error');
            this.animateWrongLetter();
        }

        this.updateUI();
    }

    findMatchingLetter(letter) {
        const variants = this.getLetterVariants(letter);
        const normalizedRandomItem = gameState.randomItem.toUpperCase();
        return variants.find(variant => normalizedRandomItem.includes(variant)) || null;
    }

    updateErrorImage() {
        DOM.errorImage.src = `${gameState.errorCount}erro.png`;
        DOM.errorImage.style.transform = 'scale(1.05)';
        setTimeout(() => {
            DOM.errorImage.style.transform = 'scale(1)';
        }, 200);
    }

    updateVirtualKeyboard() {
        DOM.virtualKeyboard.innerHTML = CONFIG.allowedChars.split('').map(char => {
            const isDisabled = gameState.correctLetters.includes(char) || gameState.wrongLetters.includes(char);
            const disabledClass = isDisabled ? 'disabled' : '';
            
            return `<button class="${disabledClass}" onclick="hangmanGame.handleLetterInput('${char}')" ${isDisabled ? 'disabled' : ''}>${char}</button>`;
        }).join('');
    }

    endGame(isVictory) {
        if (!gameState.isGameActive) return;
        
        gameState.isGameActive = false;

        // Mostrar informações do filme/série
        this.showMovieInfo();

        // Atualizar placar
        if (isVictory) {
            gameState.winCount++;
            this.audioManager.play('victory');
            this.showNotification(CONFIG.messages.win, 'success');
        } else {
            gameState.loseCount++;
            this.audioManager.play('lose');
            this.showNotification(CONFIG.messages.lose, 'error');
        }

        // Salvar placar no localStorage
        localStorage.setItem('hangman-wins', gameState.winCount.toString());
        localStorage.setItem('hangman-losses', gameState.loseCount.toString());

        this.updateScoreboard();
        this.displayWord(); // Atualizar para mostrar letras não adivinhadas
    }

    showMovieInfo() {
        DOM.movieInfoBox.classList.remove('hidden');
        DOM.movieInfoBox.style.animation = 'fadeIn 0.5s ease-out';
    }

    hideMovieInfo() {
        DOM.movieInfoBox.classList.add('hidden');
    }

    updateScoreboard() {
        DOM.winCount.textContent = gameState.winCount;
        DOM.loseCount.textContent = gameState.loseCount;
    }

    animateCorrectLetter() {
        DOM.wordContainer.style.animation = 'none';
        setTimeout(() => {
            DOM.wordContainer.style.animation = 'letterReveal 0.5s ease-in-out';
        }, 10);
    }

    animateWrongLetter() {
        DOM.wrongLettersSpan.style.animation = 'none';
        setTimeout(() => {
            DOM.wrongLettersSpan.style.animation = 'shake 0.5s ease-in-out';
        }, 10);
    }

    showNotification(message, type = 'info') {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Estilos da notificação
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '0.5rem',
            color: 'white',
            fontWeight: '500',
            zIndex: '1000',
            animation: 'slideIn 0.3s ease-out',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });

        // Cores baseadas no tipo
        const colors = {
            success: '#48bb78',
            error: '#f56565',
            info: '#4299e1'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    showLoading(show) {
        if (show) {
            DOM.resetButton.disabled = true;
            DOM.resetButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';
        } else {
            DOM.resetButton.disabled = false;
            DOM.resetButton.innerHTML = '<i class="fas fa-redo"></i> Novo Jogo';
        }
    }
}

// Adicionar animações CSS via JavaScript
const additionalStyles = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}
`;

// Adicionar estilos ao documento
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Inicializar o jogo quando a página carregar
let hangmanGame;

document.addEventListener('DOMContentLoaded', () => {
    hangmanGame = new HangmanGame();
});

// Fallback caso DOMContentLoaded já tenha disparado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!hangmanGame) {
            hangmanGame = new HangmanGame();
        }
    });
} else {
    hangmanGame = new HangmanGame();
}

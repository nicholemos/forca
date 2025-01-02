const apiKey = 'f3853edb736e04c1a9cb685d8a8951d0';
const CONFIG = {
    maxErrors: 5,
    maxPages: 500,
    allowedChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    punctuation: [',', '.', ';', ':', '!', '?', '-', "'"],
    validLanguages: ['pt', 'en', 'es', 'fr', 'it', 'de', 'nl', 'pl'],  // Idiomas ocidentais
    messages: {
        win: 'Parabéns! Você venceu!',
        lose: 'Você perdeu! Veja o filme:',
        errorAPI: 'Não foi possível carregar os dados. Tente novamente mais tarde.',
    },
};

const DOM = {
    winCount: document.getElementById('win-count'),
    loseCount: document.getElementById('lose-count'),
    movieCover: document.getElementById('movie-cover'),
    movieApproval: document.getElementById('movie-approval'),
    wordContainer: document.getElementById('word'),
    wrongLettersSpan: document.getElementById('wrong-letters-span'),
    errorImage: document.getElementById('error-image'),
    resetButton: document.getElementById('reset-button'),
    virtualKeyboard: document.getElementById('virtual-keyboard'),
};

// Áudio de clique
function playButtonSound() {
    const sound = document.getElementById('button-sound');
    sound.play();
}

// Áudio de erro
function playErrorSound() {
    const errorSound = document.getElementById('error-sound');
    errorSound.play();
}

// Áudio de vitória
function playVictorySound() {
    const victorySound = document.getElementById('victory-sound');
    victorySound.play();
}

let randomItem = '', correctLetters = [], wrongLetters = [], errorCount = 0, isGameActive = true;
let winCount = 0, loseCount = 0;

// Função para normalizar o texto (remover acentos)
const removeAccents = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const getRandomPage = () => Math.floor(Math.random() * CONFIG.maxPages) + 1;

async function getRandomItem() {
    try {
        const category = document.querySelector('input[name="category"]:checked').value;
        const apiUrl = `https://api.themoviedb.org/3/${category === 'filmes' ? 'movie/popular' : 'tv/popular'}?api_key=${apiKey}&language=pt-BR&page=${getRandomPage()}`;
        const { results } = await fetch(apiUrl).then(res => res.json());

        // Filtra os filmes/séries com idiomas válidos
        const validResults = results.filter(item => {
            return item.original_language && CONFIG.validLanguages.includes(item.original_language);
        });

        if (validResults.length === 0) {
            alert('Não há filmes/séries válidos no momento.');
            return;
        }

        const item = validResults[Math.floor(Math.random() * validResults.length)];

        randomItem = item.title || item.name;
        DOM.movieCover.src = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
        DOM.movieApproval.textContent = `Classificação: ${item.vote_average.toFixed(1)}`;

        resetGame();
    } catch (error) {
        console.error(error);
        alert(CONFIG.messages.errorAPI);
    }
}

function resetGame() {
    correctLetters = [];
    wrongLetters = [];
    errorCount = 0;
    isGameActive = true;
    toggleMovieInfo(false);
    updateUI();
}

function updateUI() {
    displayWord();
    updateWrongLetters();
    updateErrorImage();
    updateVirtualKeyboard();
}

function displayWord(isGameStart = false) {
    const displayed = randomItem.split('').map(letter => {
        const normalizedLetter = letter.toUpperCase();

        if (CONFIG.punctuation.includes(normalizedLetter)) return letter;
        if (letter === ' ') return '&nbsp;';

        // Verifica se a letra foi adivinhada
        const isCorrect = correctLetters.some(correctLetter => {
            return getLetterVariants(correctLetter).includes(normalizedLetter);
        });

        // Verifica se a letra foi errada e deve ser exibida em vermelho
        if (wrongLetters.includes(normalizedLetter) && !isCorrect) {
            return `<span class="incorrect-letter">${letter}</span>`;
        }

        if (isCorrect) {
            return `<span class="correct-letter">${letter}</span>`;
        }

        return '_';
    });

    DOM.wordContainer.innerHTML = displayed.join(''); 

    if (!isGameStart) {
        if (errorCount >= CONFIG.maxErrors) {
            endGame(false); // Derrota
        } else if (!displayed.includes('_')) {
            endGame(true); // Vitória
        }
    }
}

function getLetterVariants(letter) {
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

function updateWrongLetters() {
    DOM.wrongLettersSpan.textContent = wrongLetters.join(', ');
}

function handleLetterInput(letter) {
    playButtonSound(); // Toca o som de clique
    if (!isGameActive || wrongLetters.includes(letter) || correctLetters.includes(letter)) return;

    const normalizedLetter = letter.toUpperCase();
    const matchingLetter = findMatchingLetter(normalizedLetter);

    if (matchingLetter) {
        correctLetters.push(matchingLetter);
    } else {
        wrongLetters.push(normalizedLetter);
        errorCount++;
        playErrorSound(); // Toca o som de erro quando o jogador erra
    }

    updateUI();
}

function findMatchingLetter(letter) {
    const variants = getLetterVariants(letter);
    const normalizedRandomItem = randomItem.toUpperCase();
    return variants.find(variant => normalizedRandomItem.includes(variant)) || null;
}

function updateErrorImage() {
    DOM.errorImage.src = `${errorCount}erro.png`;
}

function updateVirtualKeyboard() {
    console.log("Atualizando o teclado virtual...");

    DOM.virtualKeyboard.innerHTML = CONFIG.allowedChars.split('').map(char => {
        const disabledClass = correctLetters.includes(char) || wrongLetters.includes(char) ? 'disabled' : '';
        console.log(char, disabledClass); // Verifica se a classe 'disabled' está sendo aplicada corretamente
        return `<button class="${disabledClass}" onclick="handleLetterInput('${char}')">${char}</button>`;
    }).join('');
}

// Áudio de derrota
function playLoseSound() {
    const loseSound = document.getElementById('lose-sound');
    loseSound.play();
}


function endGame(isVictory) {
    if (!isGameActive) return;
    isGameActive = false;

    // Exibe a capa e a nota do filme
    toggleMovieInfo(true);

    // Exibe a mensagem de vitória ou derrota
    alert(isVictory ? CONFIG.messages.win : CONFIG.messages.lose);

    // Toca o som de vitória ou derrota
    if (isVictory) {
        playVictorySound();
    } else {
        playLoseSound(); // Toca o som de derrota
    }

    // Atualiza o placar
    if (isVictory) {
        winCount++;
    } else {
        loseCount++;
    }
    updateScoreboard();

    // Completa as letras restantes
    completeRemainingLetters();
}


DOM.resetButton.addEventListener('click', () => {
    playButtonSound(); // Toca o som de clique
    getRandomItem();  // Carrega um novo filme
    toggleMovieInfo(false);  // Esconde a capa e a nota do filme antes de recomeçar
});

function toggleMovieInfo(show) {
    if (show) {
        DOM.movieCover.classList.remove('d-none');
        DOM.movieApproval.classList.remove('d-none');
    } else {
        DOM.movieCover.classList.add('d-none');
        DOM.movieApproval.classList.add('d-none');
    }
}

function updateScoreboard() {
    // Atualiza o contador de vitórias
    DOM.winCount.textContent = winCount;
    
    // Atualiza o contador de derrotas
    DOM.loseCount.textContent = loseCount;

    // Aplica a cor vermelha ao contador de derrotas
    DOM.loseCount.style.color = '#e74c3c';  // Cor vermelha
}

function handleCategoryChange() {
    if (isGameActive) resetGame();
    getRandomItem();
}

document.querySelectorAll('input[name="category"]').forEach(input =>
    input.addEventListener('change', handleCategoryChange)
);

document.addEventListener('keydown', e => {
    const letter = e.key.toUpperCase();
    if (/^[A-Z0-9]$/.test(letter)) {
        playButtonSound(); // Toca o som de clique
        handleLetterInput(letter);
    }
});

function completeRemainingLetters() {
    // Só exibe as letras não adivinhadas ao perder o jogo
    if (errorCount >= CONFIG.maxErrors) {
        const displayedLetters = randomItem.split('').map(letter => {
            const normalizedLetter = letter.toUpperCase();

            // Se a letra não foi adivinhada corretamente, exibe a letra
            if (!correctLetters.includes(normalizedLetter) && !CONFIG.punctuation.includes(letter) && letter !== ' ') {
                return `<span class="incorrect-letter">${letter}</span>`;
            }

            // Caso contrário, não altera a letra
            return letter;
        });

        // Atualiza o conteúdo da palavra no DOM com as letras que faltaram
        DOM.wordContainer.innerHTML = displayedLetters.join('');
    }
}

getRandomItem();

alert(`Letra: ${char}, Classe: ${disabledClass}`);

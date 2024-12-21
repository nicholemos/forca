const apiKey = 'f3853edb736e04c1a9cb685d8a8951d0';
const CONFIG = {
    maxErrors: 5,
    maxPages: 500,
    allowedChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    punctuation: [',', '.', ';', ':', '!', '?', '-'],
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

let randomItem = '', correctLetters = [], wrongLetters = [];
let errorCount = 0, winCount = 0, loseCount = 0, isGameActive = true;

// Funções Utilitárias
const normalizeString = (str) =>
    str.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
        .toUpperCase();


const getRandomPage = () => Math.floor(Math.random() * CONFIG.maxPages) + 1;

// Busca Filmes ou Séries
async function getRandomItem() {
    try {
        const category = document.querySelector('input[name="category"]:checked').value;
        const page = getRandomPage();
        const endpoint = category === 'filmes' ? 'movie/popular' : 'tv/popular';
        const apiUrl = `https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}&language=pt-BR&page=${page}`;

        const { results } = await (await fetch(apiUrl)).json();
        const item = results[Math.floor(Math.random() * results.length)];

        randomItem = normalizeString(category === 'filmes' ? item.title : item.name);
        DOM.movieCover.src = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
        DOM.movieApproval.textContent = `Popularidade: ${item.popularity.toFixed(1)}`;

        // Chame o resetGame após garantir que o randomItem foi configurado corretamente
        if (randomItem && randomItem.length > 0) {
            resetGame();
        } else {
            console.error('Erro: Nenhum item válido retornado.');
            alert(CONFIG.messages.errorAPI);
        }

    } catch (error) {
        console.error(error);
        alert(CONFIG.messages.errorAPI);
    }
}

// Jogo
function startGame() {
    getRandomItem();
}

function adjustWordSpacing() {
    const wordElement = DOM.wordContainer;
    const parentWidth = wordElement.parentElement.offsetWidth;
    const wordWidth = wordElement.scrollWidth;

    if (wordWidth > parentWidth) {
        const scalingFactor = parentWidth / wordWidth;
        wordElement.style.fontSize = `${Math.max(1, 2 * scalingFactor)}rem`;
    } else {
        wordElement.style.fontSize = '2rem'; // Valor padrão
    }
}


// Chame essa função sempre que o jogo começar ou reiniciar
function resetGame() {
    correctLetters = [];
    wrongLetters = [];
    errorCount = 0;
    isGameActive = true;

    updateErrorImage();
    displayWord(true);
    updateWrongLetters();
    toggleMovieInfo(false);
    updateVirtualKeyboard();
    adjustWordSpacing(); // Ajusta o espaçamento inicial
}

function displayWord(isGameStart = false) {
    const displayed = randomItem.split('').map(letter => {
        if (CONFIG.punctuation.includes(letter)) return letter; // Mantém pontuações
        if (letter === ' ') return ' '; // Espaço normal para separação entre palavras

        // Mostra letras adivinhadas ou '_'
        return correctLetters.includes(letter) ? letter : '_';
    });

    DOM.wordContainer.innerHTML = displayed.join(' '); // Junta letras com espaço entre elas
    checkGameProgress(displayed, isGameStart);
}

function checkGameProgress(displayed, isGameStart) {
    if (!isGameStart && isGameActive) { // Verifica se o jogo está ativo
        if (!displayed.includes('_')) {
            endGame(true); // Vitória
        }
    }
}

// Manipula Teclado Virtual
function updateVirtualKeyboard() {
    if (DOM.virtualKeyboard.childNodes.length) return; // Evita recriação
    DOM.virtualKeyboard.innerHTML = CONFIG.allowedChars.split('').map(char =>
        `<button onclick="handleLetterInput('${char}')">${char}</button>`
    ).join('');
}

// Atualiza Letras Erradas
function updateWrongLetters() {
    DOM.wrongLettersSpan.textContent = wrongLetters.join(', ');
}

// Verifica Letra Input
function handleLetterInput(letter) {
    if (!isGameActive || wrongLetters.includes(letter) || correctLetters.includes(letter)) return;

    const normalizedItem = normalizeString(randomItem); // Normaliza o texto do item
    const normalizedLetter = normalizeString(letter); // Normaliza a letra inserida

    if (normalizedItem.includes(normalizedLetter)) {
        // Adiciona as letras originais correspondentes à letra normalizada
        randomItem.split('').forEach((originalLetter, index) => {
            if (normalizeString(originalLetter) === normalizedLetter && !correctLetters.includes(originalLetter)) {
                correctLetters.push(originalLetter);
            }
        });
    } else {
        wrongLetters.push(letter);
        errorCount++;
        updateErrorImage();
        if (errorCount >= CONFIG.maxErrors) {
            endGame(false); // Derrota
        }
    }

    displayWord(); // Atualiza a exibição da palavra
    updateWrongLetters(); // Atualiza as letras erradas
}



// Finaliza Jogo
function endGame(isVictory) {
    if (!isGameActive) return; // Garante que não será chamada mais de uma vez
    isGameActive = false;

    toggleMovieInfo(true);
    alert(isVictory ? CONFIG.messages.win : CONFIG.messages.lose);
    isVictory ? winCount++ : loseCount++;
    updateScoreboard();
    displayWord(true);
}

function toggleMovieInfo(show) {
    DOM.movieCover.style.display = show ? 'block' : 'none';
    DOM.movieApproval.style.display = show ? 'block' : 'none';
}

function updateErrorImage() {
    DOM.errorImage.src = `${errorCount}erro.png`;
}

function updateScoreboard() {
    DOM.winCount.textContent = winCount;
    DOM.loseCount.textContent = loseCount;
}

// Reinicia o jogo ao trocar de categoria
function handleCategoryChange() {
    if (isGameActive) resetGame();
    startGame();
}

// Eventos
document.querySelectorAll('input[name="category"]').forEach(input => {
    input.addEventListener('change', handleCategoryChange);
});
DOM.resetButton.addEventListener('click', startGame);
document.addEventListener('keydown', (e) => {
    const letter = e.key.toUpperCase();
    if (/^[A-Z0-9]$/.test(letter)) handleLetterInput(letter);
});




// Inicializa
startGame();

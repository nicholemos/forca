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

let randomItem = '', correctLetters = [], wrongLetters = [], errorCount = 0, isGameActive = true;
let winCount = 0, loseCount = 0;

const normalizeString = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

const getRandomPage = () => Math.floor(Math.random() * CONFIG.maxPages) + 1;

async function getRandomItem() {
    try {
        const category = document.querySelector('input[name="category"]:checked').value;
        const apiUrl = `https://api.themoviedb.org/3/${category === 'filmes' ? 'movie/popular' : 'tv/popular'}?api_key=${apiKey}&language=pt-BR&page=${getRandomPage()}`;
        const { results } = await fetch(apiUrl).then(res => res.json());
        const item = results[Math.floor(Math.random() * results.length)];
        
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
        letter = letter.toUpperCase();

        if (CONFIG.punctuation.includes(letter)) return letter;
        if (letter === ' ') return '&nbsp;';

        if (errorCount >= CONFIG.maxErrors && !correctLetters.includes(letter)) {
            return `<span class="missing-letter">${letter}</span>`;
        }

        if (correctLetters.includes(letter)) {
            return letter;
        } else {
            return '_';
        }
    });

    DOM.wordContainer.innerHTML = displayed.join('');

    if (!isGameStart) {
        // Verifique se o jogador perdeu antes de verificar se ele venceu
        if (errorCount >= CONFIG.maxErrors) {
            endGame(false); // Derrota: número máximo de erros foi atingido
        } else if (!displayed.includes('_')) {
            endGame(true); // Vitória: todas as letras foram adivinhadas
        }
    }
}


function updateWrongLetters() {
    DOM.wrongLettersSpan.textContent = wrongLetters.join(', ');
}

function handleLetterInput(letter) {
    if (!isGameActive || wrongLetters.includes(letter) || correctLetters.includes(letter)) return;

    const matchingLetter = findMatchingLetter(letter);

    if (matchingLetter) {
        correctLetters.push(matchingLetter);
    } else {
        wrongLetters.push(letter);
        errorCount++;
    }

    updateUI();
}

function findMatchingLetter(letter) {
    const normalizedLetter = normalizeString(letter); // Normaliza a letra digitada

    // Encontra a letra correta (acentuada) correspondente à versão sem acento
    return randomItem.split('').some(originalLetter => {
        return normalizeString(originalLetter) === normalizedLetter;
    }) ? letter : null;
}



function updateErrorImage() {
    DOM.errorImage.src = `${errorCount}erro.png`;
}

function updateVirtualKeyboard() {
    DOM.virtualKeyboard.innerHTML = CONFIG.allowedChars.split('').map(char =>
        `<button onclick="handleLetterInput('${char}')">${char}</button>`
    ).join('');
}

function endGame(isVictory) {
    if (!isGameActive) return;
    isGameActive = false;

    toggleMovieInfo(true);
    alert(isVictory ? CONFIG.messages.win : CONFIG.messages.lose);
    isVictory ? winCount++ : loseCount++;
    updateScoreboard();
    displayWord(); // Atualiza o estado final do jogo
}

function toggleMovieInfo(show) {
    DOM.movieCover.style.display = show ? 'block' : 'none';
    DOM.movieApproval.style.display = show ? 'block' : 'none';
}

function updateScoreboard() {
    DOM.winCount.textContent = winCount;
    DOM.loseCount.textContent = loseCount;
}

function handleCategoryChange() {
    if (isGameActive) resetGame();
    getRandomItem();
}

document.querySelectorAll('input[name="category"]').forEach(input =>
    input.addEventListener('change', handleCategoryChange)
);

DOM.resetButton.addEventListener('click', getRandomItem);
document.addEventListener('keydown', e => {
    const letter = e.key.toUpperCase(); // Convertendo a letra digitada para maiúscula
    if (/^[A-Z0-9]$/.test(letter)) { // Apenas processa se for uma letra ou número
        handleLetterInput(letter);
    }
});


getRandomItem();

//https://onecompiler.com/html/434b4avnp

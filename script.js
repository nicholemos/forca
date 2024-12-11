// Chave da API do The Movie Database
const apiKey = 'SUA_CHAVE_API_AQUI';
let correctLetters = [];
let wrongLetters = [];
let randomItem = '';
let errorCount = 0;
let isGameActive = true;

// Referências aos elementos do DOM
const wordContainer = document.getElementById('word');
const wrongLettersSpan = document.getElementById('wrong-letters-span');
const resetButton = document.getElementById('reset-button');
const errorImage = document.getElementById('error-image');
const movieCover = document.getElementById('movie-cover');
const movieApproval = document.getElementById('movie-approval');
const winCountSpan = document.getElementById('win-count');
const loseCountSpan = document.getElementById('lose-count');
let winCount = 0;
let loseCount = 0;

// Atualiza o placar de vitórias e derrotas
function updateScore() {
    winCountSpan.textContent = winCount;
    loseCountSpan.textContent = loseCount;
}

// Atualiza a imagem de erros
function updateErrorImage() {
    errorImage.src = `${errorCount}erro.png`;
}

// Atualiza a palavra na tela
function displayWord() {
    wordContainer.innerHTML = randomItem
        .split('')
        .map((letter) =>
            correctLetters.includes(letter.toUpperCase())
                ? `<span>${letter}</span>`
                : `<span>_</span>`
        )
        .join('');
}

// Seleciona um item aleatório da API baseado na categoria
async function getRandomItem() {
    const selectedCategory = document.querySelector('input[name="category"]:checked')?.value;

    if (!selectedCategory) {
        alert('Por favor, selecione uma categoria.');
        return;
    }

    let apiUrl = '';
    if (selectedCategory === 'filmes') {
        apiUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=pt-BR&page=${Math.floor(Math.random() * 10) + 1}`;
    } else if (selectedCategory === 'series') {
        apiUrl = `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&language=pt-BR&page=${Math.floor(Math.random() * 10) + 1}`;
    } else if (selectedCategory === 'pessoas') {
        apiUrl = `https://api.themoviedb.org/3/person/popular?api_key=${apiKey}&language=pt-BR&page=${Math.floor(Math.random() * 10) + 1}`;
    }

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const randomIndex = Math.floor(Math.random() * data.results.length);
        const selectedItem = data.results[randomIndex];

        if (selectedCategory === 'pessoas') {
            randomItem = selectedItem.name.toUpperCase();
        } else {
            randomItem = selectedItem.title ? selectedItem.title.toUpperCase() : selectedItem.name.toUpperCase();
        }

        // Exibe capa e aprovação (apenas para filmes/séries)
        if (selectedCategory !== 'pessoas') {
            movieCover.src = `https://image.tmdb.org/t/p/w500${selectedItem.poster_path}`;
            movieCover.style.display = 'block';
            movieApproval.textContent = `Popularidade: ${selectedItem.popularity.toFixed(1)}`;
            movieApproval.style.display = 'block';
        } else {
            movieCover.style.display = 'none';
            movieApproval.style.display = 'none';
        }

        correctLetters = [];
        wrongLetters = [];
        errorCount = 0;
        isGameActive = true;
        updateErrorImage();
        displayWord();
    } catch (error) {
        alert('Erro ao buscar dados. Tente novamente.');
        console.error(error);
    }
}

// Verifica o final do jogo
function checkEndGame() {
    const guessedWord = wordContainer.innerText.replace(/\s+/g, '');
    if (guessedWord === randomItem) {
        alert('Parabéns! Você venceu!');
        winCount++;
        isGameActive = false;
        updateScore();
    } else if (errorCount >= 6) {
        alert(`Você perdeu! A palavra era: ${randomItem}`);
        loseCount++;
        isGameActive = false;
        updateScore();
    }
}

// Lida com a entrada de letras
function handleLetterInput(letter) {
    if (!isGameActive) return;

    if (randomItem.includes(letter)) {
        if (!correctLetters.includes(letter)) {
            correctLetters.push(letter);
            displayWord();
        }
    } else {
        if (!wrongLetters.includes(letter)) {
            wrongLetters.push(letter);
            errorCount++;
            wrongLettersSpan.textContent = wrongLetters.join(', ');
            updateErrorImage();
        }
    }

    checkEndGame();
}

// Configura o teclado virtual
function setupKeyboard() {
    const keyboardContainer = document.getElementById('letter-buttons');
    keyboardContainer.innerHTML = '';

    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((letter) => {
        const button = document.createElement('button');
        button.textContent = letter;
        button.addEventListener('click', () => handleLetterInput(letter));
        keyboardContainer.appendChild(button);
    });
}

// Reinicia o jogo
function resetGame() {
    correctLetters = [];
    wrongLetters = [];
    wrongLettersSpan.textContent = '';
    wordContainer.innerHTML = '';
    errorCount = 0;
    isGameActive = true;
    movieCover.style.display = 'none';
    movieApproval.style.display = 'none';
    updateErrorImage();
    getRandomItem();
}

// Listeners
resetButton.addEventListener('click', resetGame);

window.addEventListener('keydown', (e) => {
    const letter = e.key.toUpperCase();
    if (/^[A-Z]$/.test(letter)) {
        handleLetterInput(letter);
    }
});

// Inicialização
setupKeyboard();

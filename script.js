const apiKey = 'f3853edb736e04c1a9cb685d8a8951d0';
const apiUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=pt-BR&page=1`;
let selectedMovieTitle;
let selectedMovieCover;
let selectedMovieRating;
let wrongLetters = [];
let correctLetters = [];
let isGameActive = true;

// Função para pegar um filme aleatório
async function getRandomMovie() {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Erro na resposta da API');
        }
        const data = await response.json();
        if (!data.results || data.results.length === 0) {
            throw new Error('Nenhum filme encontrado');
        }
        const movies = data.results;
        const randomMovie = movies[Math.floor(Math.random() * movies.length)];
        selectedMovieTitle = randomMovie.title.toUpperCase();
        selectedMovieCover = `https://image.tmdb.org/t/p/w500${randomMovie.poster_path}`;
        selectedMovieRating = randomMovie.vote_average;
        correctLetters = [];
        wrongLetters = [];
        isGameActive = true;
        displayWord();
        updateWrongLetters();
    } catch (error) {
        console.error('Erro ao buscar filme:', error);
        alert('Não foi possível carregar os dados do filme. Por favor, tente novamente mais tarde.');
    }
}

function normalizeText(text) {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')  // Remove acentos
        .toUpperCase();                   // Converte para maiúsculas
}



function displayWord() {
    const wordElement = document.getElementById('word');
    wordElement.innerHTML = selectedMovieTitle
        .split(' ')
        .map(word => {
            return word.split('').map(letter => {
                if (letter.match(/[!?,.:;'"&-]/)) {
                    return letter;
                } else {
                    return correctLetters.includes(normalizeText(letter)) ? letter : '_';
                }
            }).join('');
        })
        .join(' ');
}

function updateErrorImage() {
    const errorImage = document.getElementById('error-image');
    const errorCount = Math.min(wrongLetters.length, 6);
    errorImage.src = `${errorCount}erro.png`;
}


// Função para verificar se o jogador digitou a letra corretamente
function handleLetterInput(letter) {
    const normalizedLetter = normalizeText(letter);
    const sanitizedTitle = normalizeText(selectedMovieTitle);

    if (correctLetters.includes(normalizedLetter) || wrongLetters.includes(normalizedLetter)) {
        return; // Ignora se a letra já foi usada
    }

    if (sanitizedTitle.includes(normalizedLetter)) {
        correctLetters.push(normalizedLetter);
    } else {
        wrongLetters.push(normalizedLetter);
    }

    updateGameStatus();
}


function updateGameStatus() {
    displayWord();
    updateWrongLetters();
    updateErrorImage();
    checkEndGame();
}

function updateWrongLetters() {
    const wrongLettersSpan = document.getElementById('wrong-letters-span');
    wrongLettersSpan.innerText = wrongLetters.join(', ');
}

function checkEndGame() {
    const allLettersRevealed = selectedMovieTitle.split(' ').every(word => {
        return word.split('').every(letter => {
            const normalizedLetter = normalizeText(letter);
            // Verifica se a letra foi adivinhada ou se é um caractere especial
            return correctLetters.includes(normalizedLetter) || letter.match(/[!?,.:;'"&-]/);
        });
    });

    if (allLettersRevealed) {
        isGameActive = false; // O jogo termina
        displayMovieInfo(); // Exibe informações do filme
        setTimeout(() => alert('Parabéns! Você adivinhou o filme!'), 100);
    } else if (wrongLetters.length >= 6) { // Ajuste o limite de erros
        isGameActive = false; // O jogo termina
        setTimeout(() => alert(`Fim de jogo! O filme era: ${selectedMovieTitle}`), 100);
    }
}


function displayMovieInfo() {
    const movieCoverElement = document.getElementById('movie-cover');
    const movieApprovalElement = document.getElementById('movie-approval');
    movieCoverElement.src = selectedMovieCover;
    movieCoverElement.style.display = 'block';
    movieApprovalElement.innerText = `Avaliação: ${selectedMovieRating}`;
    movieApprovalElement.style.display = 'block';
}

function resetGame() {
    correctLetters = [];
    wrongLetters = [];
    getRandomMovie();
    document.getElementById('wrong-letters-span').innerText = '';
    updateErrorImage();
    const movieCoverElement = document.getElementById('movie-cover');
    const movieApprovalElement = document.getElementById('movie-approval');
    movieCoverElement.src = '';
    movieCoverElement.style.display = 'none';
    movieApprovalElement.innerText = '';
    movieApprovalElement.style.display = 'none';
    isGameActive = true;
}

window.addEventListener('keydown', (e) => {
    const letter = e.key.toUpperCase();
    if (letter.match(/^[A-Z0-9]$/) && isGameActive) {
        handleLetterInput(letter);
    }
});

function generateLetterButtons() {
    const letterButtonsContainer = document.getElementById('letter-buttons');
    letterButtonsContainer.innerHTML = '';
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    alphabet.split('').forEach(letter => {
        const button = document.createElement('button');
        button.innerText = letter;
        button.addEventListener('click', () => {
            if (isGameActive) {
                handleLetterInput(letter);
            }
        });
        letterButtonsContainer.appendChild(button);
    });
}

getRandomMovie();
generateLetterButtons();
document.getElementById('reset-button').addEventListener('click', resetGame);

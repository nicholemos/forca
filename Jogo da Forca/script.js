const apiKey = 'f3853edb736e04c1a9cb685d8a8951d0';
const apiUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=pt-BR&page=1`;

let selectedMovieTitle;
let selectedMovieCover; // Variável para armazenar a capa do filme
let selectedMovieRating; // Variável para armazenar a avaliação do filme
let wrongLetters = [];
let correctLetters = [];
let isGameActive = true;

// Função para pegar um filme aleatório
async function getRandomMovie() {
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const movies = data.results;
        const randomMovie = movies[Math.floor(Math.random() * movies.length)];
        selectedMovieTitle = randomMovie.title.toUpperCase();
        selectedMovieCover = `https://image.tmdb.org/t/p/w500${randomMovie.poster_path}`; // Capa do filme
        selectedMovieRating = randomMovie.vote_average; // Avaliação do filme
        correctLetters = [];
        wrongLetters = [];
        isGameActive = true; // O jogo começa ativo
        displayWord();
        updateWrongLetters();
    } catch (error) {
        console.error('Erro ao buscar filme:', error);
    }
}

// Adiciona uma função para remover pontuações do título na verificação
function sanitizeTitle(title) {
    return title.replace(/[!?,.:;'"-]/g, ''); // Remove pontuações da verificação
}

// Função para normalizar letras (remover acentos e tratar letras de forma simplificada)
function normalizeText(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove os acentos
}

// Função para exibir a palavra com traços e manter espaços corretamente, além das pontuações
function displayWord() {
    const wordElement = document.getElementById('word');
    wordElement.innerHTML = selectedMovieTitle
        .split(' ') // Dividimos por espaço para lidar com cada palavra separadamente
        .map(word => {
            return word.split('').map(letter => {
                // Mostra automaticamente as pontuações, espaços e o caractere "&"
                if (letter.match(/[!?,.:;'"&-]/)) {
                    return letter; // Mostra a pontuação automaticamente
                } else {
                    return correctLetters.includes(normalizeText(letter)) ? letter : '_';
                }
            }).join(''); // Junta as letras da palavra
        })
        .join(' '); // Junta as palavras com um espaço
}



function updateErrorImage() {
    const errorImage = document.getElementById('error-image');
    const errorCount = Math.min(wrongLetters.length, 6);
    errorImage.src = `${errorCount}erro.png`;
}

// Função para verificar se o jogador digitou a letra corretamente
function handleLetterInput(letter) {
    const normalizedLetter = normalizeText(letter);
    const sanitizedTitle = normalizeText(sanitizeTitle(selectedMovieTitle));

    if (correctLetters.includes(normalizedLetter) || wrongLetters.includes(normalizedLetter)) {
        return; // Se a letra já foi usada, ignoramos
    }

    if (sanitizedTitle.includes(normalizedLetter)) {
        correctLetters.push(normalizedLetter);
    } else {
        wrongLetters.push(normalizedLetter);
    }

    displayWord();
    updateWrongLetters();
    updateErrorImage(); // Isso deve ser chamado após a atualização das letras

    checkEndGame(); // Chama para verificar se o jogo acabou
}


// Função para atualizar as letras erradas na tela
function updateWrongLetters() {
    const wrongLettersSpan = document.getElementById('wrong-letters-span');
    wrongLettersSpan.innerText = wrongLetters.join(', ');
}

// Função para verificar se o jogo acabou
function checkEndGame() {
    const wordWithoutSpaces = selectedMovieTitle.replace(/\s/g, ''); // Remove espaços da palavra do filme
    const revealedWord = wordWithoutSpaces
        .split('')
        .every(letter => correctLetters.includes(letter));

    if (revealedWord) {
        isGameActive = false; // O jogo termina
        displayMovieInfo(); // Exibe informações do filme
        setTimeout(() => alert('Parabéns! Você adivinhou o filme!'), 100);
        return; // Adiciona um retorno para evitar a execução de código adicional
    } else if (wrongLetters.length >= 6) { // Você pode ajustar o limite de erros
        isGameActive = false; // O jogo termina
        setTimeout(() => alert(`Fim de jogo! O filme era: ${selectedMovieTitle}`), 100);
        return; // Adiciona um retorno para evitar a execução de código adicional
    }
}


// Função para exibir a capa do filme e a avaliação ao vencer
function displayMovieInfo() {
    const movieCoverElement = document.getElementById('movie-cover');
    const movieApprovalElement = document.getElementById('movie-approval');

    movieCoverElement.src = selectedMovieCover; // Define a capa do filme
    movieCoverElement.style.display = 'block'; // Mostra a imagem
    movieApprovalElement.innerText = `Avaliação: ${selectedMovieRating}`; // Define a avaliação do filme
    movieApprovalElement.style.display = 'block'; // Mostra a avaliação
}

// Função para resetar o jogo
function resetGame() {
    correctLetters = [];
    wrongLetters = [];
    getRandomMovie();
    document.getElementById('wrong-letters-span').innerText = '';
    updateErrorImage(); // Reseta a imagem de erro para "0erro.png"

    // Limpa a capa do filme e a avaliação
    const movieCoverElement = document.getElementById('movie-cover');
    const movieApprovalElement = document.getElementById('movie-approval');
    movieCoverElement.src = ''; // Limpa a imagem da capa
    movieCoverElement.style.display = 'none'; // Esconde a imagem
    movieApprovalElement.innerText = ''; // Limpa a avaliação
    movieApprovalElement.style.display = 'none'; // Esconde a avaliação

    // Reinicia o status do jogo
    isGameActive = true; // O jogo começa ativo
}


// Modifica para capturar letras e números
window.addEventListener('keydown', (e) => {
    const letter = e.key.toUpperCase();
    if (letter.match(/^[A-Z0-9]$/) && isGameActive) { // Verifica se o jogo está ativo
        handleLetterInput(letter);
    }
});

// Função para gerar botões de letras e números
function generateLetterButtons() {
    const letterButtonsContainer = document.getElementById('letter-buttons');
    letterButtonsContainer.innerHTML = '';
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; // Inclui letras e números

    alphabet.split('').forEach(letter => {
        const button = document.createElement('button');
        button.innerText = letter;
        button.addEventListener('click', () => {
            if (isGameActive) { // Verifica se o jogo está ativo
                handleLetterInput(letter);
            }
        });
        letterButtonsContainer.appendChild(button);
    });
}

// Inicializa o jogo
getRandomMovie();
generateLetterButtons();

document.getElementById('reset-button').addEventListener('click', resetGame);

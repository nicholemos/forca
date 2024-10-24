const apiKey = 'f3853edb736e04c1a9cb685d8a8951d0';
const minPage = 1;
const maxPage = 300; // Defina o número máximo de páginas
let selectedMovieTitle;
let selectedMovieCover;
let selectedMovieRating;
let wrongLetters = [];
let correctLetters = [];
let isGameActive = true;

async function getRandomMovie() {
    try {
        let validMovieFound = false;
        let randomMovie;

        // Continua procurando até encontrar um título de filme válido
        while (!validMovieFound) {
            const randomPage = Math.floor(Math.random() * (maxPage - minPage + 1)) + minPage;
            const apiUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=pt-BR&page=${randomPage}`;
            const response = await fetch(apiUrl);

            if (!response.ok) throw new Error('Erro na resposta da API');

            const data = await response.json();
            if (!data.results.length) throw new Error('Nenhum filme encontrado');

            // Escolhe um filme aleatório da lista
            randomMovie = data.results[Math.floor(Math.random() * data.results.length)];
            const movieTitle = randomMovie.title.toUpperCase();

            // Verifica se o título contém apenas caracteres válidos (letras A-Z, K, W, Y, números, espaços e caracteres especiais)
            if (/^[A-Z0-9KWY\s!?,.:;'"&-]+$/.test(movieTitle)) {
                validMovieFound = true;
                selectedMovieTitle = movieTitle;
                selectedMovieCover = `https://image.tmdb.org/t/p/w500${randomMovie.poster_path}`;
                selectedMovieRating = randomMovie.vote_average;
            }
        }

        // Após encontrar um filme válido, inicializa o jogo
        resetGame();
        displayWord();
    } catch (error) {
        console.error('Erro ao buscar filme:', error);
        alert('Não foi possível carregar os dados do filme. Por favor, tente novamente mais tarde.');
    }
}



function normalizeText(text) {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')  // Remove acentos
        .replace(/[^A-Z0-9KWY\s!?,.:;'"&-]/gi, '')  // Mantém letras A-Z, K, W, Y, números e caracteres especiais
        .toUpperCase();  // Converte para maiúsculas
}



function displayWord(isGameLost = false) {
    const wordElement = document.getElementById('word');
    wordElement.innerHTML = selectedMovieTitle
        .split(' ')
        .map(word => {
            return word.split('').map(letter => {
                const normalizedLetter = normalizeText(letter);

                if (letter.match(/[!?,.:;'"&-]/)) {
                    return letter; // Mantém os caracteres especiais
                } else if (correctLetters.includes(normalizedLetter)) {
                    return `<span>${letter}</span>`; // Letras adivinhadas corretamente
                } else if (isGameLost) {
                    return `<span style="color:red">${letter}</span>`; // Letras erradas ficam vermelhas após o fim do jogo
                } else {
                    return '_'; // Exibe sublinhado se a letra ainda não foi adivinhada
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

function handleLetterInput(letter) {
    // Normaliza a letra antes de verificar
    const normalizedLetter = normalizeText(letter);
    const sanitizedTitle = normalizeText(selectedMovieTitle);

    // Verifica se a letra ou número já foi usado
    if (correctLetters.includes(normalizedLetter) || wrongLetters.includes(normalizedLetter)) {
        return; // Ignora se já foi usado
    }

    // Verifica se a letra ou número faz parte do título
    if (sanitizedTitle.includes(normalizedLetter) || selectedMovieTitle.includes(letter)) {
        correctLetters.push(normalizedLetter); // Adiciona a letra ou número correto
    } else {
        wrongLetters.push(normalizedLetter); // Adiciona à lista de erros
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
            return correctLetters.includes(normalizedLetter) || letter.match(/[!?,.:;'"&-]/);
        });
    });

    if (allLettersRevealed) {
        isGameActive = false; // O jogo termina por vitória
        displayMovieInfo(); // Exibe informações do filme
        setTimeout(() => alert('Parabéns! Você adivinhou o filme!'), 100);
    } else if (wrongLetters.length >= 6) { // Se o jogador errou 6 vezes
        isGameActive = false; // O jogo termina por derrota
        displayWord(true); // Preenche as letras faltantes e destaca em vermelho
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
    displayWord();
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
    console.log(e); // Log do evento para verificação
    let letter = e.key.toUpperCase();

    // Captura números do teclado numérico e do teclado padrão
    if (e.code.startsWith('Numpad')) {
        letter = e.key; // Para números do teclado numérico
    }

    // Verifica se a tecla pressionada é uma letra ou número
    if (/^[A-Z0-9]$/.test(letter) && isGameActive) {
        handleLetterInput(letter);
    } else {
        console.log('Tecla inválida:', letter); // Log de tecla inválida para depuração
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

document.getElementById('reset-button').addEventListener('click', () => {
    resetGame();
    getRandomMovie(); // Busca um novo filme após o reset
});

generateLetterButtons();
getRandomMovie(); // Carrega um filme ao iniciar

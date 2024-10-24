const apiKey = 'f3853edb736e04c1a9cb685d8a8951d0';
const minPage = 1;
const maxPage = 300;
let selectedMovieTitle;
let selectedMovieCover;
let selectedMovieRating;
let wrongLetters = [];
let correctLetters = [];
let isGameActive = true;

document.getElementById('category-select').addEventListener('change', getRandomItem);

// Função para buscar um item aleatório com base na categoria selecionada
async function getRandomItem() {
    const category = document.getElementById('category-select').value;
    try {
        let validItemFound = false;
        let randomItem;

        while (!validItemFound) {
            const randomPage = Math.floor(Math.random() * (maxPage - minPage + 1)) + minPage;
            let apiUrl;

            // Configura a URL da API com base na categoria escolhida
            if (category === 'filmes') {
                apiUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=pt-BR&page=${randomPage}`;
            } else if (category === 'series') {
                apiUrl = `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&language=pt-BR&page=${randomPage}`;
            } else if (category === 'pessoas') {
                apiUrl = `https://api.themoviedb.org/3/person/popular?api_key=${apiKey}&language=pt-BR&page=${randomPage}`;
            }

            // Se a categoria não for "todos", busca somente um tipo
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Erro na resposta da API');

            const data = await response.json();
            if (!data.results.length) throw new Error('Nenhum item encontrado');

            // Filtra os itens para garantir que os títulos sejam válidos
            const validItems = data.results.filter(item => {
                const title = item.title || item.name;
                const normalizedTitle = normalizeText(title); // Normaliza o título
                return /^[A-Z0-9\s'.-]+$/u.test(normalizedTitle); // Verifica se o título contém apenas letras e espaços
            });

            if (validItems.length === 0) throw new Error('Nenhum item válido encontrado');

            randomItem = validItems[Math.floor(Math.random() * validItems.length)];
            selectedMovieTitle = randomItem.title || randomItem.name;

            // Verifica se randomItem tem a propriedade correta para a categoria
            if (category === 'pessoas') {
                if (randomItem.profile_path) {
                    selectedMovieCover = `https://image.tmdb.org/t/p/w500${randomItem.profile_path}`;
                } else {
                    selectedMovieCover = ''; // ou uma imagem padrão, se preferir
                }
            } else {
                if (randomItem.poster_path) {
                    selectedMovieCover = `https://image.tmdb.org/t/p/w500${randomItem.poster_path}`;
                } else {
                    selectedMovieCover = ''; // ou uma imagem padrão, se preferir
                }
            }

            selectedMovieRating = randomItem.vote_average;

            validItemFound = true;
        }

        resetGame();
        displayWord();
    } catch (error) {
        console.error('Erro ao buscar item:', error);
        alert('Não foi possível carregar os dados do item. Por favor, tente novamente mais tarde.');
    }
}

function normalizeText(text) {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')  // Remove acentos
        .replace(/[\u4E00-\u9FAF\uFF00-\uFFEF]/g, '') // Remove caracteres japoneses (kanji e katakana)
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
        setTimeout(() => alert('Parabéns! Você adivinhou!'), 100); // Alterar a mensagem
    } else if (wrongLetters.length >= 6) { // Se o jogador errou 6 vezes
        isGameActive = false; // O jogo termina por derrota
        displayWord(true); // Preenche as letras faltantes e destaca em vermelho
        displayMovieInfo(); // Exibe informações do filme na derrota
        setTimeout(() => alert(`Fim de jogo! Era: ${selectedMovieTitle}`), 100); // Alterar a mensagem
    }
}


function displayMovieInfo() {
    const movieCoverElement = document.getElementById('movie-cover');
    const movieApprovalElement = document.getElementById('movie-approval');
    movieCoverElement.src = selectedMovieCover;
    movieCoverElement.style.display = 'block';

    // Verifica se a categoria é 'pessoas'
    const category = document.getElementById('category-select').value;
    if (category === 'pessoas') {
        movieApprovalElement.style.display = 'none'; // Oculta a avaliação para pessoas
    } else {
        movieApprovalElement.innerText = `Avaliação: ${selectedMovieRating}`;
        movieApprovalElement.style.display = 'block';
    }
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
    getRandomItem(); // Busca um novo item após o reset
});

generateLetterButtons();


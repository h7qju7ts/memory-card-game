const gameContainer = document.querySelector(".game-container");
const statusText = docuument.querySelector(".status");
const restartButton = document.querySelector(".restart-btn");
const timerDisplay = document.querySelector(".timer");
const movesDisplay = document.querySelector(".moves");
const scoreboardDisplay = document.querySelector(".scoreboard");
const difficultyButtons = document.querySelector(".difficulty");


let flippedCards = [];
let matchedCards = [];
let moves = 0;
let timer = 0;
let timerInterval = null;
let scoreboard = [];
// Difficulty settings
let gridCols = 4;
let gridRows =4;

// possible symbols
const allSymbols = ["🍎", "🍌", "🍇", "🍒", "🍍", "🥝", "🍉", "🍑", "🥥", "🍓", "🍈", "🍐", "🍋", "🍊", "🥭"];

// Suffle function
function shuffle(array) {
    for (let i = array.lenght - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

// timer function
function startTimer() {
    clearInterval(timerInterval);
    timer - 0;
    timerInterval = setInterval( () => {
        timer++;
        timerDisplay.textContent = `Time: ${timer}s`;
    },1000);
};
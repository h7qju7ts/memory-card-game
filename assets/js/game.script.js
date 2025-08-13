// ===1 get all DOM elements we need ===
const gameContainer = document.querySelector(".game-container");     // where all the cards will be placed
const statusText = document.querySelector(".status");                // text telling player what is happening
const restartBtn = document.querySelector(".restart-btn");           // button to restart the curent game
const timerDisplay = document.querySelector(".timer");               // showes elapsed time
const movesDisplay = document.querySelector(".moves");               // showes how many moves the player has made
const scoreboardDisplay = document.querySelector(".scoreboard");     // showes the best scores from past games
const difficultyButtons = document.querySelectorAll(".difficulty");  // buttons to select difficulty


// ===2 Game state variables ===
let flippedCards = [];       //stores the two currently flipped cards so we can compare them
let matchedCards = [];       //stores all the cards that  have been matched allready
let moves = 0;               //number of mooves taken (two flips = one move) 
let timer = 0;               //time in seconds since the game started
let timerInterval = null;    //reference to setInterval() so we can stop it
let scoreboard = [];         //stores top scores {time, moves, grid}
// Difficulty settings
let gridCols = 4;            //how many coumns in the grid         
let gridRows = 4;            //how many rows in the grid


// === 3 All avaible symbols(emojis) for the cards ===
// list will be sliced dending on the selected difficulty
const allSymbols = ["🍎", "🍌", "🍇", "🍒", "🍍", "🥝", "🍉", "🍑", "🥥", "🍓", "🍈", "🍐", "🍋", "🍊", "🥭"];

// === 4 shuffle helper function ===
// uses Fisher-Yates shuffle to randomize the order of elements in an aray
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap positions
    }
};

// === 5 start the timer ===
function startTimer() {
    clearInterval(timerInterval); // Prevent multiple timers from running
    timer = 0;
    timerInterval = setInterval(() => {
        timer++;
        timerDisplay.textContent = `Time: ${timer}s`; // Update the display
    }, 1000); // Run every second
};

// === 6 calculate card size based on screen width ===
function calculateCardSize() {
    const containerWidth = gameContainer.clientWidth;
    const gap = 8; // Space between cards
    const rawSize = Math.floor((containerWidth - (gap * (gridCols - 1))) / gridCols);

    // Limit card size between 60px (tiny screens) and 120px (large screens)
    const cardSize = Math.max(60, Math.min(rawSize, 120));

    return {
        cardSize,
        fontSize: Math.floor(cardSize * 0.5)
    };
};

// === 7 create the game board ===
function createBoard() {
    // Calculate card size based on screen width and grid
    const { cardSize, fontSize } = calculateCardSize();
    gameContainer.style.gridTemplateColumns = `repeat(${gridCols}, ${cardSize}px)`;
    gameContainer.style.gap = "8px";

    gameContainer.innerHTML = ""; // Clear old cards

    let totalCards = gridCols * gridRows;
    let symbols = allSymbols.slice(0, totalCards / 2);
    let cardSet = [...symbols, ...symbols];
    shuffle(cardSet);

    cardSet.forEach(symbol => {
        const card = document.createElement("div");
        card.classList.add("card");
        card.style.width = `${cardSize}px`;
        card.style.height = `${cardSize}px`;

        card.innerHTML = `
            <div class="card-inner" style="width:${cardSize}px;height:${cardSize}px;">
                <div class="card-front" style="width:${cardSize}px;height:${cardSize}px;font-size:${fontSize}px;"></div>
                <div class="card-back" style="width:${cardSize}px;height:${cardSize}px;font-size:${fontSize}px;">${symbol}</div>
            </div>
        `;

        card.dataset.symbol = symbol;
        card.addEventListener("click", flipCard);
        gameContainer.appendChild(card);
    });

    matchedCards = [];
    flippedCards = [];
    moves = 0;
    movesDisplay.textContent = `Moves: ${moves}`;
    statusText.textContent = "Find all matching pairs!";
    startTimer();
}

// Auto-resize cards on window resize
window.addEventListener("resize", () => {
    createBoard();
});


// === 7 flip a card ===
function flipCard() {
    // Prevent flipping more than 2 or flipping the same/matched card
    if (flippedCards.length >= 2 || this.classList.contains("flipped") || this.classList.contains("matched")) {
        return;
    }

    // Show the card
    this.classList.add("flipped");
    flippedCards.push(this); // Add to flipped cards list

    // If two cards are flipped, check for a match
    if (flippedCards.length === 2) {
        moves++;
        movesDisplay.textContent = `Moves: ${moves}`;
        checkMatch();
    }
};

// === 8 check if the two flipped cards match ===
function checkMatch() {
    const [card1, card2] = flippedCards;

    if (card1.dataset.symbol === card2.dataset.symbol) {
        // Match found
        card1.classList.add("matched");
        card2.classList.add("matched");
        matchedCards.push(card1, card2);
        statusText.textContent = "You found a match!";

        // Check if the game is over
        if (matchedCards.length === gridCols * gridRows) {
            clearInterval(timerInterval);
            statusText.textContent = "🎉 You won!";
            saveScore(timer, moves);
            updateScoreboard();
        }
    } else {
        // Not a match: flip back after a short delay
        statusText.textContent = "Not a match!";
        setTimeout(() => {
            card1.classList.remove("flipped");
            card2.classList.remove("flipped");
        }, 800);
    }

    flippedCards = []; // Reset for the next turn
};

// === 9 save the score ===
function saveScore(time, moves) {
    scoreboard.push({ time, moves, grid: `${gridCols}x${gridRows}` });
    scoreboard.sort((a, b) => a.time - b.time || a.moves - b.moves); // Sort by best time, then moves
    if (scoreboard.length > 5) scoreboard.length = 5; // Keep only top 5
}


// === 10 update the scoreboard display ===
function updateScoreboard() {
    scoreboardDisplay.innerHTML = "<h3>Top Scores</h3>" +
        scoreboard.map((s, i) => `<div>${i + 1}. ${s.grid} - ${s.time}s, ${s.moves} moves</div>`).join("");
};


// === 11 difficulty selection ===
difficultyButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        gridCols = parseInt(btn.dataset.size); // Read size from button
        gridRows = 4; // Fixed rows
        createBoard(); // Start a new game with selected difficulty
    });
});

// === 12 restart the game ===
restartBtn.addEventListener("click", createBoard);


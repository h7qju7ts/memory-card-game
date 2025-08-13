// === 1 Get all DOM elements we need ===
// These store references to HTML elements so we can easily update them in the game.
const gameContainer = document.querySelector(".game-container"); // Main grid where cards will be placed
const statusText = document.querySelector(".status");            // Displays messages to the player (e.g., "You found a match!")
const restartBtn = document.querySelector(".restart-btn");       // Button to restart the game
const timerDisplay = document.querySelector(".timer");           // Shows elapsed time
const movesDisplay = document.querySelector(".moves");           // Shows the number of moves taken
const scoreboardDisplay = document.querySelector(".scoreboard"); // Displays best scores
const difficultyButtons = document.querySelectorAll(".difficulty"); // Buttons to set game difficulty

// === 2 Game state variables ===
// These keep track of the current game state.
let flippedCards = [];     // Holds the currently flipped cards (max 2 at a time)
let matchedCards = [];     // Stores all cards that have been successfully matched
let moves = 0;             // Number of moves made so far
let timer = 0;             // Elapsed time in seconds
let timerInterval = null;  // Stores the setInterval reference so we can stop/reset it
let scoreboard = [];       // Stores top scores as objects: {time, moves, grid}

// Difficulty settings (default: 4x4 grid)
let gridCols = 4;                // Default columns
let gridRows = 4;                // Default rows
let totalCards = gridCols * gridRows; // Total cards = columns × rows

// === 3 All available symbols (emojis) ===
// These are the images/symbols we can put on cards.
// For each game, we take only as many as needed for the chosen difficulty.
const allSymbols = ["🍎", "🍌", "🍇", "🍒", "🍍", "🥝", "🍉", "🍑", "🥥", "🍓", "🍈", "🍐", "🍋", "🍊", "🥭"];

// === 4 Shuffle helper ===
// Implements the Fisher–Yates shuffle algorithm to randomize an array in-place.
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); // Pick a random index
        [array[i], array[j]] = [array[j], array[i]];   // Swap the elements
    }
}

// === 5 Start the timer ===
// Resets and starts counting seconds, updating the timer display every second.
function startTimer() {
    clearInterval(timerInterval); // Make sure we don't run two timers
    timer = 0;                    // Reset time
    timerInterval = setInterval(() => {
        timer++; // Increase by one second
        timerDisplay.textContent = `Time: ${timer}s`; // Show new time
    }, 1000); // Run every 1 second
}

// === 6 Create the game board (auto-sizing) ===
// This function sets up the card grid based on available space and difficulty.
function createBoard() {
    const containerWidth = gameContainer.clientWidth;   // Available width
    const containerHeight = gameContainer.clientHeight; // Available height
    const gap = 8; // Space between cards in pixels

    // Start with a roughly square grid layout
    let localCols = Math.floor(Math.sqrt(totalCards));
    let localRows = Math.ceil(totalCards / localCols);
    let cardSize;

    let attempts = 0; // Prevent infinite loop

    // Dynamically adjust rows/columns to avoid horizontal/vertical overflow
    while (true) {
        attempts++;
        if (attempts > 50) break; // Emergency stop to prevent freezing

        let sizeByWidth = Math.floor((containerWidth - gap * (localCols - 1)) / localCols);
        let sizeByHeight = Math.floor((containerHeight - gap * (localRows - 1)) / localRows);
        cardSize = Math.min(sizeByWidth, sizeByHeight);

        // First priority → avoid horizontal overflow
        if (sizeByWidth * localCols + gap * (localCols - 1) > containerWidth) {
            localRows++;
            localCols = Math.ceil(totalCards / localRows);
        }
        // Second priority → avoid vertical overflow if possible
        else if (sizeByHeight < 50) {
            localCols++;
            localRows = Math.ceil(totalCards / localCols);
        }
        else {
            break; // Fits well enough
        }
    }

    // Save final calculated grid size for win detection
    gridCols = localCols;
    gridRows = localRows;

    const fontSize = Math.floor(cardSize * 0.5); // Emoji size based on card size

    // Apply CSS grid styles
    gameContainer.style.gridTemplateColumns = `repeat(${gridCols}, ${cardSize}px)`;
    gameContainer.style.gap = `${gap}px`;
    gameContainer.innerHTML = ""; // Clear old board

    // Select only needed symbols → duplicate them → shuffle
    let symbols = allSymbols.slice(0, totalCards / 2);
    let cardSet = [...symbols, ...symbols];
    shuffle(cardSet);

    // Create each card element
    cardSet.forEach(symbol => {
        const card = document.createElement("div");
        card.classList.add("card");
        card.style.width = `${cardSize}px`;
        card.style.height = `${cardSize}px`;

        // Inner HTML: front face (empty), back face (emoji)
        card.innerHTML = `
            <div class="card-inner" style="width:${cardSize}px;height:${cardSize}px;">
                <div class="card-front" style="width:${cardSize}px;height:${cardSize}px;font-size:${fontSize}px;"></div>
                <div class="card-back" style="width:${cardSize}px;height:${cardSize}px;font-size:${fontSize}px;">${symbol}</div>
            </div>
        `;

        card.dataset.symbol = symbol;          // Store symbol for matching check
        card.addEventListener("click", flipCard); // Add click handler
        gameContainer.appendChild(card);       // Add to the game grid
    });

    // Reset game state
    matchedCards = [];
    flippedCards = [];
    moves = 0;
    movesDisplay.textContent = `Moves: ${moves}`;
    statusText.textContent = "Find all matching pairs!";
    startTimer();
}

// === 7 Flip a card ===
// Handles when a player clicks a card.
function flipCard() {
    // Prevent flipping more than 2 cards or flipping matched/already flipped ones
    if (flippedCards.length >= 2 || this.classList.contains("flipped") || this.classList.contains("matched")) {
        return;
    }

    this.classList.add("flipped"); // Show the card
    flippedCards.push(this);       // Add to flipped list

    // If two cards are flipped → check for a match
    if (flippedCards.length === 2) {
        moves++;
        movesDisplay.textContent = `Moves: ${moves}`;
        checkMatch();
    }
}

// === 8 Check for a match ===
function checkMatch() {
    const [card1, card2] = flippedCards;

    if (card1.dataset.symbol === card2.dataset.symbol) {
        //  They match
        card1.classList.add("matched");
        card2.classList.add("matched");
        matchedCards.push(card1, card2);
        statusText.textContent = "You found a match!";

        // Win condition: all cards matched
        if (matchedCards.length === gridCols * gridRows) {
            clearInterval(timerInterval);
            statusText.textContent = "🎉 You won!";
            saveScore(timer, moves);
            updateScoreboard();
        }
    } else {
        //  Not a match → flip them back after delay
        statusText.textContent = "Not a match!";
        setTimeout(() => {
            card1.classList.remove("flipped");
            card2.classList.remove("flipped");
        }, 800);
    }

    flippedCards = []; // Reset flipped list
}

// === 9 Save the score ===
// Adds score to scoreboard and keeps only top 5 best scores.
function saveScore(time, moves) {
    scoreboard.push({ time, moves, grid: `${gridCols}x${gridRows}` });
    // Sort by time first, then moves
    scoreboard.sort((a, b) => a.time - b.time || a.moves - b.moves);
    if (scoreboard.length > 5) scoreboard.length = 5; // Keep only best 5
}

// === 10 Update scoreboard ===
// Renders the scoreboard in HTML
function updateScoreboard() {
    scoreboardDisplay.innerHTML = "<h3>Top Scores</h3>" +
        scoreboard.map((s, i) => `<div>${i + 1}. ${s.grid} - ${s.time}s, ${s.moves} moves</div>`).join("");
}

// === 11 Difficulty selection ===
// Changes total cards based on selected difficulty and rebuilds the board.
difficultyButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        totalCards = parseInt(btn.dataset.cards);
        createBoard();
    });
});

// Auto-resize board when window size changes
window.addEventListener("resize", createBoard);

// Create the first board on page load
createBoard();
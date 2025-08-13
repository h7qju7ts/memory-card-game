/***********************************************************
 * 1. DOM ELEMENT REFERENCES
 * These lines select key parts of the HTML so we can update
 * or interact with them in the game.
 ***********************************************************/
const gameContainer = document.querySelector(".game-container");
const statusText = document.querySelector(".status");
const restartBtn = document.querySelector(".restart-btn");
const timerDisplay = document.querySelector(".timer");
const movesDisplay = document.querySelector(".moves");
const scoreboardDisplay = document.querySelector(".scoreboard");
const difficultyButtons = document.querySelectorAll(".difficulty");

/***********************************************************
 * 2. GAME STATE VARIABLES
 * Variables here will keep track of the game’s internal state
 * such as flipped cards, matched pairs, moves, and timer.
 ***********************************************************/
let flippedCards = [];   // Cards currently turned over but not yet checked
let matchedCards = [];   // Cards already matched and locked
let moves = 0;           // Number of card flips the player has made
let timer = 0;           // Seconds elapsed since game start
let timerInterval = null;// Will store the timer setInterval reference
let scoreboard = [];     // Array to store best scores

// Default difficulty: 4x4 = 16 cards
let gridCols = 4;
let gridRows = 4;
let totalCards = gridCols * gridRows;

// Keep track of the last chosen difficulty for restarting
let lastDifficulty = { totalCards, gridCols, gridRows };

/***********************************************************
 * 3. CARD SYMBOLS
 * We use emojis for card faces. This list must contain at
 * least half as many unique symbols as the hardest difficulty.
 ***********************************************************/
const allSymbols = [
    "🍎", "🍌", "🍇", "🍒", "🍍",
    "🥝", "🍉", "🍑", "🥥", "🍓",
    "🍈", "🍐", "🍋", "🍊", "🥭"
];

/***********************************************************
 * 4. SHUFFLE FUNCTION
 * Fisher-Yates algorithm to randomize the order of items
 ***********************************************************/
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/***********************************************************
 * 5. TIMER START
 * Resets and starts a new timer every time a game begins.
 ***********************************************************/
function startTimer() {
    clearInterval(timerInterval); // Make sure no old timer runs
    timer = 0;
    timerDisplay.textContent = `Time: ${timer}s`;
    timerInterval = setInterval(() => {
        timer++;
        timerDisplay.textContent = `Time: ${timer}s`;
    }, 1000);
}

/***********************************************************
 * 6. CREATE GAME BOARD
 * Dynamically creates the grid and calculates card size so
 * the board fits any screen without overflow.
 ***********************************************************/
function createBoard() {
    const containerWidth = gameContainer.clientWidth;
    const containerHeight = gameContainer.clientHeight;
    const gap = 8; // space between cards in px

    // Start with a roughly square layout
    let localCols = Math.floor(Math.sqrt(totalCards));
    let localRows = Math.ceil(totalCards / localCols);
    let cardSize;
    let attempts = 0;

    // Adjust number of rows/columns until cards fit nicely
    while (true) {
        attempts++;
        if (attempts > 50) break; // safety break to avoid infinite loops

        let sizeByWidth = Math.floor((containerWidth - gap * (localCols - 1)) / localCols);
        let sizeByHeight = Math.floor((containerHeight - gap * (localRows - 1)) / localRows);
        cardSize = Math.min(sizeByWidth, sizeByHeight);

        // If too wide → add more rows
        if (sizeByWidth * localCols + gap * (localCols - 1) > containerWidth) {
            localRows++;
            localCols = Math.ceil(totalCards / localRows);
        }
        // If too short → add more columns
        else if (sizeByHeight < 50) {
            localCols++;
            localRows = Math.ceil(totalCards / localCols);
        }
        else {
            break; // Good fit found
        }
    }

    // Save the final grid size
    gridCols = localCols;
    gridRows = localRows;

    // Font size inside the cards
    const fontSize = Math.floor(cardSize * 0.5);

    // Apply CSS grid layout to the game container
    gameContainer.style.gridTemplateColumns = `repeat(${gridCols}, ${cardSize}px)`;
    gameContainer.style.gap = `${gap}px`;

    // Clear any old cards from the container
    gameContainer.innerHTML = "";

    // Get the symbols needed for this game
    let symbols = allSymbols.slice(0, totalCards / 2);
    let cardSet = [...symbols, ...symbols]; // duplicate to create pairs
    shuffle(cardSet);

    // Create each card and attach click event
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

    // Reset state variables for the new game
    matchedCards = [];
    flippedCards = [];
    moves = 0;
    movesDisplay.textContent = `Moves: ${moves}`;
    statusText.textContent = "Find all matching pairs!";

    // Start the timer
    startTimer();
}

/***********************************************************
 * 7. FLIP CARD
 * Handles the logic when a player clicks a card.
 ***********************************************************/
function flipCard() {
    // Block flipping if:
    // - Already 2 cards are flipped
    // - This card is already flipped or matched
    if (flippedCards.length >= 2 || this.classList.contains("flipped") || this.classList.contains("matched")) {
        return;
    }

    this.classList.add("flipped");
    flippedCards.push(this);

    // If two cards are flipped, check for a match
    if (flippedCards.length === 2) {
        moves++;
        movesDisplay.textContent = `Moves: ${moves}`;
        checkMatch();
    }
}

/***********************************************************
 * 8. CHECK MATCH
 * Compares two flipped cards and decides if they match.
 ***********************************************************/
function checkMatch() {
    const [card1, card2] = flippedCards;

    if (card1.dataset.symbol === card2.dataset.symbol) {
        // Cards match → lock them as matched
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
        // No match → flip them back after delay
        statusText.textContent = "Not a match!";
        setTimeout(() => {
            card1.classList.remove("flipped");
            card2.classList.remove("flipped");
        }, 800);
    }

    flippedCards = [];
}

/***********************************************************
 * 9. SAVE SCORE
 * Stores player’s result and keeps only the top 5.
 ***********************************************************/
function saveScore(time, moves) {
    scoreboard.push({ time, moves, grid: `${gridCols}x${gridRows}` });
    scoreboard.sort((a, b) => a.time - b.time || a.moves - b.moves);
    if (scoreboard.length > 5) scoreboard.length = 5;
}

/***********************************************************
 * 10. UPDATE SCOREBOARD DISPLAY
 ***********************************************************/
function updateScoreboard() {
    scoreboardDisplay.innerHTML = "<h3>Top Scores</h3>" +
        scoreboard.map((s, i) => `<div>${i + 1}. ${s.grid} - ${s.time}s, ${s.moves} moves</div>`).join("");
}

/***********************************************************
 * 11. DIFFICULTY BUTTON CLICK HANDLER
 ***********************************************************/
difficultyButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        totalCards = parseInt(btn.dataset.cards);
        gridCols = Math.sqrt(totalCards);
        gridRows = totalCards / gridCols;

        // Save difficulty so Restart knows what to use
        lastDifficulty = { totalCards, gridCols, gridRows };
        createBoard();
    });
});

/***********************************************************
 * 12. RESTART BUTTON
 * Uses lastDifficulty to restart with same settings.
 ***********************************************************/
restartBtn.addEventListener("click", () => {
    totalCards = lastDifficulty.totalCards;
    gridCols = lastDifficulty.gridCols;
    gridRows = lastDifficulty.gridRows;
    createBoard();
});

/***********************************************************
 * 13. RESPONSIVE RESIZE
 * Rebuilds board when window size changes.
 ***********************************************************/
window.addEventListener("resize", createBoard);

/***********************************************************
 * 14. INITIAL GAME START
 * Creates the first board automatically on page load.
 ***********************************************************/
lastDifficulty = { totalCards, gridCols, gridRows };
createBoard();

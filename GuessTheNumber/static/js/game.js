/**
 * Guess the Number - Game Logic
 * 
 * Principles Applied:
 * - Explicit is better than implicit (defensive programming)
 * - Simple is better than complex (linear logic)
 * - Readability counts (clear naming)
 */

(function() {
    'use strict';

    // ==========================================================================
    // Game State
    // ==========================================================================
    const GameState = {
        targetNumber: null,
        attempts: 0,
        bestScore: null,
        isGameOver: false,
        MIN_NUMBER: 1,
        MAX_NUMBER: 100
    };

    // ==========================================================================
    // Audio Context for Sound Effects
    // ==========================================================================
    let audioContext = null;

    /**
     * Initialize audio context (must be triggered by user interaction)
     */
    function initAudio() {
        if (audioContext === null) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (error) {
                console.warn('Web Audio API not supported:', error.message);
            }
        }
    }

    /**
     * Play a tone with specified frequency and type
     * @param {number} frequency - Frequency in Hz
     * @param {string} type - Oscillator type (sine, square, triangle, sawtooth)
     * @param {number} duration - Duration in seconds
     * @param {number} volume - Volume (0 to 1)
     */
    function playTone(frequency, type, duration, volume) {
        if (!audioContext) return;

        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

            // Envelope: fade in and fade out
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (error) {
            console.warn('Error playing sound:', error.message);
        }
    }

    /**
     * Play wrong guess sound (low buzz)
     */
    function playWrongSound() {
        initAudio();
        playTone(200, 'square', 0.15, 0.3);
        setTimeout(function() {
            playTone(150, 'square', 0.2, 0.3);
        }, 100);
    }

    /**
     * Play winner sound (triumphant fanfare)
     */
    function playWinnerSound() {
        initAudio();
        // Ascending triumphant notes
        const notes = [
            { freq: 523, delay: 0 },      // C5
            { freq: 659, delay: 150 },    // E5
            { freq: 784, delay: 300 },    // G5
            { freq: 1047, delay: 450 }    // C6
        ];

        notes.forEach(function(note) {
            setTimeout(function() {
                playTone(note.freq, 'sine', 0.3, 0.4);
            }, note.delay);
        });

        // Final chord
        setTimeout(function() {
            playTone(523, 'sine', 0.6, 0.3);  // C5
            playTone(659, 'sine', 0.6, 0.3);  // E5
            playTone(784, 'sine', 0.6, 0.3);  // G5
        }, 600);
    }

    // ==========================================================================
    // DOM Elements - Cached for Performance
    // ==========================================================================
    const DOM = {
        guessInput: null,
        guessBtn: null,
        feedbackMessage: null,
        attemptsCount: null,
        bestScore: null,
        newGameBtn: null,
        celebrationContainer: null
    };

    // ==========================================================================
    // Initialization
    // ==========================================================================
    
    /**
     * Initialize the game when DOM is ready
     * Defensive: Check if DOM is already loaded
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', onDOMReady);
        } else {
            onDOMReady();
        }
    }

    /**
     * DOM Ready Handler
     * Defensive: Validate all DOM elements exist before proceeding
     */
    function onDOMReady() {
        if (!cacheDOMElements()) {
            console.error('Game initialization failed: Required DOM elements not found.');
            return;
        }

        loadBestScore();
        bindEvents();
        startNewGame();
    }

    /**
     * Cache DOM elements
     * Defensive: Returns false if any required element is missing
     * @returns {boolean} - Success status
     */
    function cacheDOMElements() {
        DOM.guessInput = document.getElementById('guess-input');
        DOM.guessBtn = document.getElementById('guess-btn');
        DOM.feedbackMessage = document.getElementById('feedback-message');
        DOM.attemptsCount = document.getElementById('attempts-count');
        DOM.bestScore = document.getElementById('best-score');
        DOM.newGameBtn = document.getElementById('new-game-btn');
        DOM.celebrationContainer = document.getElementById('celebration-container');

        // Explicit validation of all required elements
        const requiredElements = ['guessInput', 'guessBtn', 'feedbackMessage', 'attemptsCount', 'bestScore', 'newGameBtn'];
        
        for (const elementName of requiredElements) {
            if (DOM[elementName] === null) {
                console.error(`Required element missing: ${elementName}`);
                return false;
            }
        }

        return true;
    }

    /**
     * Bind event listeners
     * Defensive: Use specific event handlers, not inline functions
     */
    function bindEvents() {
        DOM.guessBtn.addEventListener('click', handleGuess);
        DOM.newGameBtn.addEventListener('click', startNewGame);
        DOM.guessInput.addEventListener('keypress', handleKeyPress);
        DOM.guessInput.addEventListener('input', sanitizeInput);
    }

    // ==========================================================================
    // Game Logic
    // ==========================================================================

    /**
     * Start a new game
     * Simple: Reset state and generate new target
     */
    function startNewGame() {
        GameState.targetNumber = generateRandomNumber(GameState.MIN_NUMBER, GameState.MAX_NUMBER);
        GameState.attempts = 0;
        GameState.isGameOver = false;

        // Reset UI
        updateAttemptsDisplay();
        clearFeedback();
        clearCelebration();
        enableInput();
        DOM.guessInput.value = '';
        DOM.guessInput.focus();
    }

    /**
     * Generate random number within range (inclusive)
     * Explicit: Clear parameter names and bounds
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} - Random integer
     */
    function generateRandomNumber(min, max) {
        // Defensive: Ensure valid range
        if (typeof min !== 'number' || typeof max !== 'number') {
            console.error('Invalid range parameters');
            return 50; // Fallback
        }
        
        if (min > max) {
            [min, max] = [max, min]; // Swap if reversed
        }

        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Handle guess submission
     * Explicit: Validate input before processing
     */
    function handleGuess() {
        if (GameState.isGameOver) {
            return;
        }

        const guess = parseGuess(DOM.guessInput.value);

        // Defensive: Validate guess
        if (guess === null) {
            showFeedback('Please enter a valid number (1-100)', 'error');
            return;
        }

        if (!isValidGuess(guess)) {
            showFeedback(`Number must be between ${GameState.MIN_NUMBER} and ${GameState.MAX_NUMBER}`, 'error');
            return;
        }

        // Process valid guess
        GameState.attempts++;
        updateAttemptsDisplay();
        evaluateGuess(guess);
        
        // Clear input for next guess
        DOM.guessInput.value = '';
        DOM.guessInput.focus();
    }

    /**
     * Parse user input to integer
     * Defensive: Returns null for invalid input instead of NaN
     * @param {string} inputValue - Raw input value
     * @returns {number|null} - Parsed integer or null
     */
    function parseGuess(inputValue) {
        // Defensive: Handle empty or whitespace-only input
        if (typeof inputValue !== 'string' || inputValue.trim() === '') {
            return null;
        }

        const parsed = parseInt(inputValue, 10);

        // Explicit: Check for NaN
        if (Number.isNaN(parsed)) {
            return null;
        }

        return parsed;
    }

    /**
     * Validate guess is within allowed range
     * Simple: Clear boolean logic
     * @param {number} guess - The guessed number
     * @returns {boolean} - Is valid
     */
    function isValidGuess(guess) {
        return guess >= GameState.MIN_NUMBER && guess <= GameState.MAX_NUMBER;
    }

    /**
     * Evaluate the guess against target
     * Readable: Logic reads like English
     * @param {number} guess - The guessed number
     */
    function evaluateGuess(guess) {
        if (guess < GameState.targetNumber) {
            showFeedback('Too low. Try higher!', 'too-low');
            playWrongSound();
        } else if (guess > GameState.targetNumber) {
            showFeedback('Too high. Try lower!', 'too-high');
            playWrongSound();
        } else {
            handleWin();
        }
    }

    /**
     * Handle winning condition
     * Simple: Linear win logic
     */
    function handleWin() {
        GameState.isGameOver = true;
        
        const message = `Correct! You won in ${GameState.attempts} ${GameState.attempts === 1 ? 'attempt' : 'attempts'}!`;
        showFeedback(message, 'correct');
        
        // Play winner sound
        playWinnerSound();
        
        updateBestScore();
        disableInput();
        
        // Trigger celebration animation
        triggerCelebration();
        
        // Save to backend (fire and forget - non-blocking)
        saveGameResult();
    }

    // ==========================================================================
    // Celebration Animation (Fireworks + Confetti)
    // ==========================================================================

    /**
     * RGB colors for celebration particles
     */
    const CELEBRATION_COLORS = [
        'rgb(231, 76, 60)',    // Red
        'rgb(243, 156, 18)',   // Orange
        'rgb(241, 196, 15)',   // Yellow
        'rgb(39, 174, 96)',    // Green
        'rgb(41, 128, 185)',   // Blue
        'rgb(142, 68, 173)',   // Purple
        'rgb(255, 105, 180)',  // Pink
        'rgb(0, 206, 209)'     // Cyan
    ];

    /**
     * Trigger the celebration animation
     * Creates fireworks and confetti that disappear after 10 seconds
     */
    function triggerCelebration() {
        if (!DOM.celebrationContainer) {
            console.warn('Celebration container not found');
            return;
        }

        // Activate the container
        DOM.celebrationContainer.classList.add('active');

        // Create multiple firework bursts
        createFireworkShow();

        // Create confetti shower
        createConfettiShower();

        // Clean up after 10 seconds
        setTimeout(function() {
            clearCelebration();
        }, 10000);
    }

    /**
     * Create a firework show with multiple bursts
     */
    function createFireworkShow() {
        // Initial burst
        createFireworkBurst(window.innerWidth * 0.3, window.innerHeight * 0.4);
        createFireworkBurst(window.innerWidth * 0.7, window.innerHeight * 0.3);

        // Delayed bursts
        setTimeout(function() {
            createFireworkBurst(window.innerWidth * 0.5, window.innerHeight * 0.35);
        }, 300);

        setTimeout(function() {
            createFireworkBurst(window.innerWidth * 0.2, window.innerHeight * 0.5);
            createFireworkBurst(window.innerWidth * 0.8, window.innerHeight * 0.45);
        }, 600);

        setTimeout(function() {
            createFireworkBurst(window.innerWidth * 0.4, window.innerHeight * 0.3);
            createFireworkBurst(window.innerWidth * 0.6, window.innerHeight * 0.4);
        }, 1000);

        // Additional bursts throughout
        setTimeout(function() {
            createFireworkBurst(window.innerWidth * 0.25, window.innerHeight * 0.35);
        }, 1500);

        setTimeout(function() {
            createFireworkBurst(window.innerWidth * 0.75, window.innerHeight * 0.3);
        }, 2000);
    }

    /**
     * Create a single firework burst at specified position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    function createFireworkBurst(x, y) {
        if (!DOM.celebrationContainer) return;

        // Create center flash
        const flash = document.createElement('div');
        flash.className = 'firework-burst';
        flash.style.left = (x - 10) + 'px';
        flash.style.top = (y - 10) + 'px';
        DOM.celebrationContainer.appendChild(flash);

        // Create particles exploding outward
        const particleCount = 30;
        const burstColor = CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)];

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'firework';

            // Random color (mostly burst color, some random)
            const color = Math.random() > 0.3 ? burstColor : CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)];
            particle.style.backgroundColor = color;

            // Position at burst center
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';

            // Calculate explosion direction (radial)
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = 80 + Math.random() * 80;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;

            // Set CSS variables for animation
            particle.style.setProperty('--tx', tx + 'px');
            particle.style.setProperty('--ty', ty + 'px');

            // Apply animation
            particle.style.animation = 'firework-explode 1.5s ease-out forwards';
            particle.style.animationDelay = (Math.random() * 0.1) + 's';

            DOM.celebrationContainer.appendChild(particle);
        }

        // Remove flash after animation
        setTimeout(function() {
            if (flash.parentNode) {
                flash.parentNode.removeChild(flash);
            }
        }, 300);
    }

    /**
     * Create confetti shower across the screen
     */
    function createConfettiShower() {
        if (!DOM.celebrationContainer) return;

        const confettiCount = 100;
        const shapes = ['square', 'circle', 'ribbon'];

        for (let i = 0; i < confettiCount; i++) {
            setTimeout(function() {
                createConfettiPiece(shapes);
            }, i * 50); // Stagger confetti creation
        }

        // Second wave
        setTimeout(function() {
            for (let i = 0; i < 50; i++) {
                setTimeout(function() {
                    createConfettiPiece(shapes);
                }, i * 60);
            }
        }, 2000);
    }

    /**
     * Create a single confetti piece
     * @param {string[]} shapes - Available shapes
     */
    function createConfettiPiece(shapes) {
        if (!DOM.celebrationContainer) return;

        const confetti = document.createElement('div');
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        confetti.className = 'confetti ' + shape;

        // Random color
        const color = CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)];
        confetti.style.backgroundColor = color;

        // Random horizontal position
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-20px';

        // Random size variation
        const scale = 0.5 + Math.random() * 1;
        confetti.style.transform = 'scale(' + scale + ')';

        // Apply animation with random duration and sway
        const duration = 3 + Math.random() * 4;
        const swayAmount = -50 + Math.random() * 100;
        confetti.style.animation = 'confetti-fall ' + duration + 's ease-out forwards';
        confetti.style.marginLeft = swayAmount + 'px';

        DOM.celebrationContainer.appendChild(confetti);

        // Remove after animation
        setTimeout(function() {
            if (confetti.parentNode) {
                confetti.parentNode.removeChild(confetti);
            }
        }, duration * 1000);
    }

    /**
     * Clear all celebration elements
     */
    function clearCelebration() {
        if (!DOM.celebrationContainer) return;

        // Fade out remaining particles
        DOM.celebrationContainer.classList.remove('active');
        
        // Remove all child elements
        while (DOM.celebrationContainer.firstChild) {
            DOM.celebrationContainer.removeChild(DOM.celebrationContainer.firstChild);
        }
    }

    // ==========================================================================
    // UI Updates
    // ==========================================================================

    /**
     * Show feedback message with appropriate styling
     * @param {string} message - Feedback text
     * @param {string} type - CSS class for styling
     */
    function showFeedback(message, type) {
        DOM.feedbackMessage.textContent = message;
        DOM.feedbackMessage.className = `feedback ${type}`;
    }

    /**
     * Clear feedback message
     */
    function clearFeedback() {
        DOM.feedbackMessage.textContent = '';
        DOM.feedbackMessage.className = 'feedback';
    }

    /**
     * Update attempts counter display
     */
    function updateAttemptsDisplay() {
        DOM.attemptsCount.textContent = GameState.attempts;
    }

    /**
     * Update best score display and storage
     */
    function updateBestScore() {
        if (GameState.bestScore === null || GameState.attempts < GameState.bestScore) {
            GameState.bestScore = GameState.attempts;
            DOM.bestScore.textContent = GameState.bestScore;
            saveBestScore();
        }
    }

    /**
     * Disable input during game over state
     */
    function disableInput() {
        DOM.guessInput.disabled = true;
        DOM.guessBtn.disabled = true;
    }

    /**
     * Enable input for active game
     */
    function enableInput() {
        DOM.guessInput.disabled = false;
        DOM.guessBtn.disabled = false;
    }

    // ==========================================================================
    // Event Handlers
    // ==========================================================================

    /**
     * Handle Enter key press
     * @param {KeyboardEvent} event - Keyboard event
     */
    function handleKeyPress(event) {
        if (event.key === 'Enter') {
            handleGuess();
        }
    }

    /**
     * Sanitize input to numbers only
     * Defensive: Prevent non-numeric input
     * @param {InputEvent} event - Input event
     */
    function sanitizeInput(event) {
        const input = event.target;
        // Remove any non-digit characters
        input.value = input.value.replace(/[^0-9]/g, '');
    }

    // ==========================================================================
    // Storage (Local)
    // ==========================================================================

    /**
     * Load best score from localStorage
     * Defensive: Handle storage errors gracefully
     */
    function loadBestScore() {
        try {
            const stored = localStorage.getItem('guessTheNumber_bestScore');
            
            if (stored !== null) {
                const parsed = parseInt(stored, 10);
                
                if (!Number.isNaN(parsed) && parsed > 0) {
                    GameState.bestScore = parsed;
                    DOM.bestScore.textContent = parsed;
                }
            }
        } catch (error) {
            // localStorage may be unavailable (private browsing, etc.)
            console.warn('localStorage unavailable:', error.message);
        }
    }

    /**
     * Save best score to localStorage
     * Defensive: Handle storage errors gracefully
     */
    function saveBestScore() {
        try {
            localStorage.setItem('guessTheNumber_bestScore', GameState.bestScore.toString());
        } catch (error) {
            console.warn('Failed to save best score:', error.message);
        }
    }

    // ==========================================================================
    // Backend Communication
    // ==========================================================================

    /**
     * Save game result to backend
     * Defensive: Non-blocking, with error handling
     */
    async function saveGameResult() {
        try {
            const response = await fetch('/api/game/result', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    attempts: GameState.attempts,
                    won: true,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
        } catch (error) {
            // Log but don't disrupt user experience
            console.warn('Failed to save game result:', error.message);
        }
    }

    // ==========================================================================
    // Start the Game
    // ==========================================================================
    init();

})();

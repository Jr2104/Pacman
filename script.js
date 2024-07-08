const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

const gridSize = 16; // Tamaño de cuadrícula original de Pac-Man
const velocity = 1.6; // Velocidad de movimiento
const deltaTime = 1000 / 60; // Delta de tiempo para el bucle del juego

let pacman = {
    x: gridSize * 13,
    y: gridSize * 23,
    dx: 0,
    dy: 0,
    size: gridSize,
    color: 'yellow',
    speed: velocity * 2, // Velocidad de Pac-Man
    lives: 3,
    score: 0,
    vulnerable: false, // Estado de vulnerabilidad
    vulnerableTime: 0, // Tiempo restante de vulnerabilidad
    vulnerableDuration: 10000, // Duración de la vulnerabilidad en milisegundos
    direction: 'left' // Dirección inicial de Pac-Man
};

let ghosts = [
    { x: gridSize * 13, y: gridSize * 11, dx: 0, dy: 0, size: gridSize, color: 'red', state: 'scatter', scatterTarget: { x: gridSize, y: gridSize } },
    { x: gridSize * 13, y: gridSize * 13, dx: 0, dy: 0, size: gridSize, color: 'pink', state: 'scatter', scatterTarget: { x: 27 * gridSize, y: gridSize } },
    { x: gridSize * 11, y: gridSize * 13, dx: 0, dy: 0, size: gridSize, color: 'cyan', state: 'scatter', scatterTarget: { x: gridSize, y: 27 * gridSize } },
    { x: gridSize * 15, y: gridSize * 13, dx: 0, dy: 0, size: gridSize, color: 'orange', state: 'scatter', scatterTarget: { x: 27 * gridSize, y: 27 * gridSize } }
];

let pellets = [];
let powerPellets = [];
let walls = [];

let gameStarted = false;
let gameOver = false;
let gamePaused = false;
let levelCompleted = false;

const levelData = [
    '####################',
    '#..................#',
    '#.####.#####.####.#',
    '#o####.#####.####o#',
    '#.####.#####.####.#',
    '#..................#',
    '#.####.#.##.#.####.#',
    '#.####.#.##.#.####.#',
    '#......##..##......#',
    '######.#..#.######',
    '     #.#..#. #',
    '     #.#..#. #',
    '######.###.######',
    '     #.#..#. #',
    '     #.#..#. #',
    '######.#..#.######',
    '#.................#',
    '#.####.#.#.####.#',
    '#o..##..#..##..o#',
    '###.#.#####.#.###',
    '   #.#.....#. #',
    '   #.#.###.#. #',
    '   #..... .....#',
    '   ###########'
];

const pelletValue = 10;
const powerPelletValue = 50;

// Función para inicializar el juego
function initGame() {
    // Crear laberinto
    buildLevel(levelData);

    // Inicializar puntos y pastillas
    createPellets();
    createPowerPellets();

    // Reiniciar posición inicial de Pac-Man y fantasmas
    resetEntities();

    // Agregar evento de teclado para controlar a Pac-Man
    document.addEventListener('keydown', handleKeyDown);

    // Comenzar el bucle principal del juego
    gameLoop();
}

// Función para construir el laberinto según los datos del nivel
function buildLevel(level) {
    for (let y = 0; y < level.length; y++) {
        for (let x = 0; x < level[y].length; x++) {
            let tile = level[y][x];
            let tileX = x * gridSize;
            let tileY = y * gridSize;

            if (tile === '#') {
                walls.push({ x: tileX, y: tileY, width: gridSize, height: gridSize });
            } else if (tile === 'o') {
                pellets.push({ x: tileX + gridSize / 2, y: tileY + gridSize / 2, size: 4 });
            }
        }
    }
}

// Función para crear las pastillas normales
function createPellets() {
    for (let pellet of pellets) {
        context.fillStyle = 'white';
        context.beginPath();
        context.arc(pellet.x, pellet.y, pellet.size, 0, Math.PI * 2);
        context.fill();
    }
}

// Función para crear las pastillas de poder
function createPowerPellets() {
    powerPellets.push({ x: gridSize * 1.5, y: gridSize * 3.5 });
    powerPellets.push({ x: gridSize * 25.5, y: gridSize * 3.5 });
    powerPellets.push({ x: gridSize * 1.5, y: gridSize * 23.5 });
    powerPellets.push({ x: gridSize * 25.5, y: gridSize * 23.5 });

    for (let powerPellet of powerPellets) {
        context.beginPath();
        context.rect(powerPellet.x - 4, powerPellet.y - 4, 8, 8);
        context.fillStyle = 'white';
        context.fill();
    }
}

// Función para reiniciar las posiciones iniciales de Pac-Man y los fantasmas
function resetEntities() {
    pacman.x = gridSize * 13;
    pacman.y = gridSize * 23;
    pacman.dx = 0;
    pacman.dy = 0;
    pacman.direction = 'left';
    pacman.vulnerable = false;
    pacman.vulnerableTime = 0;

    ghosts.forEach((ghost, index) => {
        ghost.x = gridSize * 13;
        ghost.y = gridSize * (11 + 2 * index);
        ghost.dx = 0;
        ghost.dy = 0;
        ghost.state = 'scatter';
    });
}

// Función principal del juego
function gameLoop() {
    if (!gamePaused) {
        update();
        render();
    }
    requestAnimationFrame(gameLoop);
}

// Función para actualizar la lógica del juego
function update() {
    movePacman();
    moveGhosts();
    checkCollisions();
    checkPellets();
    checkPowerPellets();
    checkLevelCompletion();
    updateVulnerability();
}

// Función para renderizar el juego
function render() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawWalls();
    drawPellets();
    drawPowerPellets();
    drawEntities();
    drawScore();
    drawLives();
}

// Función para mover a Pac-Man
function movePacman() {
    pacman.x += pacman.dx;
    pacman.y += pacman.dy;

    // Comprobar límites del tablero para Pac-Man
    if (pacman.x < 0) {
        pacman.x = canvas.width - pacman.size;
    } else if (pacman.x >= canvas.width) {
        pacman.x = 0;
    }

    // Comprobar colisión con las paredes
    walls.forEach(wall => {
        if (pacman.x < wall.x + wall.width && pacman.x + pacman.size > wall.x &&
            pacman.y < wall.y + wall.height && pacman.y + pacman.size > wall.y) {
            switch (pacman.direction) {
                case 'left':
                    pacman.x = wall.x + wall.width;
                    break;
                case 'right':
                    pacman.x = wall.x - pacman.size;
                    break;
                case 'up':
                    pacman.y = wall.y + wall.height;
                    break;
                case 'down':
                    pacman.y = wall.y - pacman.size;
                    break;
            }
        }
    });
}

// Función para mover a los fantasmas
function moveGhosts() {
    ghosts.forEach(ghost => {
        // Implementación de movimientos de los fantasmas según el estado (scatter, chase, frightened)
        // Aquí deberías implementar los patrones de movimiento específicos del juego original de Pac-Man
        // Para simplicidad, aquí solo se muestra un movimiento aleatorio básico
        let directions = ['left', 'right', 'up', 'down'];
        let randomDirection = directions[Math.floor(Math.random() * directions.length)];

        switch (randomDirection) {
            case 'left':
                ghost.dx = -velocity;
                ghost.dy = 0;
                break;
            case 'right':
                ghost.dx = velocity;
                ghost.dy = 0;
                break;
            case 'up':
                ghost.dx = 0;
                ghost.dy = -velocity;
                break;
            case 'down':
                ghost.dx = 0;
                ghost.dy = velocity;
                break;
        }

        ghost.x += ghost.dx;
        ghost.y += ghost.dy;

        // Comprobar límites del tablero para los fantasmas
        if (ghost.x < 0) {
            ghost.x = canvas.width - ghost.size;
        } else if (ghost.x >= canvas.width) {
            ghost.x = 0;
        }
    });
}

// Función para comprobar colisiones con los fantasmas
function checkCollisions() {
    ghosts.forEach(ghost => {
        if (pacman.x < ghost.x + ghost.size &&
            pacman.x + pacman.size > ghost.x &&
            pacman.y < ghost.y + ghost.size &&
            pacman.y + pacman.size > ghost.y) {
            // Colisión con un fantasma
            if (pacman.vulnerable) {
                // Pac-Man come al fantasma
                pacman.score += 200;
                resetGhost(ghost);
            } else {
                // Pac-Man es capturado por el fantasma
                pacman.lives--;
                if (pacman.lives > 0) {
                    resetEntities();
                } else {
                    gameOver = true;
                    gamePaused = true;
                    alert('Game Over');
                }
            }
        }
    });
}

// Función para resetear un fantasma a su posición inicial
function resetGhost(ghost) {
    ghost.x = gridSize * 13;
    ghost.y = gridSize * 11;
}

// Función para comprobar las pastillas normales
function checkPellets() {
    pellets.forEach((pellet, index) => {
        if (pacman.x < pellet.x + pellet.size &&
            pacman.x + pacman.size > pellet.x &&
            pacman.y < pellet.y + pellet.size &&
            pacman.y + pacman.size > pellet.y) {
            // Pac-Man come la pastilla
            pellets.splice(index, 1);
            pacman.score += pelletValue;
        }
    });
}

// Función para comprobar las pastillas de poder
function checkPowerPellets() {
    powerPellets.forEach((powerPellet, index) => {
        if (pacman.x < powerPellet.x + 8 &&
            pacman.x + pacman.size > powerPellet.x &&
            pacman.y < powerPellet.y + 8 &&
            pacman.y + pacman.size > powerPellet.y) {
            // Pac-Man come la pastilla de poder
            powerPellets.splice(index, 1);
            pacman.score += powerPelletValue;

            // Activar vulnerabilidad
            activateVulnerability();
        }
    });
}

// Función para activar la vulnerabilidad de Pac-Man
function activateVulnerability() {
    pacman.vulnerable = true;
    pacman.vulnerableTime = pacman.vulnerableDuration;

    // Cambiar color de los fantasmas y hacerlos vulnerables
    ghosts.forEach(ghost => {
        ghost.color = 'blue';
        ghost.state = 'frightened';
    });

    // Temporizador para volver a los fantasmas normales
    setTimeout(deactivateVulnerability, pacman.vulnerableDuration);
}

// Función para desactivar la vulnerabilidad de Pac-Man
function deactivateVulnerability() {
    pacman.vulnerable = false;

    // Volver a los fantasmas a su estado normal
    ghosts.forEach(ghost => {
        ghost.color = 'red';
        ghost.state = 'scatter';
    });
}

// Función para comprobar si se completó el nivel
function checkLevelCompletion() {
    if (pellets.length === 0 && powerPellets.length === 0) {
        levelCompleted = true;
        gamePaused = true;
        alert('Level Completed!');
    }
}

// Función para actualizar la vulnerabilidad de Pac-Man
function updateVulnerability() {
    if (pacman.vulnerable) {
        pacman.vulnerableTime -= deltaTime;
        if (pacman.vulnerableTime <= 0) {
            deactivateVulnerability();
        }
    }
}

// Función para manejar los eventos de teclado
function handleKeyDown(event) {
    switch (event.key) {
        case 'ArrowLeft':
            pacman.dx = -pacman.speed;
            pacman.dy = 0;
            pacman.direction = 'left';
            break;
        case 'ArrowRight':
            pacman.dx = pacman.speed;
            pacman.dy = 0;
            pacman.direction = 'right';
            break;
        case 'ArrowUp':
            pacman.dx = 0;
            pacman.dy = -pacman.speed;
            pacman.direction = 'up';
            break;
        case 'ArrowDown':
            pacman.dx = 0;
            pacman.dy = pacman.speed;
            pacman.direction = 'down';
            break;
        case 'p':
            gamePaused = !gamePaused;
            if (!gamePaused) {
                gameLoop();
            }
            break;
    }
}

// Función para dibujar las paredes
function drawWalls() {
    context.fillStyle = 'blue';
    walls.forEach(wall => {
        context.fillRect(wall.x, wall.y, wall.width, wall.height);
    });
}

// Función para dibujar las pastillas normales
function drawPellets() {
    context.fillStyle = 'white';
    pellets.forEach(pellet => {
        context.beginPath();
        context.arc(pellet.x, pellet.y, pellet.size, 0, Math.PI * 2);
        context.fill();
    });
}

// Función para dibujar las pastillas de poder
function drawPowerPellets() {
    context.fillStyle = 'white';
    powerPellets.forEach(powerPellet => {
        context.beginPath();
        context.rect(powerPellet.x - 4, powerPellet.y - 4, 8, 8);
        context.fill();
    });
}

// Función para dibujar a Pac-Man y a los fantasmas
function drawEntities() {
    // Dibujar Pac-Man
    context.fillStyle = pacman.color;
    context.beginPath();
    context.arc(pacman.x + pacman.size / 2, pacman.y + pacman.size / 2, pacman.size / 2, 0, Math.PI * 2);
    context.fill();

    // Dibujar fantasmas
    ghosts.forEach(ghost => {
        context.fillStyle = ghost.color;
        context.beginPath();
        context.arc(ghost.x + ghost.size / 2, ghost.y + ghost.size / 2, ghost.size / 2, 0, Math.PI * 2);
        context.fill();
    });
}

// Función para dibujar el puntaje
function drawScore() {
    context.fillStyle = 'white';
    context.font = '16px Arial';
    context.fillText('Score: ' + pacman.score, 20, 20);
}

// Función para dibujar las vidas restantes
function drawLives() {
    context.fillStyle = 'white';
    context.font = '16px Arial';
    context.fillText('Lives: ' + pacman.lives, canvas.width - 100, 20);
}

// Iniciar el juego al cargar la página
initGame();




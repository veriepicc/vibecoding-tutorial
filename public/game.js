const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 32;
const WORLD_HEIGHT = 64;
const CHUNK_SIZE = 32;

// Infinite horizontal world represented as chunks
const chunks = {};

const camera = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    update: function(player) {
        this.x = player.x - this.width / 2;
        this.y = player.y - this.height / 2;
    }
};

// Helpers for infinite world
function mod(n, m) {
    return ((n % m) + m) % m;
}

function seededNoise(n) {
    // Deterministic pseudo-random in [0,1]
    n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
    n = Math.imul(n ^ (n >>> 15), 0xc2b2ae35);
    n ^= n >>> 16;
    return (n >>> 0) / 4294967295;
}

function terrainHeightAt(globalX) {
    const base = Math.floor(WORLD_HEIGHT * 0.75);
    const n1 = Math.sin(globalX * 0.05) * 6;
    const n2 = Math.sin(globalX * 0.013) * 3;
    const n3 = (seededNoise(globalX) - 0.5) * 4;
    const h = Math.floor(base + n1 + n2 + n3);
    return Math.max(0, Math.min(WORLD_HEIGHT - 1, h));
}

function getChunk(chunkX) {
    const key = chunkX | 0;
    if (!chunks[key]) {
        chunks[key] = generateChunk(key);
    }
    return chunks[key];
}

function generateChunk(chunkX) {
    const chunk = Array.from({ length: WORLD_HEIGHT }, () => Array(CHUNK_SIZE).fill(0));
    const startX = chunkX * CHUNK_SIZE;
    for (let localX = 0; localX < CHUNK_SIZE; localX++) {
        const gx = startX + localX;
        const groundY = terrainHeightAt(gx);
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            if (y > groundY) {
                chunk[y][localX] = 1; // dirt
            } else if (y === groundY) {
                chunk[y][localX] = 2; // grass
            } else {
                chunk[y][localX] = 0; // air
            }
        }
    }
    return chunk;
}

function getTile(globalX, y) {
    const chunkX = Math.floor(globalX / CHUNK_SIZE);
    const localX = mod(globalX, CHUNK_SIZE);
    if (y < 0 || y >= WORLD_HEIGHT) return 0;
    const chunk = getChunk(chunkX);
    return chunk[y][localX] || 0;
}

function setTile(globalX, y, value) {
    if (y < 0 || y >= WORLD_HEIGHT) return;
    const chunkX = Math.floor(globalX / CHUNK_SIZE);
    const localX = mod(globalX, CHUNK_SIZE);
    const chunk = getChunk(chunkX);
    chunk[y][localX] = value;
}

function drawWorld() {
    const minTileX = Math.floor(camera.x / TILE_SIZE) - 1;
    const maxTileX = Math.floor((camera.x + canvas.width) / TILE_SIZE) + 1;
    const minTileY = Math.max(0, Math.floor(camera.y / TILE_SIZE));
    const maxTileY = Math.min(WORLD_HEIGHT - 1, Math.floor((camera.y + canvas.height) / TILE_SIZE));
    for (let y = minTileY; y <= maxTileY; y++) {
        for (let gx = minTileX; gx <= maxTileX; gx++) {
            const tile = getTile(gx, y);
            if (tile !== 0) {
                if (tile === 1) {
                    ctx.fillStyle = '#A0522D'; // dirt
                } else if (tile === 2) {
                    ctx.fillStyle = '#228B22'; // grass
                }
                ctx.fillRect(gx * TILE_SIZE - camera.x, y * TILE_SIZE - camera.y, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    camera.width = canvas.width;
    camera.height = canvas.height;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const player = new Player(100, 100, 32, 48, '#FF5733');

const keys = {
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false
};

window.addEventListener('keydown', (e) => {
    if (e.code in keys) {
        keys[e.code] = true;
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code in keys) {
        keys[e.code] = false;
        e.preventDefault();
    }
});

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left + camera.x;
    const mouseY = e.clientY - rect.top + camera.y;

    const tileX = Math.floor(mouseX / TILE_SIZE);
    const tileY = Math.floor(mouseY / TILE_SIZE);

    if (tileY >= 0 && tileY < WORLD_HEIGHT) {
        if (e.button === 0) { // Left-click to break
            setTile(tileX, tileY, 0);
        } else if (e.button === 2) { // Right-click to place
            setTile(tileX, tileY, 1); // Place dirt for now
        }
    }
});

// Prevent context menu on right-click
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

let lastTime = 0;
function gameLoop(time) {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set background color
    ctx.fillStyle = '#87CEEB'; // Sky blue
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const dt = Math.min(((time - lastTime) / 1000) || 0, 0.033); // clamp delta
    lastTime = time || 0;

    // Update camera
    camera.update(player);

    // Game logic and rendering will go here
    drawWorld();
    player.update(keys, dt);
    player.handleCollision(dt);
    player.draw(ctx, camera);

    requestAnimationFrame(gameLoop);
}

// Start the game loop
requestAnimationFrame(gameLoop);

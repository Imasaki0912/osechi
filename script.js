const canvas = document.getElementById('game-board');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

context.scale(BLOCK_SIZE, BLOCK_SIZE);

let board = createBoard();
let gameOver = false;

function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

const COLORS = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF',
];

const PIECES = {
    'I': [[1, 1, 1, 1]],
    'O': [[2, 2], [2, 2]],
    'T': [[0, 3, 0], [3, 3, 3]],
    'S': [[0, 4, 4], [4, 4, 0]],
    'Z': [[5, 5, 0], [0, 5, 5]],
    'L': [[6, 0, 0], [6, 6, 6]],
    'J': [[0, 0, 7], [7, 7, 7]],
};

let player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    score: 0,
};

function playerReset() {
    const pieces = 'IOTSLJZ';
    const type = pieces[pieces.length * Math.random() | 0];
    player.matrix = createPiece(type);
    player.pos.y = 0;
    player.pos.x = (COLS / 2 | 0) - (player.matrix[0].length / 2 | 0);

    if (collide(board, player)) {
        gameOver = true;
    }
}

function createPiece(type) {
    return PIECES[type];
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(board, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);

    if (gameOver) {
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.font = '2px sans-serif';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.fillText('Game Over', COLS / 2, ROWS / 2);
    }
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = COLORS[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function merge(board, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function collide(board, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (board[y + o.y] &&
                    board[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function playerDrop() {
    player.pos.y++;
    if (collide(board, player)) {
        player.pos.y--;
        merge(board, player);
        playerReset();
        boardSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(board, player)) {
        player.pos.x -= dir;
    }
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}


function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(board, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function boardSweep() {
    let rowCount = 1;
    outer: for (let y = board.length - 1; y > 0; --y) {
        for (let x = 0; x < board[y].length; ++x) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }

        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        ++y;

        player.score += rowCount * 10;
        rowCount *= 2;
    }
}


let dropCounter = 0;
let dropInterval = 1000;

let lastTime = 0;
function update(time = 0) {
    if (gameOver) {
        draw();
        return;
    }

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

function updateScore() {
    scoreElement.innerText = player.score;
}

document.addEventListener('keydown', event => {
    if (gameOver) {
        board.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
        gameOver = false;
        playerReset();
        update();
        return;
    }

    if (event.key === 'ArrowLeft') {
        playerMove(-1);
    } else if (event.key === 'ArrowRight') {
        playerMove(1);
    } else if (event.key === 'ArrowDown') {
        playerDrop();
    } else if (event.key === 'q') {
        playerRotate(-1);
    } else if (event.key === 'w') {
        playerRotate(1);
    }
});

playerReset();
updateScore();
update();

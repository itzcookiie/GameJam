const gameCanvas = document.getElementById('gameCanvas'),
    shapeCanvas = document.getElementById('shapeCanvas'),
    connectSound = new Audio('./connect.wav');

// const gameState = {
//     GAME_GRID_
// };

const shapes = [
    // I block
    {
        type: 'I',
        cords: [
            [[1,0], [2,0], [3,0]],
            [[0,1], [0,2], [0,3]]
        ]
    },
    // S block
    {
        type: 'S',
        cords: [
            [[1,0], [1,1], [2,1]],
            [[0,-1], [1,-1], [1,-2]]
        ]
    },
    // L-backwards block
    {
        type: 'L-B',
        cords: [
            [[-1,0], [-2,0], [-2,1]],
            [[0,1], [0,2], [1,2]]
        ]
    },
    // L-forwards block = L-backwards x cords * -1
    {
        type: 'L-F',
        cords: [
            [[1,0], [2,0], [2,1]],
            [[0,1], [0,2], [-1,2]]
        ]
    },
    // Square block
    {
        type: 'Square',
        cords: [
            [[1,0], [1,-1], [0,-1]]
        ]
    },
    // T block
    {
        type: 'T',
        cords: [
            [[1,0], [1,1], [2,0]],
            [[0,-1], [1,-1], [0,-2]]
        ]
    },
    // Z block
    {
        type: 'Z',
        cords: [
            [[1,0], [1,-1], [2,-1]],
            [[0,-1], [-1,-1], [-1,-2]]
        ]
    }
]

window.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp':
            rotate();
            break;
        case 'ArrowRight':
            moveCommand(0, 1)
            break;
        case 'ArrowLeft':
            moveCommand(0, -1)
            break;
        case 'ArrowDown':
            moveCommand(1, 1)
            break;
    }
})

function moveCommand(axisIndex, increment) {
    const newPosition = gameGrid.startPos.map((pos, index) => index === axisIndex ? pos + increment : pos);
    const gameGridCopy = JSON.parse(JSON.stringify(gameGrid));
    const newCordPosition = calculateCords(gameGrid, gameGrid.currentShape, newPosition);
    gameGridCopy.currentCords = newCordPosition;

    if(!cordsAreNotValid(gameGridCopy)) {
        gameGrid.startPos[axisIndex]+=increment;
    }
}

function rotate() {
    const { type, cordIndex, rotationStage } = gameGrid.currentShape;
    const prevRotationStage = rotationStage !== undefined ? rotationStage : 0;
    const newRotationStage = (prevRotationStage + 1) % 4;
    const shape = findShapeFromType(type);
    const newSetOfCords = rotateCords(shape.cords[cordIndex], newRotationStage);

    const gameGridCopy = JSON.parse(JSON.stringify(gameGrid));
    gameGridCopy.currentShape.cords = newSetOfCords;
    gameGridCopy.currentShape.rotationStage = newRotationStage;
    const gridIndexes = getGridIndexes(gameGridCopy.currentShape.cords, gameGridCopy.rows, gameGridCopy.startPos);
    const validCords = checkGridIndexesAreValid(gridIndexes);
    if(!validCords) {
        console.log('INVALID');
        return;
    }
    const newCordPosition = calculateCords(gameGridCopy, gameGridCopy.currentShape, gameGridCopy.startPos);
    gameGridCopy.currentCords = newCordPosition;
    if(!cordsAreNotValid(gameGridCopy)) {
        gameGrid.currentShape.cords = newSetOfCords;
        gameGrid.currentShape.rotationStage = newRotationStage;
    }
}

function cordsAreNotValid(grid) {
    // Makes sure one block is not in column 1 and another block is in the last column
    return shapeHitWall(grid.currentCords) || collisionWithBlocks(grid);
}

function shapeHitWall(cords) {
    return cords.some(cord => cord.x <= gameGrid.borderOffset) && cords.some(cord => cord.x >= gameCanvas.width - gameGrid.borderOffset - gameGrid.cellWidth);
}

function findShapeFromType(type) {
    return shapes.find(shape => shape.type === type);
}

function rotateCords(cords, rotationStage) {
    switch (rotationStage) {
        case 0:
            return cords;
            break;
        case 1:
            return cords.map(cord => {
                return [cord[1], -cord[0]]
            })
            break;
        case 2:
            return cords.map(cord => {
                return [-cord[0], -cord[1]]
            })
            break;
        case 3:
            return cords.map(cord => {
                return [-cord[1], cord[0]]
            })
            break;
    }
}

function createGridObject(canvas, cols, rows, border, bgColour, gridLinesColour, shapeColour) {
    const borderOffset = border / 2;
    const cellWidth = (canvas.width - border) / rows;
    const cellHeight = (canvas.height - border) / cols;

    return {
        ctx: canvas.getContext('2d'),
        cols,
        rows,
        border,
        borderOffset,
        cellWidth,
        cellHeight,
        gridSquares: [],
        currentShape: [],
        currentCords: [],
        startPos: [],
        shapes: [],
        bgColour,
        gridLinesColour,
        shapeColour,
        paintGrid() {
            this.ctx.fillStyle = this.bgColour;
            this.ctx.fillRect(0, 0, canvas.width, canvas.height);
            generateGrid(this, this.gridLinesColour);
        }
    }
}

function generateGrid(gameGrid, colour) {
    gameGrid.ctx.strokeStyle = gameGrid.gridLinesColour;
    for(let r = 0; r < gameGrid.cols; r++) {
        // Where row starts from aka y axis
        const y = (r * gameGrid.cellHeight) + gameGrid.borderOffset
        for(let c = 0; c < gameGrid.rows; c++) {
            // Where col starts from aka x axis
            const x = (c * gameGrid.cellWidth) + gameGrid.borderOffset
            gameGrid.ctx.strokeRect(x, y, gameGrid.cellWidth, gameGrid.cellHeight);
            gameGrid.gridSquares[c + r * gameGrid.rows] = ({id: (r * gameGrid.rows) + c, x, y, taken: false})
        }
    }
}

const gameGrid = createGridObject(gameCanvas, 10, 20, 100, 'green', 'blue', 'black');
const shapeGrid = createGridObject(shapeCanvas, 7, 10, gameGrid.border / 2, 'yellow', 'red', 'black');

gameGrid.paintGrid();
shapeGrid.paintGrid();

function getRandomShape() {
    return shapes[Math.floor(Math.random() * shapes.length)];
}

function flipShape(cords, axis) {
    return Math.random() > 0.5 > 0.5
        ? cords
        : cords.map(cord => {
            axis === 0 ? cord[0] *= -1 : cord[1] *= -1;
            return cord;
        })
}

function getRandomShapeCords() {
    const shape = getRandomShape();
    const shapeCords = shape.cords;
    const cordIndex = Math.floor(Math.random() * shapeCords.length);
    const randomCords = shapeCords[cordIndex];
    return {
        ...shape,
        cordIndex,
        cords: flipShape(randomCords, cordIndex)
    };
}

function addShapeToGrid(grid, shape, startPos, save=true) {
    if(!save) {
        shape.currentCords.forEach(cord => {
            grid.ctx.fillRect(cord.x, cord.y, grid.cellWidth, grid.cellHeight);
        });
        return;
    }

    const newCords = calculateCords(grid, shape, startPos);
    grid.ctx.fillStyle = 'black';
    newCords.forEach(cord => grid.ctx.fillRect(cord.x, cord.y, grid.cellWidth, grid.cellHeight))

    grid.currentCords = newCords;
    grid.currentShape = shape;
    grid.startPos = startPos;
}

function calculateCords(grid, shape, startPos) {
    const { gridSquares } = grid;
    const gridIndexes = getGridIndexes(shape.cords, grid.rows, startPos);
    return gridIndexes.map(gridIndex => ({x: gridSquares[gridIndex].x, y: gridSquares[gridIndex].y}))
}

function getGridIndexes(cords, rows, startPos) {
    let [ startX, startY ] = startPos;
    const index = startX + (startY * rows);
    const otherGridIndexes = cords.map(cord => {
        const [ x,y ] = cord;
        return index + x + (rows * y);
    });
    return [index, ...otherGridIndexes];
}

function checkGridIndexesAreValid(gridIndexes) {
    const { gridSquares } = gameGrid;
    return gridIndexes.every(gridIndex => gridIndex >= gridSquares[0].id && gridIndex <= gridSquares[gridSquares.length - 1].id)
}

function addShapesToGrid() {
    gameGrid.shapes.forEach(shape => addShapeToGrid(gameGrid, shape, shape.startPos, false));
}


const randomCords = getRandomShapeCords();
addShapeToGrid(shapeGrid, randomCords, [5,3]);
addShapeToGrid(gameGrid, randomCords, [10,4]);

let start = 0;

function dropShape(timestamp) {
    const { startPos, currentCords, currentShape, shapes, paintGrid } = gameGrid;

    // if (!start) start = timestamp;
    // if(timestamp - start > 1000) {
    //     start = timestamp;
    // }
    clearGrid();
    gameGrid.paintGrid();
    shapeGrid.paintGrid();
    const filledRows = rowIsFilled();
    if(filledRows) {
        const filledRow = getRow(filledRows);
        const nonFilledRowsCords = removeRow(filledRows);
        gameGrid.shapes = nonFilledRowsCords
        moveBlocksDown(filledRows);
    }
    const hasCollided = checkCollisions();
    if(hasCollided) {
        connectSound.play();
        shapes.push({
            ...currentShape,
            currentCords,
            startPos
        });
        const randomCords = getRandomShapeCords();
        addShapeToGrid(shapeGrid, randomCords, [5,3]);
        addShapeToGrid(gameGrid, randomCords, [10,4], 'dropshape');
    } else {
        addShapeToGrid(shapeGrid, shapeGrid.currentShape, shapeGrid.startPos);
        addShapeToGrid(gameGrid, gameGrid.currentShape, gameGrid.startPos, 'dropshape');
    }
    addShapesToGrid();
    // console.log('after', gameGrid.shapes);
    requestAnimationFrame(dropShape)
}

requestAnimationFrame(dropShape);

function clearGrid() {
    const { borderOffset: gameGridBorderOffset, ctx: gameGridCtx } = gameGrid;
    const { borderOffset: shapeGridBorderOffset, ctx: shapeGridCtx } = shapeGrid;
    gameGridCtx.clearRect(gameGridBorderOffset, gameGridBorderOffset, gameCanvas.width - gameGridBorderOffset * 2, gameCanvas.height - gameGridBorderOffset * 2);
    shapeGridCtx.clearRect(shapeGridBorderOffset, shapeGridBorderOffset, shapeCanvas.width - shapeGridBorderOffset * 2, shapeCanvas.height - shapeGridBorderOffset * 2);
}

function checkCollisions() {
    return collisionWithFloor() || collisionWithTopOfBlock();
}

function collisionWithFloor(grid=gameGrid) {
    const { cols, cellHeight, startPos, currentShape, shapes, currentCords } = grid;
    const bottomOfGrid = cellHeight * cols;
    const blocksTouchingBottom = currentCords.some(cord => cord.y === bottomOfGrid);
    return blocksTouchingBottom ? true : false;
}

function collisionWithBlocks(grid) {
    // Fix so shape cannot rotate if obstacle is right next to it
    // IE. it can't jump over a shape to rotate if the obstacle is along the path of rotation
    return grid.shapes.length > 0 && grid.currentCords.some((cord, index) => grid.shapes.some(
        shape => shape.currentCords.some(shapeCord => {
                const upperBoundCord = cord;
                const lowerBoundCord = gameGrid.currentCords[index];
                return (shapeCord.x <= upperBoundCord.x && shapeCord.x >= lowerBoundCord.x && shapeCord.y <= upperBoundCord.y && shapeCord.y >= lowerBoundCord.y) ||
                    (shapeCord.x <= lowerBoundCord.x && shapeCord.x >= upperBoundCord.x && shapeCord.y <= lowerBoundCord.y && shapeCord.y >= upperBoundCord.y) ||
                    (shapeCord.x >= lowerBoundCord.x && shapeCord.x <= upperBoundCord.x && shapeCord.y <= lowerBoundCord.y && shapeCord.y >= upperBoundCord.y) ||
                    (shapeCord.x <= lowerBoundCord.x && shapeCord.x >= upperBoundCord.x && shapeCord.y >= lowerBoundCord.y && shapeCord.y <= upperBoundCord.y)
                }
            )
        )
    );
}

function collisionWithTopOfBlock() {
    return gameGrid.shapes.length > 0 && gameGrid.currentCords.some(cord => gameGrid.shapes.some(shape =>
            shape.currentCords.some(shapeCord =>
                cord.x === shapeCord.x && cord.y + gameGrid.cellHeight === shapeCord.y
            )
        )
    );
}

function rowIsFilled() {
    if(gameGrid.shapes.length > 0) {
        const shapeRowPositions = gameGrid.shapes.flatMap(getShapeRowPositions);
        const rowObject = createRowObject(shapeRowPositions);
        const rows = Object.keys(rowObject);
        const filledRow = rows.filter(row => rowObject[row] >= 5);
        return filledRow.length && filledRow.map(row => +row);
    }

    return 0;
}

function getShapeRowPositions(shape) {
    return shape.currentCords.map(cord => cord.y)
}

function createRowObject(rowPositions) {
    return rowPositions.reduce((acc,val) => {
        if(!acc[val]) acc[val] = 0;
        acc[val]++;
        return acc
    }, {})
}

function removeRow(rows) {
    return gameGrid.shapes.map(shape => ({
            ...shape,
            currentCords: getNonFilledInRowBlocks(shape, rows)
        })
    )
}

function getNonFilledInRowBlocks(shape, rows) {
    return shape.currentCords.filter(cord => rows.every(row => cord.y !== row))
}

function getRow(rows) {
    return gameGrid.shapes.map(shape => ({
        ...shape,
        currentCords: getFilledRowBlocks(shape, rows)
    })
)
}

function getFilledRowBlocks(shape, rows) {
    return shape.currentCords.filter(cord => rows.some(row => cord.y === row))
}

function moveBlocksDown(rows) {
    rows.forEach(row =>
        gameGrid.shapes.forEach(shape => 
            shape.currentCords.forEach(cord => {
                if(cord.y < row) {
                    cord.y+=gameGrid.cellHeight
                }
            })
        )
    )
}
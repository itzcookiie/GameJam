const gameCanvas = document.getElementById('gameCanvas'),
    shapeCanvas = document.getElementById('shapeCanvas'),
    ROW_ANIMATION_TIME = 2000; // 2 seconds

const gameStates = {
    PLAY: 0,
    START_ROW_ANIMATION: 1,
    FINISH_ROW_ANIMATION: 2,
    COLLISION: 3,
    GAME_OVER: 4
};

const audio = {
    connectSound: new Audio('./connect.wav'),
    filledRow: new Audio('./filledrow.wav')
}

const linePoints = {
    1: 100,
    2: 300,
    3: 500,
    4: 800
}

gameState = gameStates.PLAY;

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
    console.log(gameGridCopy.currentCords, newCordPosition)
    if(newCordPositionIsNotValid(gameGridCopy.currentCords, newCordPosition)) {
        console.log('New cord position not valid!')
        return;
    }
    
    if(!cordsAreNotValid(newCordPosition)) {
        gameGridCopy.currentCords = newCordPosition;
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

    if(!cordsAreNotValid(newCordPosition)) {
        gameGridCopy.currentCords = newCordPosition;
        gameGrid.currentShape.cords = newSetOfCords;
        gameGrid.currentShape.rotationStage = newRotationStage;
    }
}

function cordsAreNotValid(newCords) {
    // Makes sure one block is not in column 1 and another block is in the last column
    return shapeHitWall(newCords) || collisionWithBlocks(newCords);
}

function shapeHitWall(cords) {
    return cords.some(cord => cord.x === gameGrid.borderOffset) && cords.some(cord => cord.x >= gameCanvas.width - gameGrid.borderOffset - gameGrid.cellWidth);
}

function findShapeFromType(type) {
    return shapes.find(shape => shape.type === type);
}

function rotateCords(cords, rotationStage) {
    switch (rotationStage) {
        case 0:
            return cords;
        case 1:
            return cords.map(cord => {
                return [cord[1], -cord[0]]
        })
        case 2:
            return cords.map(cord => {
                return [-cord[0], -cord[1]]
        })
        case 3:
            return cords.map(cord => {
                return [-cord[1], cord[0]]
        })
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

const gameObj = {
    start: 0,
    rowWithAnimationTimes: [],
    score: 0
}

const gameGrid = createGridObject(gameCanvas, 10, 20, 100, 'green', 'blue', 'black');
const shapeGrid = createGridObject(shapeCanvas, 7, 10, gameGrid.border / 2, 'yellow', 'red', 'black');

gameGrid.ctx.font = "30px Helvetica"
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

function newCordPositionIsNotValid(oldCords, newCords) {
    return oldCords.some((oldCord, index) => newCords[index].x - oldCord.x > 35 || oldCord.x - newCords[index].x > 35)
}

function addShapesToGrid() {
    gameGrid.shapes.forEach(shape => addShapeToGrid(gameGrid, shape, shape.startPos, false));
}


const randomCords = getRandomShapeCords();
addShapeToGrid(shapeGrid, randomCords, [5,3]);
addShapeToGrid(gameGrid, randomCords, [10,4]);

function dropShape(timestamp) {
    const { startPos, currentCords, currentShape, shapes, paintGrid } = gameGrid;

    if(gameState === gameStates.PLAY) {
        if(checkCollisions()) {
            gameState = gameStates.COLLISION;
        } else {
            clearGrid();
            gameGrid.paintGrid();
            shapeGrid.paintGrid();
            addShapeToGrid(shapeGrid, shapeGrid.currentShape, shapeGrid.startPos);
            addShapeToGrid(gameGrid, gameGrid.currentShape, gameGrid.startPos, 'dropshape');
            addShapesToGrid();
            gameGrid.ctx.fillStyle = 'white';
            gameGrid.ctx.fillText("Score: " + gameObj.score, (gameCanvas.width / 2) - 30, 30)
        }
    } else if(gameState === gameStates.START_ROW_ANIMATION) {
        const now = timestamp - gameObj.start;
        highlightRows(gameObj.rowWithAnimationTimes, now);
    } else if(gameState === gameStates.COLLISION) {
        audio.connectSound.play();
        shapes.push({
            ...currentShape,
            currentCords,
            startPos
        });

        const filledRows = rowIsFilled();
        console.log(filledRows, 'normal')
        if(filledRows) {
            // For animations to work, we have to sync it with our game loop
            // IE. time has to be synced with our game loop
            // Or time is in the game loop. We can't separate time from the game loop basically
            filledRows.forEach(row =>row.cords.sort((cordA,cordB) => cordA.x - cordB.x))
            gameObj.start = timestamp;
            gameObj.rowWithAnimationTimes = addAnimationTimeToRows(filledRows);
            gameState = gameStates.START_ROW_ANIMATION;
        } else if(gameOver()) {
            gameState = gameStates.GAME_OVER;
        } else {
            generateNewShape();
            gameState = gameStates.PLAY;
        }
    } else if(gameState === gameStates.GAME_OVER) {

    }
    requestAnimationFrame(dropShape)
}

requestAnimationFrame(dropShape);

function addAnimationTimeToRows(rowCords) {
    return rowCords.map(rowCord =>
    ({
        ...rowCord,
        cords: rowCord.cords.map((cord,i,cordsArr) =>
            ({
            ...cord,
            time: (ROW_ANIMATION_TIME / cordsArr.length) * i
            }))
        })
    )
}

function generateNewShape() {
    const randomCords = getRandomShapeCords();
    addShapeToGrid(shapeGrid, randomCords, [5,3]);
    addShapeToGrid(gameGrid, randomCords, [10,4], 'dropshape');
}

function highlightRows(rowCords, time) {

    console.log(rowCords, 'highlightrows')
    const rowAnimationRowFinished = rowCords.filter(rowCord => highlightRow(rowCord, time)).length === rowCords.length;
    if(rowAnimationRowFinished) {
        rowAnimationCallback(rowCords);
    }

}

function highlightRow(rowCord, time) {
    const cordsToAnimate = rowCord.cords.filter((cord, i) => {
            return cord.time - time <= 0
    })

    cordsToAnimate.forEach((cord, i, arr) => {
        gameGrid.ctx.fillStyle = 'white';
        gameGrid.ctx.fillRect(cord.x, cord.y, gameGrid.cellWidth, gameGrid.cellHeight);
    });

    return cordsToAnimate.length === rowCord.cords.length
}

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

function collisionWithBlocks(newCords) {
    // Fix so shape cannot rotate if obstacle is right next to it
    // IE. it can't jump over a shape to rotate if the obstacle is along the path of rotation
    return gameGrid.shapes.length > 0 && newCords.some((cord, index) => gameGrid.shapes.some(
        shape => shape.currentCords.some(shapeCord => {
                const upperBoundCord = cord;
                const lowerBoundCord = newCords[index];
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

function addScore(lines) {
    const pointsScored = linePoints[lines];
    gameObj.score += pointsScored;
}

function rowAnimationCallback(filledRows) {
    gameGrid.shapes = removeRow(filledRows);
    moveBlocksDown(filledRows);
    generateNewShape();
    audio.filledRow.play();
    addScore(filledRows.length);
    gameState = gameStates.PLAY;
}

function rowIsFilled() {
    if(gameGrid.shapes.length > 0) {
        const rowObject = createRowObject(gameGrid.shapes.flatMap(getShapeRowPositions));
        const rows = Object.keys(rowObject);
        const filledRow = rows.filter(row => rowObject[row].length === gameGrid.rows);
        console.log(rowObject)
        return filledRow.length && filledRow.map(row => ({row: +row, cords: rowObject[row]}));
    }

    return 0;
}

function getShapeRowPositions(shape) {
    return shape.currentCords.map(cord => cord)
}

function createRowObject(rowPositions) {
    return rowPositions.reduce((acc,val) => {
        if(!acc[val.y]) acc[val.y] = [];
        acc[val.y].push(val);
        return acc
    }, {})
}

function removeRow(rows) {
    // Make sure all cords do not have same y value as the filled out row
    return gameGrid.shapes.map(shape => ({
        ...shape,
        currentCords: getNonFilledInRowBlocks(shape, rows)
        })
    )
}

function getNonFilledInRowBlocks(shape, rowObjs) {
    return shape.currentCords.filter(cord => rowObjs.every(rowObj => cord.y !== rowObj.row))
}

// function getRow(rows) {
//     return rows.map(row => )
//     return gameGrid.shapes.map(shape => ({
//         ...shape,
//         currentCords: getFilledRowBlocks(shape, rows)
//         })
//     )
// }

function getFilledRowBlocks(shape, rowObjs) {
    return shape.currentCords.filter(cord => rowObjs.some(rowObj => cord.y === rowObj.row))
}

function moveBlocksDown(rowObjs) {
    rowObjs.forEach(rowObj =>
        gameGrid.shapes.forEach(shape => 
            shape.currentCords.forEach(cord => {
                if(cord.y < rowObj.row) {
                    cord.y+=gameGrid.cellHeight
                }
            })
        )
    )
}

function getStartPos(shapeCords, middle) {
    const newShapeCords = makeNumbersPositive(shapeCords);
    const shapeHeight = calculateHeight(newShapeCords);
    const y = shapeHeight;
    const furthestLeftXcord = getFurthestLeftXCord(newShapeCords, y, middle);
    const furthestRightXcord = getFurthestRightXCord(newShapeCords, y);
    const nearestLeftObstacleXCord = findNearestLeftObstacleXCord(furthestLeftXcord, y);
    const nearestRightObstacleXCord = findNearestRightObstacleXCord(furthestRightXcord, y);
}

function findNearestRightObstacleXCord(furthestRightXcord, y) {
    const obstaclesCordsAlongXAxis = gameGrid.shapes.flatMap(shape => shape.currentCords.filter(cord => 
        cord.x === furthestRightXcord && cord.y === y
    ));
    const xCords = obstaclesCordsAlongXAxis.map(cord => cord.x);
    return Math.max(...xCords);
}

function findNearestLeftObstacleXCord(furthestLeftXcord, y) {

    const obstaclesCordsAlongXAxis = gameGrid.shapes.flatMap(shape => shape.currentCords.filter(cord => 
        cord.x <= furthestLeftXcord && cord.y === y
    ));
    const xCords = obstaclesCordsAlongXAxis.map(cord => cord.x);
    return Math.max(...xCords);
}

// TODO: Convert cord to actual position on grid by adding x cord to first number in startPos
// Then multipying it by gameGrid.cellWidth to get x position
function getFurthestLeftXCord(shapeCords, y, startPos) {
    const xCordsAlongHighestY = shapeCords.filter(cord => cord[1] === y);
    const xCords = xCordsAlongHighestY.flatMap(cord => cord[0]);
    return Math.min(...xCords);
}

function getFurthestRightXCord(shapeCords, y) {
    const xCordsAlongHighestY = shapeCords.filter(cord => cord[1] === y);
    const xCords = xCordsAlongHighestY.map(cord => cord[0]);
    return Math.max(...xCords);
}

function calculateHeight(shapeCords) {
    const yValues = shapeCords.flatMap(cord => cord[1]);
    return Math.max(...yValues);
}

function makeNumbersPositive(shapeCords) {
    return shapeCords.map(cord => {
        cord[0] < 0 ? cord[0]*=-1 : cord[0];
        cord[1] < 0 ? cord[1]*=-1 : cord[1];
        return cord;
    })
}

// TODO: Check if game is over
function gameOver() {

}

const squareShape = {
        "type": "Square",
        "cords": [
            [
                1,
                0
            ],
            [
                1,
                -1
            ],
            [
                0,
                -1
            ]
        ],
        "cordIndex": 0,
        "currentCords": [
            {
                "x": 50,
                "y": 500
            },
            {
                "x": 85,
                "y": 500
            },
            {
                "x": 85,
                "y": 450
            },
            {
                "x": 50,
                "y": 450
            }
        ],
        "startPos": [
            0,
            0
        ]
    };

function rowTest() {
    const first40Squares = gameGrid.gridSquares.filter((square,i) => i <= 39)
    const shapes = [];
    for(let i = 0; i < 18; i+=2) {
        shapes.push({
            ...squareShape,
            currentCords: squareShape.currentCords.map(cord => ({
                    ...cord,
                    x: cord.x + (i * gameGrid.cellWidth),
                })
            ),
            startPos: [i,9]
        })
    }
    for(let i = 0; i < 18; i+=2) {
        shapes.push({
            ...squareShape,
            currentCords: squareShape.currentCords.map(cord => ({
                    ...cord,
                    x: cord.x + (i * gameGrid.cellWidth),
                    y: cord.y - (gameGrid.cellHeight * 2)
                })
            ),
            startPos: [i,7]
        })
    }
    return shapes;
}

gameGrid.shapes = rowTest();

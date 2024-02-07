import {updateDimensions} from "./updateDimensions";
import Alert from "./Alert";
import {iTurretInfo} from "./Footer";
import tGridPosition from "./tGridPosition";
import {eTurretTargetDimensionsLocation, Turret, Turret1} from "./Turret";
import Monster from "./Monster";
import Spawner from "./Spawner";
import Projectile from "./Projectile";
import {GameGrid2D, isCenterOf5x5GridOf0s} from "./Grid";
import Particle from "./Particle";

export type tGameState = {
    switchXY: boolean;
    elapsedTime: number;
    elapsedTimeSeconds: number;
    context: CanvasRenderingContext2D;
    cellSize: number;
    alerts: Alert[];
    level: number;
    processedLevel: number;
    monsters: Monster[];
    spawners: Spawner[];
    projectiles: Projectile[];
    particles: Particle[];
    turrets: Turret[];
    gameTargets: (tGridPosition & { destroyed: boolean })[];
    spawnLocations: (tGridPosition)[];
    score: number;
    offsetX: number;
    offsetY: number;
    startTime: number;
    gameGrid: number[][];
    energy: number;
    status: string;
    mousePosition: tGridPosition;
    selectedTurret: iTurretInfo | null;
}


export const InitialGameState = (context: CanvasRenderingContext2D): tGameState => {

    const initialState: tGameState = {
        context: context,
        elapsedTime: 0,
        elapsedTimeSeconds: 0,
        cellSize: 0,
        alerts: [],
        particles: [], // This will hold particle objects
        switchXY: false,
        gameGrid: GameGrid2D,
        gameTargets: [],
        spawnLocations: [],
        offsetX: 0, // This will be used to scroll the grid horizontally
        offsetY: 0, // This will be used to scroll the grid vertically
        level: 1,
        processedLevel: 0,
        startTime: (new Date()).getTime(),
        energy: 0,
        score: 0,
        turrets: [], // This will hold turret objects
        monsters: [], // This will hold monster objects
        projectiles: [], // This will hold projectile objects
        spawners: [], // This will hold spawner objects to systematically spawn monsters
        status: 'playing', // playing, won, or lost,
        mousePosition: {x: 0, y: 0},
        selectedTurret: Turret1(eTurretTargetDimensionsLocation.GAME)
    }

    updateDimensions(initialState);

    const gameHeightY = initialState.gameGrid.length;
    const gameWidthX = initialState.gameGrid[0].length;

    // Create the game targets
    for (let y = 0; y < gameHeightY; y++) {

        for (let x = 0; x < gameWidthX; x++) {

            if (((0 === x || gameWidthX - 1 === x)
                    || (0 === y || gameHeightY - 1 === y))
                && initialState.gameGrid[y][x] === 0) {

                console.log('spawnLocations', x, y)

                initialState.spawnLocations.push({x, y});

            }

            if (isCenterOf5x5GridOf0s(x, y, initialState.gameGrid)) {

                initialState.gameTargets.push({x, y, destroyed: false});

            }

        }

    }

    // sort the game targets by distance from (0,0)
    initialState.gameTargets = initialState.gameTargets.sort((a, b) => {
        return Math.sqrt(a.x ** 2 + a.y ** 2) - Math.sqrt(b.x ** 2 + b.y ** 2);
    });

    return initialState;

};

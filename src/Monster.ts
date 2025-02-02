import Entity from "./Entity";
//import monsterImage from "./assets/svg/MonsterSVG";
import GameHeaderHeight from "./HeaderHeight";
import {energyCirclePosition, scoreCirclePosition} from "./Header";
import Particle from "./Particle";
import {tGameState} from "./InitialState";
import tGridPosition from "./tGridPosition";
import {dijkstraWithCaching} from "./Dijkstra";


export interface iMonster {
    x: number,
    y: number,
    gameState: tGameState,
    speed?: number,
    health?: number,
}

export default class Monster extends Entity {
    path: tGridPosition[] = [];
    pathIndex: number = 0;
    position: tGridPosition = {x: 0, y: 0};
    speed: number;
    health: number;
    startingHealth: number;
    damageDoneAndQueued: number;
    isDestroyed = false;
    private cellSize = 0;

    constructor({x, y, gameState, speed = 0.2, health = 100}: iMonster) {
        super({x, y, gameState});
        this.getPath();
        this.speed = speed; // Speed of the monster, adjust as needed
        this.health = health; // Health of the monster, adjust as needed
        this.startingHealth = health;
        this.damageDoneAndQueued = 0;
    }

    getPath(){
        const nextTarget = this.gameState.gameTargets?.find(target => target.destroyed === false);

        if (undefined === nextTarget) {
            console.error('no next target');
            return;
        }

        this.path = dijkstraWithCaching(this.gameState.gameGrid, {
            x: this.x,
            y: this.y
        }, nextTarget);
        // Reset the path index, this can happen with an orientation flip
        this.pathIndex = 0; // Start at the first point of the path
        this.position = {x: this.x, y: this.y}; // Current position of the monster
    }

    switchXY() {
        this.x = this.position.x;
        this.y = this.position.y;
        super.switchXY();
        this.getPath();
    }

    draw() {

        const ctx = this.gameState.context;

        // Draw the monster using the blue 3D diamond SVG image
        //ctx.drawImage(monsterImage, this.position.x * this.cellSize, this.position.y * this.cellSize, this.cellSize, this.cellSize);

        // todo draw a diamond with a gradient fill instead of the image
        ctx.beginPath();
        ctx.moveTo(this.position.x * this.cellSize + this.cellSize / 2, this.position.y * this.cellSize);
        ctx.lineTo(this.position.x * this.cellSize + this.cellSize, this.position.y * this.cellSize + this.cellSize / 2);
        ctx.lineTo(this.position.x * this.cellSize + this.cellSize / 2, this.position.y * this.cellSize + this.cellSize);
        ctx.lineTo(this.position.x * this.cellSize, this.position.y * this.cellSize + this.cellSize / 2);
        ctx.closePath();
        ctx.fillStyle = 'rgb(134,30,30)';
        ctx.fill();
        ctx.strokeStyle = 'rgb(0,191,255)';
        ctx.lineWidth = 2;
        ctx.stroke();

    }

    move(): boolean {

        const gameState = this.gameState;

        const cellSize: number = gameState.cellSize;

        this.cellSize = cellSize;

        if (this.health <= 0) {

            this.isDestroyed = true;

            const headerSize = GameHeaderHeight()

            // the particle effect will automatically handle the x and y offset
            const start = {
                x: cellSize * this.position.x,
                y: cellSize * this.position.y + headerSize
            };

            const energy = energyCirclePosition();

            gameState.particles.push(new Particle({
                fillStyle: 'rgb(39,192,42)',
                start: start,
                control: gameState.particles.length % 2 ? {
                    x: start.x,
                    y: energy.y
                } : {
                    x: energy.x,
                    y: start.y
                },
                end: energy,
                callback: () => {
                    gameState.energy += 10 * gameState.level + this.startingHealth;
                }
            }));

            const score = scoreCirclePosition();
            gameState.particles.push(new Particle({
                fillStyle: 'rgb(172,39,192)',
                start: start,
                control: gameState.particles.length % 2 ? {
                    x: start.x,
                    y: score.y
                } : {
                    x: score.x,
                    y: start.y
                },
                end: score,
                callback: () => {
                    gameState.score += 10 * gameState.level + this.startingHealth;
                }
            }));

            return false;

        }

        const finalPath = this.path[this.path.length - 1];

        if (undefined === finalPath) {

            return false;

        }

        // check if the destination orb is still there
        const destinationOrb = gameState.gameTargets.find(orb => {
            return false === orb.destroyed && orb.x === finalPath.x && orb.y === finalPath.y
        });

        // If the monster has reached the end of the path, stop moving
        if (undefined === destinationOrb || this.pathIndex === this.path.length - 1) {

            console.log(destinationOrb, this.pathIndex, this.path.length, this.path);

            const finalPath = this.path[this.path.length - 1];

            // remove the orbs from the game grid that match this.pathIndex
            gameState.gameTargets = gameState.gameTargets.map(target => {

                if (target.x === finalPath.x && target.y === finalPath.y) {

                    target.destroyed = true;

                }

                return target;

            });

            if (0 === gameState.gameTargets.length) {

                console.log('game over', gameState.gameTargets);

                gameState.status = 'lost';

                return false;

            }

            this.pathIndex = 0;

            const nextTarget = gameState.gameTargets.find(target => !target.destroyed);

            if (undefined === nextTarget) {
                console.error('no next target');
                return false;
            }

            this.path = dijkstraWithCaching(gameState.gameGrid, this.position, nextTarget);

            return true;
        }

        // Get the next point on the path
        const target = this.path[this.pathIndex + 1];

        // Calculate the direction vector from current position to the target
        const dir = {
            x: target.x - this.position.x,
            y: target.y - this.position.y
        };

        // Normalize the direction
        const length = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
        dir.x /= length;
        dir.y /= length;

        // Move the monster towards the target
        this.position.x += dir.x * this.speed;
        this.position.y += dir.y * this.speed;

        // Check if the monster has reached the target point
        if (Math.hypot(this.position.x - target.x, this.position.y - target.y) < this.speed) {
            this.position = {...target}; // Snap to the target to avoid overshooting
            this.pathIndex++; // Move to the next point
        }

        return true;

    }

}

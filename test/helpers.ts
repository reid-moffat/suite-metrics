import microtime from "microtime";

/**
 * Generates a random integer between min and max (both inclusive)
 */
function randomInt(min: number, max: number): number {
    if (min > max) {
        throw new Error(`[randomInt] Error: min (${min}) is greater than the value of max (${max})`);
    }

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Delay of the at least the specified number of milliseconds (uses microseconds to ensure precision)
 */
function addDelay(millis: number): void {
    if (millis <= 0) {
        throw new Error(`[addDelay] Error: millis (${millis}) must be greater than 0`);
    }

    const endTime: number = microtime.now() + millis * 1000;
    while (microtime.now() < endTime) { /* busy wait */ }
}

export { randomInt, addDelay };

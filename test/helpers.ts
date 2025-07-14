import microtime from "microtime";

/**
 * Generates a random integer between min and max (both inclusive)
 */
function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Delay of the at least the specified number of milliseconds (uses microseconds to ensure precision)
 */
function addDelay(millis: number): void {
    const endTime: number = microtime.now() + millis * 1000;
    while (microtime.now() < endTime) { /* busy wait */ }
}

export { randomInt, addDelay };

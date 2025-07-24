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
function sleep(millis: number): void {
    if (millis < 0) {
        throw new Error(`[sleep] Error: millis (${millis}) must be at least 0`);
    }
    if (millis === 0) {
        return;
    }

    sleepMicroseconds(millis * 1000);
}

/**
 * Delay of at least the specified number of microseconds
 */
function sleepMicroseconds(microseconds: number): void {
    if (microseconds < 0) {
        throw new Error(`[sleepMicroseconds] Error: millis (${microseconds}) must be at least 0`);
    }
    if (microseconds === 0) {
        return;
    }

    const endTime: number = microtime.now() + microseconds;
    while (microtime.now() < endTime) { /* busy wait */ }
}

export { randomInt, sleep, sleepMicroseconds };

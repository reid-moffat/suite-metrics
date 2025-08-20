import microtime from "microtime";
import { assert } from "chai";

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

/**
 * Assert that a function throws a specified error message
 *
 * Note: chai's assert.throws() is an include, not equality check. This misses invalid characters at the start or
 * end of the error message, so this stricter method is required for a full check
 *
 * @param func Function to run
 * @param expectedMessage Expected error message the function should throw
 * @param message Message to display if this assertion fails
 */
function assertThrows(func: () => any, expectedMessage: string, message?: string): void {
    try {
        func();
        assert.fail(message ?? "Expected function to throw an error");
    } catch (error: any) {
        assert.strictEqual(error.message, expectedMessage, message);
    }
}

/**
 * Assert that an asynchronous function throws a specified error message
 *
 * @param func Function to run
 * @param expectedMessage Expected error message the function should throw
 * @param message Message to display if this assertion fails
 */
async function assertThrowsAsync(func: () => Promise<any>, expectedMessage: string, message?: string): Promise<void> {
    try {
        await func();
        assert.fail(message ?? "Expected function to throw an error");
    } catch (error: any) {
        assert.strictEqual(error.message, expectedMessage, message);
    }
}

export { randomInt, sleep, sleepMicroseconds, assertThrows, assertThrowsAsync };

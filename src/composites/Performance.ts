import { Test } from "../types/structures.ts";
import Suites from "../helpers/Suites.ts";
import LazyCache from "../helpers/LazyCache.ts";

/**
 * Performance-related queries for finding slow and fast tests
 */
class Performance {

    // Ref to suites instance with all this metrics' data
    private readonly suites: Suites;

    // Ref to lazy-loaded expensive values cache
    private readonly lazyCache: LazyCache;

    public constructor(suites: Suites, lazyCache: LazyCache) {
        this.suites = suites;
        this.lazyCache = lazyCache;
    }

    /**
     * Gets the slowest test across all suites
     *
     * @returns The test with the longest duration
     * @throws Error If there are no tests in this metrics instance
     */
    public getSlowestTest(): Test {
        if (this.suites.getNumTests() === 0) {
            throw new Error(`No tests have been completed, could not get the slowest test`);
        }

        return this.lazyCache.getAllTestsSlowestFirst()[0];
    }

    /**
     * Gets the k slowest tests across all suites, sorted by duration descending
     *
     * @param k Number of slowest tests to return
     * @returns Array of the k slowest tests, sorted by duration descending
     * @throws Error If k is not a positive integer, or it is greater than the total number of tests
     */
    public getKSlowestTests(k: number): Test[] {
        if (!Number.isInteger(k) || k <= 0) {
            throw new Error(`Desired number of tests (k) must be a positive integer, ${k} is invalid`);
        }
        if (this.suites.getNumTests() < k) {
            throw new Error(`Desired number of tests (k = ${k}) is greater than the total number of tests (${this.suites.getNumTests()})`);
        }

        return this.lazyCache.getAllTestsSlowestFirst().slice(0, k);
    }

    /**
     * Gets all tests sorted by duration descending (slowest first)
     *
     * @returns Array of all tests sorted by duration in descending order
     */
    public getAllTestsSlowestFirst(): Test[] {
        return this.lazyCache.getAllTestsSlowestFirst();
    }

    /**
     * Gets the fastest test across all suites
     *
     * @returns The test with the shortest duration
     * @throws Error If there are no tests in this metrics instance
     */
    public getFastestTest(): Test {
        if (this.suites.getNumTests() === 0) {
            throw new Error(`No tests have been completed, could not get the fastest test`);
        }

        return this.lazyCache.getAllTestsFastestFirst()[0];
    }

    /**
     * Gets the k fastest tests across all suites, sorted by duration ascending
     *
     * @param k Number of fastest tests to return. Must be a positive integer
     * @returns Array of the k fastest tests, sorted by duration ascending
     * @throws Error If k is not a positive integer, or it is greater than the total number of tests
     */
    public getKFastestTests(k: number): Test[] {
        if (!Number.isInteger(k) || k <= 0) {
            throw new Error(`Desired number of tests (k) must be a positive integer, ${k} is invalid`);
        }
        if (this.suites.getNumTests() < k) {
            throw new Error(`Desired number of tests (k = ${k}) is greater than the total number of tests (${this.suites.getNumTests()})`);
        }

        return this.lazyCache.getAllTestsFastestFirst().slice(0, k);
    }

    /**
     * Gets all tests sorted by duration ascending (fastest first)
     *
     * @returns Array of all tests sorted by duration in ascending order
     */
    public getAllTestsFastestFirst(): Test[] {
        return this.lazyCache.getAllTestsFastestFirst();
    }
}

export default Performance;

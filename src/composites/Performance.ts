import { Test } from "../types/structures.ts";
import Utils from "../helpers/Utils.ts";
import Suites from "../helpers/Suites.ts";

/**
 * Performance-related queries for finding slow and fast tests
 */
class Performance {

    // Ref to suites instance with all this metrics' data
    private readonly suites: Suites;

    // All tests for a given metrics sorted from slowest to fastest (requires rebuild for each test addition)
    private cache: Test[] = [];

    public constructor(suites: Suites) {
        this.suites = suites;
    }

    /**
     * Gets the slowest test across all suites
     *
     * @returns The test with the longest duration
     * @throws Error if there are no tests in this metrics instance
     */
    public getSlowestTest(): Test {
        if (this.suites.getNumTests() === 0) {
            throw new Error(`There are no tests in this cache, could not get the slowest test`);
        }

        this.ensureSortedCache();
        const slowestTest: Test = this.cache[0];

        return Utils.deepCopyTest(slowestTest);
    }

    /**
     * Gets the k slowest tests across all suites, sorted by duration descending
     *
     * @param k Number of slowest tests to return. Must be a positive integer
     * @returns Array of the k slowest tests, sorted by duration descending
     * @throws Error If k is not a positive integer
     * @throws Error if k is greater than the total number of tests (getTotalTestCount())
     */
    public getKSlowestTests(k: number): Test[] {
        if (!Number.isInteger(k) || k <= 0) {
            throw new Error(`Desired number of tests (k) must be a positive integer, ${k} is invalid`);
        }
        if (this.suites.getNumTests() < k) {
            throw new Error(`Desired number of tests (k = ${k}) is greater than the total number of tests (${this.suites.getNumTests()})`);
        }

        this.ensureSortedCache();
        const endIndex: number = Math.min(k, this.suites.getNumTests());
        const slowestTests: Test[] = this.cache.slice(0, endIndex);

        return Utils.deepCopyTests(slowestTests);
    }

    /**
     * Gets all tests sorted by duration descending (slowest first)
     *
     * @returns Array of all tests sorted by duration in descending order
     */
    public getAllTestsSlowestFirst(): Test[] {
        this.ensureSortedCache();
        return Utils.deepCopyTests(this.cache);
    }

    /**
     * Gets the fastest test across all suites
     *
     * @returns The test with the shortest duration
     * @throws Error if there are no tests in this metrics instance
     */
    public getFastestTest(): Test {
        if (this.suites.getNumTests() === 0) {
            throw new Error(`There are no tests in this cache, could not get the fastest test`);
        }

        this.ensureSortedCache();
        const fastestTest: Test = this.cache[this.suites.getNumTests() - 1];

        return Utils.deepCopyTest(fastestTest);
    }

    /**
     * Gets the k fastest tests across all suites, sorted by duration ascending
     *
     * @param k Number of fastest tests to return. Must be a positive integer
     * @returns Array of the k fastest tests, sorted by duration ascending
     * @throws Error If k is not a positive integer
     * @throws Error if k is greater than the total number of tests (getTotalTestCount())
     */
    public getKFastestTests(k: number): Test[] {
        if (!Number.isInteger(k) || k <= 0) {
            throw new Error(`Desired number of tests (k) must be a positive integer, ${k} is invalid`);
        }
        if (this.suites.getNumTests() < k) {
            throw new Error(`Desired number of tests (k = ${k}) is greater than the total number of tests (${this.suites.getNumTests()})`);
        }

        this.ensureSortedCache();
        const startIndex: number = Math.max(0, this.suites.getNumTests() - k);
        const fastestTests: Test[] = this.cache.slice(startIndex).reverse();

        return Utils.deepCopyTests(fastestTests);
    }

    /**
     * Gets all tests sorted by duration ascending (fastest first)
     *
     * @returns Array of all tests sorted by duration in ascending order
     */
    public getAllTestsFastestFirst(): Test[] {
        this.ensureSortedCache();
        return Utils.deepCopyTests(this.cache).reverse();
    }


    /**
     * Rebuilds the sorted cache if invalid
     */
    private ensureSortedCache(): void {
        const sortedCacheValid: boolean = this.cache.length !== this.suites.getNumTests();

        if (!sortedCacheValid) {
            // Sort by duration in descending order (slowest goes first)
            this.cache = [...this.suites.getAllTestsInOrder()].sort((a: Test, b: Test): number => b.duration - a.duration);
        }
    }
}

export default Performance;

import { Test } from "../types/structures.ts";

/**
 * Manages a lazy sorted cache of tests for efficient retrieval of fastest/slowest tests
 */
class SortedTestCache {

    // All tests for a given metrics
    private readonly cache: Test[] = [];

    // Whether the cache is sorted
    private sortedCacheValid: boolean = false;

    /**
     * Gets the slowest test across all suites
     */
    public getSlowestTest(): Test {
        if (this.cache.length === 0) {
            throw new Error(`There are no tests in this cache, could not get the slowest test`);
        }

        this.ensureSortedCache();
        return this.cache[0];
    }

    /**
     * Gets the k slowest tests across all suites, sorted by duration descending
     */
    public getKSlowestTests(k: number): Test[] {
        if (!Number.isInteger(k) || k <= 0) {
            throw new Error(`Desired number of tests (k) must be a positive integer, ${k} is invalid`);
        }
        if (this.cache.length < k) {
            throw new Error(`Desired number of tests (k = ${k}) is greater than the total number of tests (${this.cache.length})`);
        }

        this.ensureSortedCache();
        const endIndex: number = Math.min(k, this.cache.length);
        return this.cache.slice(0, endIndex);
    }

    /**
     * Gets all tests sorted by duration descending (slowest first)
     */
    public getAllTestsSlowestFirst(): Test[] {
        this.ensureSortedCache();
        return [...this.cache];
    }

    /**
     * Gets the fastest test across all suites
     */
    public getFastestTest(): Test {
        if (this.cache.length === 0) {
            throw new Error(`There are no tests in this cache, could not get the fastest test`);
        }

        this.ensureSortedCache();
        return this.cache[this.cache.length - 1];
    }

    /**
     * Gets the k fastest tests across all suites, sorted by duration ascending
     */
    public getKFastestTests(k: number): Test[] {
        if (!Number.isInteger(k) || k <= 0) {
            throw new Error('Desired number of tests (k) must be a positive integer, ${k} is invalid');
        }
        if (this.cache.length < k) {
            throw new Error(`Desired number of tests (k = ${k}) is greater than the total number of tests (${this.cache.length})`);
        }

        this.ensureSortedCache();
        const startIndex: number = Math.max(0, this.cache.length - k);
        return this.cache.slice(startIndex).reverse();
    }

    /**
     * Gets all tests sorted by duration ascending (fastest first)
     */
    public getAllTestsFastestFirst(): Test[] {
        this.ensureSortedCache();
        return [...this.cache].reverse();
    }

    /**
     * Adds a test to the cache and invalidates the sorted cache
     *
     * @param test The test to add
     */
    public addTest(test: Test): void {
        this.cache.push(test);
        this.sortedCacheValid = false;
    }

    /**
     * Rebuilds the sorted cache if invalid
     */
    private ensureSortedCache(): void {
        if (!this.sortedCacheValid) {
            // Sort by duration in descending order (slowest goes first)
            this.cache.sort((a: Test, b: Test): number => b.duration - a.duration);
            this.sortedCacheValid = true;
        }
    }
}

export default SortedTestCache;

import { Test } from "../types/structures.ts";

/**
 * Manages a lazy-loaded sorted cache of tests for efficient retrieval of fastest/slowest tests
 */
class SortedTestCache {

    // All tests in their insertion order
    private allTests: Test[] = [];

    // Cached sorted tests (slowest first)
    private cachedSortedTests: Test[] | null = null;

    // Whether the sorted cache is valid
    private sortedCacheValid: boolean = false;

    /**
     * Gets the slowest test across all suites
     */
    public getSlowestTest(): Test {
        if (this.allTests.length === 0) {
            throw new Error(`Error: There are no tests in this cache, could not get the slowest test`);
        }

        this.ensureSortedCache();
        return this.cachedSortedTests![0];
    }

    /**
     * Gets the n slowest tests across all suites, sorted by duration descending
     */
    public getNSlowestTests(n: number): Test[] {
        if (!Number.isInteger(n) || n <= 0) {
            throw new Error('Number of tests (n) must be a positive integer');
        }

        this.ensureSortedCache();
        return this.cachedSortedTests!.slice(0, Math.min(n, this.cachedSortedTests!.length));
    }

    /**
     * Gets the fastest test across all suites
     */
    public getFastestTest(): Test {
        if (this.allTests.length === 0) {
            throw new Error(`Error: There are no tests in this cache, could not get the fastest test`);
        }

        this.ensureSortedCache();
        return this.cachedSortedTests![this.cachedSortedTests!.length - 1];
    }

    /**
     * Gets the n fastest tests across all suites, sorted by duration ascending
     */
    public getNFastestTests(n: number): Test[] {
        if (!Number.isInteger(n) || n <= 0) {
            throw new Error('Number of tests (n) must be a positive integer');
        }

        this.ensureSortedCache();
        const startIndex: number = Math.max(0, this.cachedSortedTests!.length - n);
        return this.cachedSortedTests!.slice(startIndex).reverse();
    }

    /**
     * Adds a test to the cache and invalidates the sorted cache
     *
     * @param test The test to add
     */
    public addTest(test: Test): void {
        this.allTests.push(test);
        this.sortedCacheValid = false;
    }

    /**
     * Rebuilds the sorted cache if invalid
     */
    private ensureSortedCache(): void {
        if (!this.sortedCacheValid) {
            // Sort by duration in descending order (slowest goes first)
            this.cachedSortedTests = [...this.allTests].sort((a: Test, b: Test): number => b.duration - a.duration);
            this.sortedCacheValid = true;
        }
    }
}

export default SortedTestCache;

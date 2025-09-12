import { Test } from "../types/structures.ts";

class LazyCache {

    public constructor() { }

    // All tests in order of insertion
    private readonly testsInInsertionOrder: Test[] = [];

    // All tests sorted from slowest to fastest (decreasing duration)
    private allTestsSlowestFirst: Test[] = [];
    // All tests sorted from fastest to slowest (increasing duration)
    private allTestsFastestFirst: Test[] = [];

    private sortedTestsValid: boolean = false;


    /**
     * Adds a test to this cache (must be called after every test addition in order)
     */
    public addTest(test: Test): void {
        this.testsInInsertionOrder.push(test);

        // Invalidate caches
        this.sortedTestsValid = false;
    }

    /**
     * Gets the total number of tests in this metrics instance
     */
    public getNumTests(): number {
        return this.testsInInsertionOrder.length;
    }

    /**
     * Returns an array with all tests in this metrics instance, in the order they were inserted in
     */
    public getAllTestsInOrder(): Test[] {
        return this.testsInInsertionOrder;
    }

    /**
     * Gets all tests by their completion duration, slowest (longer duration) first
     *
     * Requires a cache rebuild (O(n * log(n)) sort) after an insertion
     */
    public getAllTestsSlowestFirst(): Test[] {
        this.ensuredSortedTests();
        return this.allTestsSlowestFirst;
    }

    /**
     * Gets all tests by their completion duration, fastest (lower duration) first
     *
     * Requires a cache rebuild (O(n * log(n)) sort) after an insertion
     */
    public getAllTestsFastestFirst(): Test[] {
        this.ensuredSortedTests();
        return this.allTestsFastestFirst;
    }

    /**
     * Ensures sorted test caches (allTestsSlowestFirst & allTestsFastestFirst) are valid
     */
    private ensuredSortedTests(): void {

        // Skip if valid
        if (this.sortedTestsValid) {
            return;
        }

        this.allTestsSlowestFirst = [...this.testsInInsertionOrder].sort((a: Test, b: Test): number => b.duration - a.duration);

        // Manual reverse in-place for efficiency
        const len: number = this.allTestsSlowestFirst.length;
        const startIndex: number = len - 1;
        this.allTestsFastestFirst = new Array(len);
        for (let i: number = 0; i < len; ++i) {
            this.allTestsFastestFirst[i] = this.allTestsSlowestFirst[startIndex - i];
        }

        this.sortedTestsValid = true;
    }
}

export default LazyCache;

import SuiteMetrics, { Test, StructureMetadata } from "suite-metrics";
import { createNestedTestData } from "../generators/testDataHelpers.ts";
import { assert } from "chai";
import { DEFAULT_OPTIONS, TestDataOptions } from "../generators/options.ts";

suite("Performance", function () {

    /**
     * Generates a suite metrics with the specified options & verifies the result
     *
     * @param genOpts Options for createNestedTestData
     * @param concurrent If a ConcurrentSuiteMetrics should be used
     * @param expected Expected number of tests (1% error is verified)
     */
    function runTest(genOpts: Partial<TestDataOptions>, concurrent: boolean, expected: number): void {
        const startTime: number = performance.now();
        const metrics = createNestedTestData(concurrent, genOpts) as SuiteMetrics;
        const afterGenerate: number = performance.now();

        // Print out general metrics
        const totalTests: number = metrics.metrics.getTotalTestCount();
        const testDiff: number = Math.abs(expected - totalTests);
        const infoString: string = `${(totalTests < expected ? '-' : '+')}${testDiff} from target, ${100 * (testDiff / expected)}% error`;
        console.log(`Total tests: ${totalTests} (${infoString})`);
        assert.closeTo(totalTests, expected, expected / 100, `There should be ${expected} +- ${expected / 100} total tests`);

        const structureMetadata: StructureMetadata = metrics.metrics.getStructureMetadata();
        console.log(`Structure metadata: ${JSON.stringify(structureMetadata, null, 4)}`);

        // Validate various stats
        const avgDuration: number = structureMetadata.timing.averageDuration;
        assert.equal(metrics.metrics.getAverageTestDuration(), avgDuration);
        assert.isAtLeast(avgDuration, DEFAULT_OPTIONS.minDuration);
        assert.isAtMost(avgDuration, DEFAULT_OPTIONS.maxDuration);

        const medianDuration: number = structureMetadata.timing.medianDuration;
        assert.equal(metrics.metrics.getMedianTestDuration(), medianDuration);
        assert.isAtLeast(medianDuration, DEFAULT_OPTIONS.minDuration);
        assert.isAtMost(medianDuration, DEFAULT_OPTIONS.maxDuration);

        const allTestsSlowestFirst: Test[] = metrics.performance.getAllTestsSlowestFirst();

        // Print out performance info
        const endTime: number = performance.now();

        console.log("===Performance===");
        console.log(`Generation time: ${msToString(afterGenerate - startTime)}`);
        console.log(`Validation time: ${msToString(endTime - afterGenerate)}`);

        console.log('\n'); // 2x newline to separate
    }

    /**
     * Turns a number of ms to a readable string
     */
    function msToString(ms: number): string {
        const rounded: number = Math.round(ms);
        if (rounded < 1000) {
            return `${rounded} ms`;
        }
        if (rounded < 60_000) {
            return `${Math.floor(rounded / 1000)} seconds ${rounded % 1000} ms`;
        }

        const minutes: number = Math.floor(rounded / 60_000);
        const seconds: number = Math.floor((rounded % 60_000) / 1000);
        const milliseconds: number = rounded % 1000;
        return `${minutes} minutes ${seconds} seconds ${milliseconds} ms`;
    }

    suite("10k tests", function() {
        test("10k suites", function() {
            const generatorOptions = {
                numSuites: 9,
                testsPerSuite: 1,
                maxDepth: 4,
                subSuitesPerSuite: 10
            };

            runTest(generatorOptions, false, 10_000);
        });

        test("Balanced", function() {
            const generatorOptions = {
                numSuites: 1,
                testsPerSuite: 27,
                maxDepth: 4,
                subSuitesPerSuite: 7
            };

            runTest(generatorOptions, false, 10_000);
        });

        test("Wide & shallow", function() {
            const generatorOptions = {
                numSuites: 13,
                testsPerSuite: 9,
                maxDepth: 3,
                subSuitesPerSuite: 9
            };

            runTest(generatorOptions, false, 10_000);
        });
    });

    suite("100k tests", function() {

        this.timeout(30_000); // 30s max for these tests

        test("100k suites", function() {
            const generatorOptions = {
                numSuites: 9,
                testsPerSuite: 1,
                maxDepth: 5,
                subSuitesPerSuite: 10
            };

            runTest(generatorOptions, false, 100_000);
        });

        test("Balanced", function() {
            const generatorOptions = {
                numSuites: 5,
                testsPerSuite: 19,
                maxDepth: 4,
                subSuitesPerSuite: 10
            };

            runTest(generatorOptions, false, 100_000);
        });

        test("Mid depth", function() {
            const generatorOptions = {
                numSuites: 10,
                testsPerSuite: 27,
                maxDepth: 4,
                subSuitesPerSuite: 7
            };

            runTest(generatorOptions, false, 100_000);
        });
    });

    suite("1 million tests", function() {
        // Skip if not running large tests
        if (!process.env.RUN_LARGE) {
            return;
        }

        this.timeout(300_000); // 5 min max for these tests

        test("100k suites", function() {
            const generatorOptions = {
                numSuites: 9,
                testsPerSuite: 1,
                maxDepth: 6,
                subSuitesPerSuite: 10
            };

            runTest(generatorOptions, false, 1_000_000);
        });

        test("Balanced", function() {
            const generatorOptions = {
                numSuites: 5,
                testsPerSuite: 19,
                maxDepth: 5,
                subSuitesPerSuite: 10
            };

            runTest(generatorOptions, false, 1_000_000);
        });

        test("Mid depth", function() {
            const generatorOptions = {
                numSuites: 19,
                testsPerSuite: 37,
                maxDepth: 5,
                subSuitesPerSuite: 6
            };

            runTest(generatorOptions, false, 1_000_000);
        });
    });
});

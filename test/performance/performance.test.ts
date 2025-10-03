import SuiteMetrics from "suite-metrics";
import { createNestedTestData } from "../generators/testDataHelpers.js";
import { assert } from "chai";
import { TestDataOptions } from "../generators/options.js";

suite("Performance", function () {

    /**
     * Generates a suite metrics with the specified options & verifies the result
     *
     * @param genOpts Options for createNestedTestData
     * @param concurrent If a ConcurrentSuiteMetrics should be used
     * @param expected Expected number of tests (1% error is verified)
     */
    function runTest(genOpts: Partial<TestDataOptions>, concurrent: boolean, expected: number): void {
        const metrics = createNestedTestData(concurrent, genOpts) as SuiteMetrics;

        const totalTests: number = metrics.metrics.getTotalTestCount();
        console.log(`Total tests: ` + totalTests);
        assert.closeTo(totalTests, expected, expected / 100, `There should be ${expected} +- ${expected / 100} total tests`);

        console.log();
    }

    suite("10k tests", function() {
        test("10k suites", function() {
            const generatorOptions = {
                numSuites: 9,
                testsPerSuite: 1,
                maxDepth: 4,
                subSuitesPerSuite: 10,

                minDuration: 500,
                maxDuration: 50_000
            };

            runTest(generatorOptions, false, 10_000);
        });

        test("Balanced", function() {
            const generatorOptions = {
                numSuites: 1,
                testsPerSuite: 27,
                maxDepth: 4,
                subSuitesPerSuite: 7,

                minDuration: 500,
                maxDuration: 50_000
            };

            runTest(generatorOptions, false, 10_000);
        });

        test("Wide & shallow", function() {
            const generatorOptions = {
                numSuites: 13,
                testsPerSuite: 9,
                maxDepth: 3,
                subSuitesPerSuite: 9,

                minDuration: 500,
                maxDuration: 50_000
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
                subSuitesPerSuite: 10,

                minDuration: 500,
                maxDuration: 50_000
            };

            const metrics = createNestedTestData(false, generatorOptions) as SuiteMetrics;

            console.log(`Total tests: ` + metrics.metrics.getTotalTestCount());
        });

        test("Balanced", function() {
            const generatorOptions = {
                numSuites: 5,
                testsPerSuite: 19,
                maxDepth: 4,
                subSuitesPerSuite: 10,

                minDuration: 500,
                maxDuration: 50_000
            };

            const metrics = createNestedTestData(false, generatorOptions) as SuiteMetrics;

            console.log(`Total tests: ` + metrics.metrics.getTotalTestCount());
        });

        test("Mid depth", function() {
            const generatorOptions = {
                numSuites: 10,
                testsPerSuite: 27,
                maxDepth: 4,
                subSuitesPerSuite: 7,

                minDuration: 500,
                maxDuration: 50_000
            };

            const metrics = createNestedTestData(false, generatorOptions) as SuiteMetrics;

            console.log(`Total tests: ` + metrics.metrics.getTotalTestCount());
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

            const metrics = createNestedTestData(false, generatorOptions) as SuiteMetrics;

            console.log(`Total tests: ` + metrics.metrics.getTotalTestCount());
        });

        test("Balanced", function() {
            const generatorOptions = {
                numSuites: 5,
                testsPerSuite: 19,
                maxDepth: 5,
                subSuitesPerSuite: 10
            };

            const metrics = createNestedTestData(false, generatorOptions) as SuiteMetrics;

            console.log(`Total tests: ` + metrics.metrics.getTotalTestCount());
        });

        test("Mid depth", function() {
            const generatorOptions = {
                numSuites: 19,
                testsPerSuite: 37,
                maxDepth: 5,
                subSuitesPerSuite: 6
            };

            const metrics = createNestedTestData(false, generatorOptions) as SuiteMetrics;

            console.log(`Total tests: ` + metrics.metrics.getTotalTestCount());
        });
    });
});

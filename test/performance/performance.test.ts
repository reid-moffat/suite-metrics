import SuiteMetrics from "suite-metrics";
import { createNestedTestData } from "../generators/testDataHelpers.js";
import { assert } from "chai";

suite("Performance", function () {

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

            const metrics = createNestedTestData(false, generatorOptions) as SuiteMetrics;

            const totalTests: number = metrics.metrics.getTotalTestCount();
            console.log(`Total tests: ` + totalTests);
            assert.closeTo(totalTests, 10_000, 10, "There should be 10_000 +- 10 total tests");
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

            const metrics = createNestedTestData(false, generatorOptions) as SuiteMetrics;

            const totalTests: number = metrics.metrics.getTotalTestCount();
            console.log(`Total tests: ` + totalTests);
            assert.closeTo(totalTests, 10_000, 10, "There should be 10_000 +- 10 total tests");
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

            const metrics = createNestedTestData(false, generatorOptions) as SuiteMetrics;

            const totalTests: number = metrics.metrics.getTotalTestCount();
            console.log(`Total tests: ` + totalTests);
            assert.closeTo(totalTests, 10_000, 10, "There should be 10_000 +- 10 total tests");
        });
    });

    suite("100k tests", function() {
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

    /*
    For 1m tests:

    Minimal Tests Per Suite:

   {
     numSuites: 9,
     testsPerSuite: 1,
     maxDepth: 6,
     subSuitesPerSuite: 10
   }
   // → 999,999 tests (0.00% error)

Balanced Structure:

   {
     numSuites: 5,
     testsPerSuite: 19,
     maxDepth: 5,
     subSuitesPerSuite: 10
   }
   // → 999,995 tests (0.00% error)

More Realistic Structure:

   {
     numSuites: 19,
     testsPerSuite: 37,
     maxDepth: 5,
     subSuitesPerSuite: 6
   }
   // → 999,666 tests (0.03% error)
     */
});

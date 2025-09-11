import SuiteMetrics from "suite-metrics";
import { createNestedTestData } from "../generators/testDataHelpers.js";

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

            console.log(`Total tests: ` + metrics.metrics.getTotalTestCount());
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

            console.log(`Total tests: ` + metrics.metrics.getTotalTestCount());
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

            console.log(`Total tests: ` + metrics.metrics.getTotalTestCount());
        });
    });

    /* TODO
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
     */
});

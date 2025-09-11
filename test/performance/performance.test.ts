import { createNestedTestData } from "../generators/testDataHelpers.js";
import SuiteMetrics from "suite-metrics";

suite("Performance", function () {

    test("10k tests", function() {
        const generatorOptions = {
            numSuites: 10,
            testsPerSuite: 10,
            maxDepth: 3,
            subSuitesPerSuite: 10,
            minDuration: 500,
            maxDuration: 50_000
        };

        const metrics = createNestedTestData(false, generatorOptions) as SuiteMetrics;

        console.log(`Total tests: ` + metrics.metrics.getTotalTestCount());
    });

    test("100k tests", function() {

    });

    test("1m tests", function() {

    });
});

import SuiteMetrics, { Test } from "suite-metrics";
import serialize from "serialize-javascript";
import { createSimpleTestData } from "../../generators/testDataHelpers.js";
import { assert } from "chai";
import { DEFAULT_OPTIONS } from "../../generators/options.js";

suite("[Statistics] getAllTestsWithZScores", function () {

    test("Simple data", function() {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;
        const result: { test: Test, zScore: number }[] = instance.statistics.getAllTestsWithZScores();
        console.log(`Result: ${serialize(result, 4)}`);

        assert.lengthOf(result, DEFAULT_OPTIONS.testsPerSuite * DEFAULT_OPTIONS.numSuites);
        assert.lengthOf(result, instance.metrics.getTotalTestCount());
    });
});

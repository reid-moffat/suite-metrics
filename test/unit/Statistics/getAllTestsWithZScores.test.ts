import SuiteMetrics, { Test } from "suite-metrics";
import serialize from "serialize-javascript";
import { createSimpleTestData } from "../../generators/testDataHelpers.js";
import { assert } from "chai";

suite("[Statistics] getAllTestsWithZScores", function () {

    test("Simple data", function() {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;
        const result: { test: Test, zScore: number }[] = instance.statistics.getAllTestsWithZScores();
        console.log(`Result: ${serialize(result, 4)}`);


    });
});

import SuiteMetrics, { Test } from "suite-metrics";
import serialize from "serialize-javascript";
import { createSimpleTestData } from "../../generators/testDataHelpers.js";
import { assert } from "chai";

suite("[Statistics] getTestZScore", function () {

    test("Simple data", function() {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;
        const tests: Test[] = instance.getTestsInOrder();
        const result: number = instance.statistics.getTestZScore(tests[0]);
        console.log(`Result: ${serialize(result, 4)}`);


    });
});

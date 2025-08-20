import SuiteMetrics, { Test } from "suite-metrics";
import serialize from "serialize-javascript";
import { createSimpleTestData } from "../../generators/testDataHelpers.js";
import { assert } from "chai";

suite("[Performance] getFastestTest", function () {

    test("Simple data", function() {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;
        const result: Test = instance.performance.getFastestTest();
        console.log(`Result: ${serialize(result, 4)}`);

        assert.exists(result);
        const allTests: Test[] = instance.performance.getAllTestsSlowestFirst();
        assert.deepEqual(result, allTests[allTests.length - 1]);
    });
});

import SuiteMetrics, { Test } from "suite-metrics";
import serialize from "serialize-javascript";
import { createSimpleTestData } from "../../generators/testDataHelpers.js";
import { assert } from "chai";

suite("[Performance] getKFastestTests", function () {

    test("Simple data", function() {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;
        const result: Test[] = instance.performance.getKFastestTests(2);
        console.log(`Result: ${serialize(result, 4)}`);

        assert.lengthOf(result, 2);
        const allTests: Test[] = instance.performance.getAllTestsSlowestFirst();
        assert.deepEqual(result[0], allTests[allTests.length - 1]);
        assert.deepEqual(result[1], allTests[allTests.length - 2]);
    });
});

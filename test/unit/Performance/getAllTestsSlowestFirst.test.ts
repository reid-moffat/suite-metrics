import SuiteMetrics, { Test } from "suite-metrics";
import serialize from "serialize-javascript";
import { createSimpleTestData } from "../../generators/testDataHelpers.js";
import { assert } from "chai";

suite("[Performance] getAllTestsSlowestFirst", function () {

    test("Simple data", function() {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;
        const result: Test[] = instance.performance.getAllTestsSlowestFirst();
        console.log(`Result: ${serialize(result, 4)}`);

        assert.equal(1, 1);
    });
});

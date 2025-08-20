import { Test } from "suite-metrics";
import { createSimpleTestData } from "../../../generators/testDataHelpers.js";
import { assert } from "chai";

suite("[BaseSuiteMetrics] getTestsInOrder", function() {

    test("Simple test data", function() {
        const instance = createSimpleTestData(false);

        const result: Test[] = instance.getTestsInOrder();

        assert.equal(result.length, instance.metrics.getTotalTestCount());
    });
});

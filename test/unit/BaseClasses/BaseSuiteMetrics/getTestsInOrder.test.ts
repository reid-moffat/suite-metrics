import SuiteMetrics, { BaseSuiteMetrics, Test } from "suite-metrics";
import { createSimpleTestData } from "../../../generators/testDataHelpers.js";
import { assert } from "chai";
import { validateTest } from "../../../helpers/validators.js";

suite("[BaseSuiteMetrics] getTestsInOrder", function() {

    /**
     * Gets and deeply validates all tests in order
     */
    function runTest(instance: BaseSuiteMetrics) {
        const results: Test[] = instance.getTestsInOrder();

        assert.equal(results.length, instance.metrics.getTotalTestCount());

        for (let i: number = 0; i < results.length; ++i) {
            validateTest(results[i]);
        }
    }

    test("Simple test data", function() {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;
        runTest(instance);
    });
});

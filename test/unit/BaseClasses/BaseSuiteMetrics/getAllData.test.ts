import SuiteMetrics, { BaseSuiteMetrics, ConcurrentSuiteMetrics, Suite } from "suite-metrics";
import { createNestedTestData, createSimpleTestData } from "../../../generators/testDataHelpers.js";
import { assert } from "chai";

suite("[BaseSuiteMetrics] getAllData", function() {

    /**
     * Gets and deeply validates a top-level suite
     */
    function runTest(instance: BaseSuiteMetrics) {
        const result: Suite = instance.getAllData();

        assert.equal(result.aggregateData.numTests, instance.metrics.getTotalTestCount());
    }

    test("Simple data", function() {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;
        runTest(instance);
    });

    test("Simple data concurrent", function() {
        const instance: ConcurrentSuiteMetrics = createSimpleTestData(true) as ConcurrentSuiteMetrics;
        runTest(instance);
    });

    test("Nested data", function() {
        const instance: SuiteMetrics = createNestedTestData() as SuiteMetrics;
        runTest(instance);
    });
});

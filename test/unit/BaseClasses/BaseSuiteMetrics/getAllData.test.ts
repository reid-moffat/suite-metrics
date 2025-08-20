import { Suite } from "suite-metrics";
import { createSimpleTestData } from "../../../generators/testDataHelpers.js";
import { assert } from "chai";

suite("[BaseSuiteMetrics] getAllData", function() {

    test("Simple test data", function() {
        const instance = createSimpleTestData(false);

        const result: Suite = instance.getAllData();

        assert.equal(result.aggregateData.numTests, instance.metrics.getTotalTestCount());
    });
});

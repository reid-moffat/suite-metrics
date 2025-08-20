import SuiteMetrics from "suite-metrics";
import serialize from "serialize-javascript";
import { createSimpleTestData } from "../../generators/testDataHelpers.js";
import { assert } from "chai";
import { DEFAULT_OPTIONS } from "../../generators/options.js";

suite("[Statistics] getStandardDeviation", function () {

    test("Simple data", function() {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;
        const stDev: number = instance.statistics.getStandardDeviation();
        console.log(`Standard deviation: ${serialize(stDev, 4)}`);

        assert.isAtLeast(stDev, 0);
        assert.isAtMost(stDev, (DEFAULT_OPTIONS.maxDuration - DEFAULT_OPTIONS.minDuration) / 2);
    });
});

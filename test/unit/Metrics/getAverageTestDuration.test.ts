import SuiteMetrics, { BaseSuiteMetrics, Test } from "suite-metrics";
import { assert } from "chai";
import { createSimpleTestData } from "../../generators/testDataHelpers.ts";
import { DEFAULT_OPTIONS } from "../../generators/options.ts";

suite("[Metrics] getAverageTestDuration", function () {

    /**
     * Gets and deeply validates the average test duration for an instance
     */
    function runTest(instance: BaseSuiteMetrics) {
        const averageDuration: number = instance.metrics.getAverageTestDuration();

        assert.isNumber(averageDuration, `Average duration must be a number`);

        assert.isAtLeast(averageDuration, DEFAULT_OPTIONS.minDuration, `Average duration is below min test duration`);
        assert.isAtMost(averageDuration, DEFAULT_OPTIONS.maxDuration, `Average duration is above max test duration`);

        const allTests: Test[] = instance.getTestsInOrder();
        const calculatedTotal: number = allTests.reduce((acc: number, curr: Test): number => acc + curr.duration, 0);
        const calculatedAverage: number = calculatedTotal / allTests.length;

        assert.strictEqual(averageDuration, calculatedAverage, `Expected and calculated average don't match`);
    }

    test("Simple data", function () {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;

        const result: number = instance.metrics.getAverageTestDuration();

        assert.isAtLeast(result, DEFAULT_OPTIONS.minDuration);
        assert.isAtMost(result, DEFAULT_OPTIONS.maxDuration);
    });
});

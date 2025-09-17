import SuiteMetrics, { BaseSuiteMetrics, ConcurrentSuiteMetrics, Test } from "suite-metrics";
import { assert } from "chai";
import {
    createNestedTestData,
    createPresetData,
    createSimpleTestData,
    PRESET_TYPE
} from "../../generators/testDataHelpers.ts";
import { DEFAULT_OPTIONS } from "../../generators/options.ts";

suite("[Metrics] getAverageTestDuration", function () {

    /**
     * Gets and deeply validates the average test duration for an instance
     */
    function runTest(instance: BaseSuiteMetrics) {
        const averageDuration: number = instance.metrics.getAverageTestDuration();
        assert.isNumber(averageDuration, `Average duration must be a number`);

        const allTests: Test[] = instance.getTestsInOrder();
        const calculatedTotal: number = allTests.reduce((acc: number, curr: Test): number => acc + curr.duration, 0);
        const calculatedAverage: number = allTests.length === 0 ? 0 : Math.round(calculatedTotal / allTests.length);

        if (allTests.length > 0) {
            assert.isAtLeast(averageDuration, DEFAULT_OPTIONS.minDuration, `Average duration is below min test duration`);
            assert.isAtMost(averageDuration, DEFAULT_OPTIONS.maxDuration, `Average duration is above max test duration`);
        }

        assert.strictEqual(averageDuration, calculatedAverage, `Expected and calculated average don't match`);
    }


    test("Empty instance", function() {
        const instance: SuiteMetrics = new SuiteMetrics();
        runTest(instance);
    });

    test("Empty instance - concurrent", function() {
        const instance: ConcurrentSuiteMetrics = new ConcurrentSuiteMetrics();
        runTest(instance);
    });

    test("Simple data", function() {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;
        runTest(instance);
    });

    test("Simple data - concurrent", function() {
        const instance: ConcurrentSuiteMetrics = createSimpleTestData(true) as ConcurrentSuiteMetrics;
        runTest(instance);
    });

    test("Nested data", function() {
        const instance: SuiteMetrics = createNestedTestData() as SuiteMetrics;
        runTest(instance);
    });

    test("Nested data - concurrent", function() {
        const instance: ConcurrentSuiteMetrics = createNestedTestData(true) as ConcurrentSuiteMetrics;
        runTest(instance);
    });

    test("Normal preset", function() {
        const instance: SuiteMetrics = createPresetData(false, PRESET_TYPE.NORMAL) as SuiteMetrics;
        runTest(instance);
    });

    test("Normal preset - concurrent", function() {
        const instance: ConcurrentSuiteMetrics = createPresetData(true, PRESET_TYPE.NORMAL) as ConcurrentSuiteMetrics;
        runTest(instance);
    });

    test("Large preset", function() {
        const instance: SuiteMetrics = createPresetData(false, PRESET_TYPE.LARGE_SUITE) as SuiteMetrics;
        runTest(instance);
    });

    test("Large preset - concurrent", function() {
        const instance: ConcurrentSuiteMetrics = createPresetData(true, PRESET_TYPE.LARGE_SUITE) as ConcurrentSuiteMetrics;
        runTest(instance);
    });

    test("Realistic preset", function() {
        const instance: SuiteMetrics = createPresetData(false, PRESET_TYPE.REALISTIC_PREMADE) as SuiteMetrics;
        runTest(instance);
    });

    test("Realistic preset - concurrent", function() {
        const instance: ConcurrentSuiteMetrics = createPresetData(true, PRESET_TYPE.REALISTIC_PREMADE) as ConcurrentSuiteMetrics;
        runTest(instance);
    });

    test("Edge case preset", function() {
        const instance: SuiteMetrics = createPresetData(false, PRESET_TYPE.EDGE_CASES) as SuiteMetrics;
        runTest(instance);
    });

    test("Edge case preset - concurrent", function() {
        const instance: ConcurrentSuiteMetrics = createPresetData(true, PRESET_TYPE.EDGE_CASES) as ConcurrentSuiteMetrics;
        runTest(instance);
    });
});

import SuiteMetrics, { BaseSuiteMetrics, ConcurrentSuiteMetrics, Suite } from "suite-metrics";
import {
    createNestedTestData,
    createPresetData,
    createSimpleTestData,
    PRESET_TYPE
} from "../../generators/testDataHelpers.ts";

suite("[Query] getSuite", function () {

    /**
     * Gets tests to run for an instance
     */
    function runInstance(instance: BaseSuiteMetrics) {
        const topLevelSuites: string[] = instance.queries.getSuiteNames([]);
        for (const suiteName of topLevelSuites) {
            runTest(instance, [suiteName]);
        }
    }

    /**
     * Gets and deeply validates a suite
     */
    function runTest(instance: BaseSuiteMetrics, suitePath: string[]) {
        const suite: Suite = instance.queries.getSuite(suitePath);
    }


    test("Empty instance", function() {
        const instance: SuiteMetrics = new SuiteMetrics();
        runInstance(instance);
    });

    test("Empty instance - concurrent", function() {
        const instance: ConcurrentSuiteMetrics = new ConcurrentSuiteMetrics();
        runInstance(instance);
    });

    test("Simple data", function() {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;
        runInstance(instance);
    });

    test("Simple data - concurrent", function() {
        const instance: ConcurrentSuiteMetrics = createSimpleTestData(true) as ConcurrentSuiteMetrics;
        runInstance(instance);
    });

    test("Nested data", function() {
        const instance: SuiteMetrics = createNestedTestData() as SuiteMetrics;
        runInstance(instance);
    });

    test("Nested data - concurrent", function() {
        const instance: ConcurrentSuiteMetrics = createNestedTestData(true) as ConcurrentSuiteMetrics;
        runInstance(instance);
    });

    test("Normal preset", function() {
        const instance: SuiteMetrics = createPresetData(false, PRESET_TYPE.NORMAL) as SuiteMetrics;
        runInstance(instance);
    });

    test("Normal preset - concurrent", function() {
        const instance: ConcurrentSuiteMetrics = createPresetData(true, PRESET_TYPE.NORMAL) as ConcurrentSuiteMetrics;
        runInstance(instance);
    });

    test("Large preset", function() {
        const instance: SuiteMetrics = createPresetData(false, PRESET_TYPE.LARGE_SUITE) as SuiteMetrics;
        runInstance(instance);
    });

    test("Large preset - concurrent", function() {
        const instance: ConcurrentSuiteMetrics = createPresetData(true, PRESET_TYPE.LARGE_SUITE) as ConcurrentSuiteMetrics;
        runInstance(instance);
    });

    test("Realistic preset", function() {
        const instance: SuiteMetrics = createPresetData(false, PRESET_TYPE.REALISTIC_PREMADE) as SuiteMetrics;
        runInstance(instance);
    });

    test("Realistic preset - concurrent", function() {
        const instance: ConcurrentSuiteMetrics = createPresetData(true, PRESET_TYPE.REALISTIC_PREMADE) as ConcurrentSuiteMetrics;
        runInstance(instance);
    });

    test("Edge case preset", function() {
        const instance: SuiteMetrics = createPresetData(false, PRESET_TYPE.EDGE_CASES) as SuiteMetrics;
        runInstance(instance);
    });

    test("Edge case preset - concurrent", function() {
        const instance: ConcurrentSuiteMetrics = createPresetData(true, PRESET_TYPE.EDGE_CASES) as ConcurrentSuiteMetrics;
        runInstance(instance);
    });
});

import SuiteMetrics, { BaseSuiteMetrics, ConcurrentSuiteMetrics, StructureMetadata, Suite } from "suite-metrics";
import { assert } from "chai";
import {
    createNestedTestData,
    createPresetData,
    createSimpleTestData,
    PRESET_TYPE
} from "../../generators/testDataHelpers.ts";

suite("[Metrics] getStructureMetadata", function () {

    /**
     * Runs a test for the given instance; getting, printing, and validating metadata
     */
    function runTest(instance: BaseSuiteMetrics) {
        const structureMetadata: StructureMetadata = instance.metrics.getStructureMetadata();

        console.log(`Structure metadata: ${JSON.stringify(structureMetadata, null, 4)}`);
        ValidateStructureMetadata(structureMetadata);
        ValidateStructureValues(structureMetadata, instance);
    }

    /**
     * Validates that an object exactly matches the StructureMetadata structure
     */
    function ValidateStructureMetadata(result: StructureMetadata) {

        // Top-level validation
        assert.isNotNull(result, `Expected structure to not be null`);
        assert.isObject(result, `Expected structure to be an object`);
        assert.isNotArray(result, `Expected structure to not be an array`);
        assert.isNotEmpty(result, `Expected structure to not be empty`);

        // Validate root-level keys
        const rootKeys: string[] = Object.keys(result);
        const expectedRootKeys: string[] = ['suites', 'timing'];
        assert.sameMembers(rootKeys, expectedRootKeys,
            `Root object should have exactly keys: ${expectedRootKeys.join(', ')}`);

        // Validate suites object
        const suites: any = result.suites;
        assert.isNotNull(suites, `Expected 'suites' object to not be null`);
        assert.isObject(suites, `Expected 'suites' to be an object`);
        assert.isNotArray(suites, `Expected 'suites' to not be an array`);
        assert.isNotEmpty(suites, `Expected 'suites' to not be empty`);

        const suitesKeys: string[] = Object.keys(suites);
        const expectedSuitesKeys: string[] = [
            'numSuites', 'numLeaves', 'numBranches', 'numHybrid',
            'averageTestsPerSuite', 'averageTestsPerNonEmptySuite',
            'maxDepth', 'minDepth', 'averageDepth', 'averageDepthWeighted'
        ];
        assert.sameMembers(suitesKeys, expectedSuitesKeys,
            `suites object should have exactly keys: ${expectedSuitesKeys.join(', ')}`);

        // Validate all suites properties are numbers
        expectedSuitesKeys.forEach((key: string): void => {
            assert.isNumber(suites[key], `Expected suites.${key} to be a number`);
            assert.isNotNaN(suites[key], `Expected suites.${key} to not be NaN`);
        });

        // Validate timing object
        const timing: any = result.timing;
        assert.isNotNull(timing, `Expected 'timing' object to not be null`);
        assert.isObject(timing, `Expected 'timing' to be an object`);
        assert.isNotArray(timing, `Expected 'timing' object to not be an array`);
        assert.isNotEmpty(timing, `Expected 'timing' to not be empty`);

        const timingKeys: string[] = Object.keys(timing);
        const expectedTimingKeys: string[] = [
            'totalTests', 'totalTimeDiff', 'totalTestDuration',
            'percentActive', 'averageDuration', 'medianDuration'
        ];
        assert.sameMembers(timingKeys, expectedTimingKeys,
            `timing object should have exactly keys: ${expectedTimingKeys.join(', ')}`);

        // Validate all timing properties are numbers
        expectedTimingKeys.forEach((key: string): void => {
            assert.isNumber(timing[key], `Expected timing.${key} to be a number`);
            assert.isNotNaN(timing[key], `Expected timing.${key} to not be NaN`);
        });
    }

    /**
     * Validates all values are in the required range
     */
    function ValidateStructureValues(result: StructureMetadata, instance: BaseSuiteMetrics) {

        // First validate that
        const suitesKeys: string[] = Object.keys(result.suites);
        const timingKeys: string[] = Object.keys(result.timing);

        suitesKeys.forEach((key: string): void => { // @ts-ignore
            const val: number = result.suites[key];
            assert.isAtLeast(val, 0, `Key ${key} in 'suites' must have a non-negative value (value: ${val})`);
        });
        timingKeys.forEach((key: string): void => { // @ts-ignore
            const val: number = result.timing[key];
            assert.isAtLeast(val, 0, `Key ${key} in 'timing' must have a non-negative value (value: ${val})`);
        });


        // Check that various values make sense
        const topLevelSuite: Suite = instance.getAllData();
        type ValidationCase = {
            actual: number,
            expected: number,
            description: string
        };

        const testCases: ValidationCase[] = [
            {
                actual: result.timing.averageDuration,
                expected: Math.round(result.timing.totalTestDuration / result.timing.totalTests),
                description: 'averageDuration'
            },
            {
                actual: result.suites.numSuites,
                expected: result.suites.numLeaves + result.suites.numBranches + result.suites.numHybrid,
                description: 'numSuites'
            },
            {
                actual: result.suites.averageTestsPerSuite,
                expected: result.timing.totalTests / result.suites.numSuites,
                description: 'averageTestsPerSuite'
            },
            {
                actual: result.suites.averageTestsPerNonEmptySuite,
                expected: result.timing.totalTests / (result.suites.numLeaves + result.suites.numHybrid),
                description: 'averageTestsPerNonEmptySuite'
            },
            {
                actual: result.timing.percentActive,
                expected: result.timing.totalTestDuration / result.timing.totalTimeDiff,
                description: 'percentActive'
            },
            {
                actual: result.timing.totalTests,
                expected: topLevelSuite.aggregateData.numTests,
                description: 'totalTests'
            },
            {
                actual: result.timing.totalTestDuration,
                expected: topLevelSuite.aggregateData.totalTestTime,
                description: 'totalTestDuration'
            }
        ];

        testCases.forEach((test: ValidationCase): void => {
            const errMessage = `Expected ${test.description}: actual=${test.actual}, expected=${test.expected}`;
            assert.equal(test.actual, test.expected, errMessage);
        });

        const maxDepth: number = result.suites.maxDepth;
        const minDepth: number = result.suites.maxDepth;
        assert.isAtLeast(maxDepth, minDepth, `Max depth ${maxDepth} must be at least min depth ${minDepth}`);

        const totalDiff: number = result.timing.totalTimeDiff;
        const totalDuration: number = result.timing.totalTestDuration;
        assert.isAtLeast(totalDiff, totalDuration, `Total test diff ${totalDiff} must be at least total test duration ${totalDuration}`);

        const minDuration: number = instance.performance.getFastestTest().duration;
        const maxDuration: number = instance.performance.getSlowestTest().duration;
        const averageDuration: number = result.timing.averageDuration;
        const medianDuration: number = result.timing.medianDuration;
        assert.isAtLeast(averageDuration, minDuration, `Average duration ${averageDuration} must be at least the minimum duration ${minDuration}`);
        assert.isAtLeast(medianDuration, minDuration, `Median duration ${medianDuration} must be at least the minimum duration ${minDuration}`);
        assert.isAtMost(averageDuration, maxDuration, `Average duration ${averageDuration} must be at most the maximum duration ${maxDuration}`);
        assert.isAtMost(medianDuration, maxDuration, `Median duration ${medianDuration} must be at most the maximum duration ${maxDuration}`);
    }

    test("Simple data", function () {
        const instance: SuiteMetrics = createSimpleTestData() as SuiteMetrics;
        runTest(instance);
    });

    test("Nested data", function () {
        const instance: SuiteMetrics = createNestedTestData() as SuiteMetrics;
        runTest(instance);
    });

    test("Custom edge case data", function () {
        const instance: SuiteMetrics = createPresetData(false, PRESET_TYPE.EDGE_CASES) as SuiteMetrics;
        runTest(instance);
    });

    test("Custom large data", function () {
        const instance: SuiteMetrics = createPresetData(false, PRESET_TYPE.LARGE_SUITE) as SuiteMetrics;
        runTest(instance);
    });

    test("Custom large data concurrent", function () {
        const instance: ConcurrentSuiteMetrics = createPresetData(true, PRESET_TYPE.LARGE_SUITE) as ConcurrentSuiteMetrics;
        runTest(instance);
    });
});

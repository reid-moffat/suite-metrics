import SuiteMetrics, { BaseSuiteMetrics, ConcurrentSuiteMetrics, StructureMetadata } from "suite-metrics";
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
        ValidateStructureValues(structureMetadata);
    }

    /**
     * Validates that an object exactly matches the StructureMetadata structure
     */
    function ValidateStructureMetadata(obj: StructureMetadata) {

        // Top-level validation
        assert.isNotNull(obj, `Expected structure to not be null`);
        assert.isObject(obj, `Expected structure to be an object`);
        assert.isNotArray(obj, `Expected structure to not be an array`);
        assert.isNotEmpty(obj, `Expected structure to not be empty`);

        // Validate root-level keys
        const rootKeys: string[] = Object.keys(obj);
        const expectedRootKeys: string[] = ['suites', 'timing'];
        assert.sameMembers(rootKeys, expectedRootKeys,
            `Root object should have exactly keys: ${expectedRootKeys.join(', ')}`);

        // Validate suites object
        const suites: any = obj.suites;
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
        const timing: any = obj.timing;
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
    function ValidateStructureValues(obj: StructureMetadata) {

        // First validate that
        const suitesKeys: string[] = Object.keys(obj.suites);
        const timingKeys: string[] = Object.keys(obj.timing);

        suitesKeys.forEach((key: string): void => { // @ts-ignore
            const val: number = obj.suites[key];
            assert.isAtLeast(val, 0, `Key ${key} in 'suites' must have a non-negative value (value: ${val})`);
        });
        timingKeys.forEach((key: string): void => { // @ts-ignore
            const val: number = obj.timing[key];
            assert.isAtLeast(val, 0, `Key ${key} in 'timing' must have a non-negative value (value: ${val})`);
        });


        // Check that various values make sense
        type ValidationCase = {
            actual: number,
            expected: number,
            description: string
        };

        const testCases: ValidationCase[] = [
            {
                actual: obj.timing.averageDuration,
                expected: Math.round(obj.timing.totalTestDuration / obj.timing.totalTests),
                description: 'averageDuration'
            },
            {
                actual: obj.suites.numSuites,
                expected: obj.suites.numLeaves + obj.suites.numBranches + obj.suites.numHybrid,
                description: 'numSuites'
            },
            {
                actual: obj.suites.averageTestsPerSuite,
                expected: obj.timing.totalTests / obj.suites.numSuites,
                description: 'averageTestsPerSuite'
            },
            {
                actual: obj.suites.averageTestsPerNonEmptySuite,
                expected: obj.timing.totalTests / (obj.suites.numLeaves + obj.suites.numHybrid),
                description: 'averageTestsPerNonEmptySuite'
            }
        ];

        testCases.forEach((test: ValidationCase): void => {
            const errMessage = `Expected ${test.description}: actual=${test.actual}, expected=${test.expected}`;
            assert.equal(test.actual, test.expected, errMessage);
        });
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

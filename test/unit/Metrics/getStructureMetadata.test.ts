import SuiteMetrics, { StructureMetadata } from "suite-metrics";
import { assert } from "chai";
import { createNestedTestData } from "../../generators/testDataHelpers.ts";

suite("[Metrics] getStructureMetadata", function () {

    /**
     * Validates that an object exactly matches the StructureMetadata structure
     */
    function assertStructureMetadata(obj: any, path = '') {
        // Helper function to create descriptive error messages
        const getPath = (prop: any) => path ? `${path}.${prop}` : prop;

        // Check that obj is an object
        assert.isObject(obj, `Expected object at ${path || 'root'}`);
        assert.isNotArray(obj, `Expected object (not array) at ${path || 'root'}`);

        // Check root level has exactly the expected keys
        const rootKeys = Object.keys(obj);
        const expectedRootKeys = ['suites', 'timing'];
        assert.sameMembers(rootKeys, expectedRootKeys,
            `Root object should have exactly keys: ${expectedRootKeys.join(', ')}`);

        // Validate suites object
        const suites = obj.suites;
        assert.isObject(suites, `Expected object at ${getPath('suites')}`);
        assert.isNotArray(suites, `Expected object (not array) at ${getPath('suites')}`);

        const suitesKeys = Object.keys(suites);
        const expectedSuitesKeys = [
            'numSuites', 'numLeaves', 'numBranches', 'numHybrid',
            'averageTestsPerSuite', 'averageTestsPerNonEmptySuite',
            'maxDepth', 'minDepth', 'averageDepth', 'averageDepthWeighted'
        ];
        assert.sameMembers(suitesKeys, expectedSuitesKeys,
            `suites object should have exactly keys: ${expectedSuitesKeys.join(', ')}`);

        // Validate all suites properties are numbers
        expectedSuitesKeys.forEach(key => {
            assert.isNumber(suites[key], `Expected ${getPath(`suites.${key}`)} to be a number`);
            assert.isNotNaN(suites[key], `Expected ${getPath(`suites.${key}`)} to not be NaN`);
        });

        // Validate timing object
        const timing = obj.timing;
        assert.isObject(timing, `Expected object at ${getPath('timing')}`);
        assert.isNotArray(timing, `Expected object (not array) at ${getPath('timing')}`);

        const timingKeys = Object.keys(timing);
        const expectedTimingKeys = [
            'totalTimeDiff', 'totalTestDuration', 'percentActive',
            'averageDuration', 'medianDuration'
        ];
        assert.sameMembers(timingKeys, expectedTimingKeys,
            `timing object should have exactly keys: ${expectedTimingKeys.join(', ')}`);

        // Validate all timing properties are numbers
        expectedTimingKeys.forEach(key => {
            assert.isNumber(timing[key], `Expected ${getPath(`timing.${key}`)} to be a number`);
            assert.isNotNaN(timing[key], `Expected ${getPath(`timing.${key}`)} to not be NaN`);
        });
    }

    test("Simple data", function () {
        const instance: SuiteMetrics = createNestedTestData(false, { numSuites: 10, testsPerSuite: 10, maxDepth: 3 }) as SuiteMetrics;

        const result: StructureMetadata = instance.metrics.getStructureMetadata();

        console.log(`Result: ${JSON.stringify(result, null, 4)}`);
        assertStructureMetadata(result);
    });
});

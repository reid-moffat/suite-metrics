import { assert } from 'chai';
import SuiteMetrics, { SuiteData } from "suite-metrics";

suite("[SuiteMetrics] Basic tests", function() {

    let metrics: SuiteMetrics;

    setup(function() {
        metrics = new SuiteMetrics();
    });

    suite("Input Validation", function() {
        test("Non-array names", function() {
            // @ts-ignore - Testing runtime validation
            assert.throws(() => metrics.startTest("not an array"), "Suite/test path must be an array", 'Should throw error when test name is not an array');
        });

        test("Empty test name", function() {
            assert.throws(() => metrics.startTest([]), "A test must be inside a suite. E.g. [\"Suite 1\", \"Test 2\"] (at least two array elements)", 'Should throw error when test name array is empty');
        });

        test("Non-string elements", function() {
            // @ts-ignore - Testing runtime validation
            assert.throws(() => metrics.startTest(["suite", 123]), "Suite/test path element at index 1 must be a 'string', got 'number'", 'Should throw error when test name contains non-string element');
        });

        test("Empty suite name for top-level operations", function() {
            assert.doesNotThrow(() => metrics.queries.suiteExists([]), 'suiteExists should allow empty array for top-level');
            assert.doesNotThrow(() => metrics.metrics.getSuiteMetrics([]), 'getSuiteMetrics should allow empty array for top-level');
            assert.doesNotThrow(() => metrics.metrics.getSuiteMetrics([]), 'getSuiteMetricsRecursive should allow empty array for top-level');
        });
    });

    suite("Error Handling", function() {
        test("Stopping test without starting", function() {
            assert.throws(() => metrics.stopTest(), "No test is currently running. Call startTest() first to begin a test", 'Should throw error when stopping test without starting');
        });

        test("Non-existent suite", function() {
            assert.throws(() => metrics.metrics.getSuiteMetrics(["NonExistent"]), "Suite path [NonExistent] does not exist", 'Should throw error when accessing non-existent suite');
        });

        test("Non-existent test", function() {
            metrics.startTest(["NonExistent", "test2"]);
            metrics.stopTest();

            assert.throws(() => metrics.queries.getTest(["NonExistent", "Test"]), "Test [NonExistent, Test] does not exist", 'Should throw error when accessing non-existent test');
        });

        test("Test in non-existent suite", function() {
            metrics.startTest(["Suite1", "Test1"]);
            metrics.stopTest();

            assert.throws(() => metrics.queries.getTest(["Suite1", "NonExistentTest"]), "Test [Suite1, NonExistentTest] does not exist", 'Should throw error when accessing non-existent test in existing suite');
        });
    });

    suite("Multiple Tests and Suites", function() {
        test("Multiple tests in same suite", function() {
            // Create multiple tests
            metrics.startTest(["MultiTestSuite", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["MultiTestSuite", "Test2"]);
            metrics.stopTest();

            metrics.startTest(["MultiTestSuite", "Test3"]);
            metrics.stopTest();

            assert.isTrue(metrics.queries.testExists(["MultiTestSuite", "Test1"]), 'Test1 should exist');
            assert.isTrue(metrics.queries.testExists(["MultiTestSuite", "Test2"]), 'Test2 should exist');
            assert.isTrue(metrics.queries.testExists(["MultiTestSuite", "Test3"]), 'Test3 should exist');

            const suiteData = metrics.metrics.getSuiteMetrics(["MultiTestSuite"]);
            assert.strictEqual(suiteData.totalTestMetrics.numTests, 3, 'Suite should have 3 tests');
            assert.isNumber(suiteData.totalTestMetrics.totalTime, 'Suite should have numeric total time');
            assert.isAtLeast(suiteData.totalTestMetrics.totalTime, 0, 'Suite total time should be non-negative');
            assert.isNumber(suiteData.totalTestMetrics.averageTime, 'Suite should have numeric average time');
            assert.strictEqual(suiteData.totalTestMetrics.averageTime!, suiteData.totalTestMetrics.totalTime! / 3, 'Average time should equal total divided by count');
        });

        test("Multiple suites at same level", function() {
            metrics.startTest(["Suite1", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["Suite2", "Test2"]);
            metrics.stopTest();

            metrics.startTest(["Suite3", "Test3"]);
            metrics.stopTest();

            assert.isTrue(metrics.queries.suiteExists(["Suite1"]), 'Suite1 should exist');
            assert.isTrue(metrics.queries.suiteExists(["Suite2"]), 'Suite2 should exist');
            assert.isTrue(metrics.queries.suiteExists(["Suite3"]), 'Suite3 should exist');

            const topLevelData = metrics.metrics.getSuiteMetrics([]);
            assert.strictEqual(topLevelData.subTestMetrics.numTests, 3, 'Top level should have 3 sub-tests');
            assert.isArray(topLevelData.subSuites, 'Top level should have child suites array');
            assert.includeMembers(topLevelData.subSuites!, ["Suite1", "Suite2", "Suite3"], 'Top level should include all created suites');
        });
    });

    suite("Complex Hierarchies", function() {
        setup(function() {
            // Create a complex hierarchy:
            // TopSuite
            //   ├── DirectTest1
            //   ├── DirectTest2
            //   ├── SubSuite1
            //   │   ├── SubTest1
            //   │   └── SubSubSuite
            //   │       └── DeepTest1
            //   └── SubSuite2
            //       ├── SubTest2
            //       └── SubTest3

            metrics.startTest(["TopSuite", "DirectTest1"]);
            metrics.stopTest();

            metrics.startTest(["TopSuite", "DirectTest2"]);
            metrics.stopTest();

            metrics.startTest(["TopSuite", "SubSuite1", "SubTest1"]);
            metrics.stopTest();

            metrics.startTest(["TopSuite", "SubSuite1", "SubSubSuite", "DeepTest1"]);
            metrics.stopTest();

            metrics.startTest(["TopSuite", "SubSuite2", "SubTest2"]);
            metrics.stopTest();

            metrics.startTest(["TopSuite", "SubSuite2", "SubTest3"]);
            metrics.stopTest();
        });

        test("Correctly report direct vs recursive metrics", function() {
            const topSuiteData = metrics.metrics.getSuiteMetrics(["TopSuite"]);

            assert.strictEqual(topSuiteData.directTestMetrics.numTests, 2, 'Top suite should have 2 direct tests'); // DirectTest1, DirectTest2
            assert.strictEqual(topSuiteData.subTestMetrics.numTests, 4, 'Top suite should have 4 sub-tests'); // SubTest1, DeepTest1, SubTest2, SubTest3
            assert.strictEqual(topSuiteData.totalTestMetrics.numTests, 6, 'Top suite should have 6 total tests');
            assert.isArray(topSuiteData.subSuites, 'Top suite should have child suites array');
            assert.includeMembers(topSuiteData.subSuites!, ["SubSuite1", "SubSuite2"], 'Top suite should include sub-suites');
        });

        test("Nested suite metrics correctly", function() {
            const subSuite1Data = metrics.metrics.getSuiteMetrics(["TopSuite", "SubSuite1"]);

            assert.strictEqual(subSuite1Data.directTestMetrics.numTests, 1, 'SubSuite1 should have 1 direct test'); // SubTest1
            assert.strictEqual(subSuite1Data.subTestMetrics.numTests, 1, 'SubSuite1 should have 1 sub-test'); // DeepTest1
            assert.strictEqual(subSuite1Data.totalTestMetrics.numTests, 2, 'SubSuite1 should have 2 total tests');
            assert.isArray(subSuite1Data.parentSuites, 'SubSuite1 should have parent suites array');
            assert.deepEqual(subSuite1Data.parentSuites!, ["TopSuite"], 'SubSuite1 should have TopSuite as parent');
            assert.deepEqual(subSuite1Data.subSuites, ["SubSubSuite"], 'SubSuite1 should have SubSubSuite as child');
        });

        test("Deep nesting correctly", function() {
            const deepSuiteData = metrics.metrics.getSuiteMetrics(["TopSuite", "SubSuite1", "SubSubSuite"]);

            assert.strictEqual(deepSuiteData.totalTestMetrics.numTests, 1, 'Deep suite should have 1 test');
            assert.isArray(deepSuiteData.parentSuites, 'Deep suite should have parent suites array');
            assert.deepEqual(deepSuiteData.parentSuites!, ["TopSuite", "SubSuite1"], 'Deep suite should have correct parent suites');
            assert.deepEqual(deepSuiteData.subSuites, [], 'Deep suite should have no child suites');
        });
    });

    suite("Test Metrics and Ordering", function() {
        test("Track test numbers correctly", function() {
            metrics.startTest(["Suite1", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["Suite2", "Test2"]);
            metrics.stopTest();

            metrics.startTest(["Suite1", "Test3"]);
            metrics.stopTest();

            const test1 = metrics.queries.getTest(["Suite1", "Test1"]);
            const test2 = metrics.queries.getTest(["Suite2", "Test2"]);
            const test3 = metrics.queries.getTest(["Suite1", "Test3"]);

            assert.strictEqual(test1.testNumber, 1, 'First test should have global test number 1');
            assert.strictEqual(test2.testNumber, 2, 'Second test should have global test number 2');
            assert.strictEqual(test3.testNumber, 3, 'Third test should have global test number 3');

            assert.strictEqual(test1.suiteTestNumber, 1, 'First test in Suite1 should have suite test number 1');
            assert.strictEqual(test2.suiteTestNumber, 1, 'First test in Suite2 should have suite test number 1');
            assert.strictEqual(test3.suiteTestNumber, 2, 'Second test in Suite1 should have suite test number 2');
        });

        test("Complete test metrics", function() {
            metrics.startTest(["TestSuite", "DetailedTest"]);
            // Add small delay to ensure measurable duration
            const start = Date.now();
            while (Date.now() - start < 1) { /* busy wait */ }
            metrics.stopTest();

            const testMetrics = metrics.queries.getTest(["TestSuite", "DetailedTest"]);

            assert.strictEqual(testMetrics.name, "DetailedTest", 'Test should have correct name');
            assert.isNumber(testMetrics.startTimestamp, 'Start timestamp should be a number');
            assert.isAbove(testMetrics.startTimestamp, 0, 'Start timestamp should be positive');
            assert.isNumber(testMetrics.endTimestamp, 'End timestamp should be a number');
            assert.isAbove(testMetrics.endTimestamp, testMetrics.startTimestamp, 'End timestamp should be after start timestamp');
            assert.isNumber(testMetrics.duration, 'Duration should be a number');
            assert.isAbove(testMetrics.duration, 0, 'Duration should be positive');
            assert.strictEqual(testMetrics.duration, testMetrics.endTimestamp - testMetrics.startTimestamp, 'Duration should equal timestamp difference');
            assert.isNumber(testMetrics.testNumber, 'Test number should be a number');
            assert.isAbove(testMetrics.testNumber, 0, 'Test number should be positive');
            assert.isNumber(testMetrics.suiteTestNumber, 'Suite test number should be a number');
            assert.isAbove(testMetrics.suiteTestNumber, 0, 'Suite test number should be positive');
        });

        test("Calculate timing metrics accurately", function() {
            // Create tests with measurable durations
            metrics.startTest(["TimingSuite", "FastTest"]);
            metrics.stopTest();

            metrics.startTest(["TimingSuite", "SlowTest"]);
            const start = Date.now();
            while (Date.now() - start < 2) { /* busy wait longer */ }
            metrics.stopTest();

            const suiteData = metrics.metrics.getSuiteMetrics(["TimingSuite"]);
            const fastTest = metrics.queries.getTest(["TimingSuite", "FastTest"]);
            const slowTest = metrics.queries.getTest(["TimingSuite", "SlowTest"]);

            assert.isAbove(slowTest.duration, fastTest.duration, 'Slow test should have longer duration than fast test');
            assert.isNumber(suiteData.totalTestMetrics.totalTime, 'Suite should have numeric total time');
            assert.strictEqual(suiteData.totalTestMetrics.totalTime!, fastTest.duration + slowTest.duration, 'Suite total time should equal sum of test durations');
            assert.isNumber(suiteData.totalTestMetrics.averageTime, 'Suite should have numeric average time');
            assert.strictEqual(suiteData.totalTestMetrics.averageTime!, (fastTest.duration + slowTest.duration) / 2, 'Suite average time should equal total divided by count');
        });
    });

    suite("Existence Checks", function() {
        test("Correctly identify existing and non-existing suites", function() {
            metrics.startTest(["ExistingSuite", "Test1"]);
            metrics.stopTest();

            assert.isTrue(metrics.queries.suiteExists(["ExistingSuite"]), 'Existing suite should be found');
            assert.isFalse(metrics.queries.suiteExists(["NonExistingSuite"]), 'Non-existing suite should not be found');
            assert.isFalse(metrics.queries.suiteExists(["ExistingSuite", "SubSuite"]), 'Non-existing sub-suite should not be found');
        });

        test("Correctly identify existing and non-existing tests", function() {
            metrics.startTest(["TestSuite", "ExistingTest"]);
            metrics.stopTest();

            assert.isTrue(metrics.queries.testExists(["TestSuite", "ExistingTest"]), 'Existing test should be found');
            assert.isFalse(metrics.queries.testExists(["TestSuite", "NonExistingTest"]), 'Non-existing test should not be found');
            assert.isFalse(metrics.queries.testExists(["NonExistingSuite", "Test"]), 'Test in non-existing suite should not be found');
        });
    });

    suite("Edge Cases", function() {
        test("Empty suites (no tests)", function() {
            // Create a test to create the suite structure, then check parent
            metrics.startTest(["ParentSuite", "SubSuite", "Test1"]);
            metrics.stopTest();

            const parentData = metrics.metrics.getSuiteMetrics(["ParentSuite"]);
            assert.strictEqual(parentData.directTestMetrics.numTests, 0, 'Parent suite should have no direct tests');
            assert.strictEqual(parentData.directTestMetrics.totalTime, 0, 'Parent suite should have zero total time');
            assert.strictEqual(parentData.directTestMetrics.averageTime, 0, 'Parent suite should have zero average time');
            assert.deepEqual(parentData.subSuites, ["SubSuite"], 'Parent suite should have SubSuite as child');
        });

        test("Top-level suite operations", function() {
            metrics.startTest(["Suite1", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["Suite2", "Test2"]);
            metrics.stopTest();

            const topLevelData = metrics.metrics.getSuiteMetrics([]);
            assert.strictEqual(topLevelData.name, "<Top-Level suite>", 'Top level should have correct name');
            assert.deepEqual(topLevelData.parentSuites, [], 'Top level should have no parent suites');
            assert.strictEqual(topLevelData.directTestMetrics.numTests, 0, 'Top level should have no direct tests');
            assert.strictEqual(topLevelData.subTestMetrics.numTests, 2, 'Top level should have 2 sub-tests');
            assert.strictEqual(topLevelData.totalTestMetrics.numTests, 2, 'Top level should have 2 total tests');
        });

        test("Suite with null times correctly", function() {
            // Create suite with no direct tests
            metrics.startTest(["EmptySuite", "SubSuite", "Test1"]);
            metrics.stopTest();

            const emptyData: SuiteData = metrics.metrics.getSuiteMetrics(["EmptySuite"]);
            assert.strictEqual(emptyData.directTestMetrics.totalTime, 0, 'Empty suite should have zero total time');
            assert.strictEqual(emptyData.directTestMetrics.averageTime, 0, 'Empty suite should have zero average time');

            const recursiveData: SuiteData = metrics.metrics.getSuiteMetrics(["EmptySuite"]);
            assert.strictEqual(recursiveData.directTestMetrics.totalTime, 0, 'Empty suite should have zero direct total time');
            assert.strictEqual(recursiveData.directTestMetrics.averageTime, 0, 'Empty suite should have zero direct average time');
            assert.isNumber(recursiveData.subTestMetrics.totalTime, 'Empty suite should have numeric sub-test total time');
        });
    });

    suite("Print Output", function() {
        test("Generate comprehensive print output", function() {
            // Create a complex structure for printing
            metrics.startTest(["PrintSuite", "DirectTest"]);
            metrics.stopTest();

            metrics.startTest(["PrintSuite", "SubSuite", "SubTest"]);
            metrics.stopTest();

            const output = metrics.metrics.printAllSuiteMetrics(true);
            assert.isString(output, 'Print output should be a string');
            assert.include(output, 'Suite: <Top-Level suite>', 'Output should include top-level suite');
            assert.include(output, 'Suite: PrintSuite', 'Output should include PrintSuite');
            assert.include(output, 'Suite: SubSuite', 'Output should include SubSuite');
            assert.include(output, "'DirectTest'", 'Output should include DirectTest');
            assert.include(output, "'SubTest'", 'Output should include SubTest');

            const outputWithoutTopLevel = metrics.metrics.printAllSuiteMetrics(false);
            assert.isString(outputWithoutTopLevel, 'Print output without top level should be a string');
            assert.notInclude(outputWithoutTopLevel, 'Suite: <Top-Level suite>', 'Output without top level should not include top-level suite');
            assert.include(outputWithoutTopLevel, 'Suite: PrintSuite', 'Output without top level should still include PrintSuite');
        });
    });

    suite("State Management", function() {
        test("Maintain state across multiple operations", function() {
            // Create initial state
            metrics.startTest(["StateSuite", "Test1"]);
            metrics.stopTest();

            assert.isTrue(metrics.queries.testExists(["StateSuite", "Test1"]), 'Test1 should exist after creation');

            // Add more tests
            metrics.startTest(["StateSuite", "Test2"]);
            metrics.stopTest();

            // State should persist
            assert.isTrue(metrics.queries.testExists(["StateSuite", "Test1"]), 'Test1 should still exist after adding Test2');
            assert.isTrue(metrics.queries.testExists(["StateSuite", "Test2"]), 'Test2 should exist after creation');

            const suiteData = metrics.metrics.getSuiteMetrics(["StateSuite"]);
            assert.strictEqual(suiteData.totalTestMetrics.numTests, 2, 'Suite should have 2 tests after adding both');
        });

        test("Reset correctly", function() {
            metrics.startTest(["ResetSuite", "Test1"]);
            metrics.stopTest();

            assert.isTrue(metrics.queries.testExists(["ResetSuite", "Test1"]), 'Test should exist before reset');

            SuiteMetrics.resetInstance();
            const newMetrics = SuiteMetrics.getInstance();

            assert.isFalse(newMetrics.queries.testExists(["ResetSuite", "Test1"]), 'Test should not exist after reset');
            assert.isFalse(newMetrics.queries.suiteExists(["ResetSuite"]), 'Suite should not exist after reset');
        });
    });

    suite("Data Integrity", function() {
        test("Return immutable test metrics", function() {
            metrics.startTest(["ImmutableSuite", "Test1"]);
            metrics.stopTest();

            const testMetrics1 = metrics.queries.getTest(["ImmutableSuite", "Test1"]);
            const testMetrics2 = metrics.queries.getTest(["ImmutableSuite", "Test1"]);

            assert.deepEqual(testMetrics1, testMetrics2, 'Multiple calls should return equal objects');
            assert.notEqual(testMetrics1, testMetrics2, 'Multiple calls should return different object references');

            // Verify all properties exist and are correct type
            assert.isString(testMetrics1.name, 'Name property should be string');
            assert.isNumber(testMetrics1.startTimestamp, 'Start timestamp property should be number');
            assert.isNumber(testMetrics1.endTimestamp, 'End timestamp property should be number');
            assert.isNumber(testMetrics1.duration, 'Duration property should be number');
            assert.isNumber(testMetrics1.testNumber, 'Test number property should be number');
            assert.isNumber(testMetrics1.suiteTestNumber, 'Suite test number property should be number');
        });

        test("Maintain data consistency in complex scenarios", function() {
            // Create a complex scenario and verify all metrics are consistent
            metrics.startTest(["Consistency", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["Consistency", "SubSuite", "Test2"]);
            metrics.stopTest();

            metrics.startTest(["Consistency", "SubSuite", "Test3"]);
            metrics.stopTest();

            const topSuite = metrics.metrics.getSuiteMetrics(["Consistency"]);
            const subSuite = metrics.metrics.getSuiteMetrics(["Consistency", "SubSuite"]);

            // Verify consistency
            assert.strictEqual(topSuite.directTestMetrics.numTests, 1, 'Top suite should have 1 direct test');
            assert.strictEqual(topSuite.subTestMetrics.numTests, 2, 'Top suite should have 2 sub-tests');
            assert.strictEqual(topSuite.totalTestMetrics.numTests, 3, 'Top suite should have 3 total tests');

            assert.strictEqual(subSuite.directTestMetrics.numTests, 2, 'Sub suite should have 2 direct tests');
            assert.strictEqual(subSuite.subTestMetrics.numTests, 0, 'Sub suite should have 0 sub-tests');
            assert.strictEqual(subSuite.totalTestMetrics.numTests, 2, 'Sub suite should have 2 total tests');

            // Verify time consistency
            assert.isNumber(topSuite.totalTestMetrics.totalTime, 'Top suite should have numeric total time');
            assert.isNumber(topSuite.directTestMetrics.totalTime, 'Top suite should have numeric direct total time');
            assert.isNumber(topSuite.subTestMetrics.totalTime, 'Top suite should have numeric sub total time');
            assert.strictEqual(topSuite.totalTestMetrics.totalTime!,
                topSuite.directTestMetrics.totalTime! + topSuite.subTestMetrics.totalTime!,
                'Total time should equal sum of direct and sub times');
        });
    });
});
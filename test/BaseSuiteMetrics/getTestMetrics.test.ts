import { assert } from 'chai';
import SuiteMetrics from "../../src/index.ts";
import { addDelay } from "../helpers.ts";

suite("[BaseSuiteMetrics] getTestMetrics", function() {

    let metrics: SuiteMetrics;

    setup(function() {
        metrics = new SuiteMetrics();
    });

    suite("Input Validation", function() {
        test("Non-array path", function() {
            // @ts-ignore - Testing runtime validation
            assert.throws(() => metrics.getTestMetrics("not an array"), 'Path must be an array of strings', 'Should throw error when path is not an array');
        });

        test("Empty path", function() {
            assert.throws(() => metrics.getTestMetrics([]), 'Path cannot be empty - must define a path', 'Should throw error when path array is empty');
        });

        test("Single-element path", function() {
            assert.throws(() => metrics.getTestMetrics(["just-test"]), 'A test must be inside at least one suite - it must contain at least [suite, test]', 'Should throw error when path has only one element');
        });

        test("Path with empty strings", function() {
            assert.throws(() => metrics.getTestMetrics(["suite", ""]), 'Path must be an array of non-empty strings', 'Should throw error when path contains empty string');
        });

        test("Path with non-string elements", function() {
            // @ts-ignore - Testing runtime validation
            assert.throws(() => metrics.getTestMetrics(["suite", 123]), 'Path must be an array of non-empty strings', 'Should throw error when path contains number');
        });

        test("Path with null/undefined elements", function() {
            // @ts-ignore - Testing runtime validation
            assert.throws(() => metrics.getTestMetrics(["suite", null]), 'Path must be an array of non-empty strings', 'Should throw error when path contains null');
            // @ts-ignore - Testing runtime validation
            assert.throws(() => metrics.getTestMetrics(["suite", undefined]), 'Path must be an array of non-empty strings', 'Should throw error when path contains undefined');
        });
    });

    suite("Non-existent Test/Suite Handling", function() {
        test("Non-existent suite", function() {
            assert.throws(() => metrics.getTestMetrics(["NonExistentSuite", "Test"]), 'Suite path [NonExistentSuite] does not exist', 'Should throw error when suite does not exist');
        });

        test("Non-existent test in existing suite", function() {
            metrics.startTest(["ExistingSuite", "ExistingTest"]);
            metrics.stopTest();

            assert.throws(() => metrics.getTestMetrics(["ExistingSuite", "NonExistentTest"]), 'Test [ExistingSuite, NonExistentTest] does not exist', 'Should throw error when test does not exist in existing suite');
        });

        test("Non-existent test in nested suite", function() {
            metrics.startTest(["Parent", "Child", "ExistingTest"]);
            metrics.stopTest();

            assert.throws(() => metrics.getTestMetrics(["Parent", "Child", "NonExistentTest"]), 'Test [Parent, Child, NonExistentTest] does not exist', 'Should throw error when test does not exist in nested suite');
        });

        test("Test path that points to suite", function() {
            metrics.startTest(["Suite1", "SubSuite", "Test1"]);
            metrics.stopTest();

            // Trying to get test metrics for a suite path should fail
            assert.throws(() => metrics.getTestMetrics(["Suite1", "SubSuite"]), 'Test [Suite1, SubSuite] does not exist', 'Should throw error when path points to suite instead of test');
        });

        test("Partially non-existent nested path", function() {
            metrics.startTest(["Level1", "Level2", "Test1"]);
            metrics.stopTest();

            assert.throws(() => metrics.getTestMetrics(["Level1", "NonExistentLevel2", "Test1"]), 'Suite path [Level1, NonExistentLevel2] does not exist', 'Should throw error when intermediate suite does not exist');
        });
    });

    suite("Basic Functionality", function() {
        test("Complete test metrics for simple test", function() {
            metrics.startTest(["SimpleSuite", "SimpleTest"]);
            addDelay(100);
            metrics.stopTest();

            const testMetrics = metrics.getTestMetrics(["SimpleSuite", "SimpleTest"]);

            assert.isObject(testMetrics, 'Test metrics should be an object');
            assert.strictEqual(testMetrics.name, "SimpleTest", 'Test name should match');
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

        test("Test metrics for nested test", function() {
            metrics.startTest(["Level1", "Level2", "Level3", "DeepTest"]);
            metrics.stopTest();

            const testMetrics = metrics.getTestMetrics(["Level1", "Level2", "Level3", "DeepTest"]);

            assert.strictEqual(testMetrics.name, "DeepTest", 'Test name should match for nested test');
            assert.isNumber(testMetrics.testNumber, 'Test number should be a number for nested test');
            assert.isAbove(testMetrics.testNumber, 0, 'Test number should be positive for nested test');
            assert.strictEqual(testMetrics.suiteTestNumber, 1, 'Should be first test in this suite');
        });

        test("Tests with special characters in names", function() {
            const specialTestName = "Test with spaces & symbols!@#$%^&*()";
            metrics.startTest(["SpecialSuite", specialTestName]);
            metrics.stopTest();

            const testMetrics = metrics.getTestMetrics(["SpecialSuite", specialTestName]);
            assert.strictEqual(testMetrics.name, specialTestName, 'Test name with special characters should be preserved');
        });

        test("Tests with unicode characters", function() {
            const unicodeTestName = "测试 🧪 тест";
            metrics.startTest(["UnicodeSuite", unicodeTestName]);
            metrics.stopTest();

            const testMetrics = metrics.getTestMetrics(["UnicodeSuite", unicodeTestName]);
            assert.strictEqual(testMetrics.name, unicodeTestName, 'Test name with unicode characters should be preserved');
        });
    });

    suite("Test Numbering and Ordering", function() {
        test("Correct global test numbers", function() {
            metrics.startTest(["Suite1", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["Suite2", "Test2"]);
            metrics.stopTest();

            metrics.startTest(["Suite1", "Test3"]);
            metrics.stopTest();

            const test1 = metrics.getTestMetrics(["Suite1", "Test1"]);
            const test2 = metrics.getTestMetrics(["Suite2", "Test2"]);
            const test3 = metrics.getTestMetrics(["Suite1", "Test3"]);

            assert.strictEqual(test1.testNumber, 1, 'First test should have test number 1');
            assert.strictEqual(test2.testNumber, 2, 'Second test should have test number 2');
            assert.strictEqual(test3.testNumber, 3, 'Third test should have test number 3');
        });

        test("Correct suite-specific test numbers", function() {
            metrics.startTest(["Suite1", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["Suite2", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["Suite1", "Test2"]);
            metrics.stopTest();

            metrics.startTest(["Suite2", "Test2"]);
            metrics.stopTest();

            const suite1Test1 = metrics.getTestMetrics(["Suite1", "Test1"]);
            const suite2Test1 = metrics.getTestMetrics(["Suite2", "Test1"]);
            const suite1Test2 = metrics.getTestMetrics(["Suite1", "Test2"]);
            const suite2Test2 = metrics.getTestMetrics(["Suite2", "Test2"]);

            assert.strictEqual(suite1Test1.suiteTestNumber, 1, 'First test in Suite1 should have suite test number 1');
            assert.strictEqual(suite2Test1.suiteTestNumber, 1, 'First test in Suite2 should have suite test number 1');
            assert.strictEqual(suite1Test2.suiteTestNumber, 2, 'Second test in Suite1 should have suite test number 2');
            assert.strictEqual(suite2Test2.suiteTestNumber, 2, 'Second test in Suite2 should have suite test number 2');
        });

        test("Suite test numbering in nested suites", function() {
            metrics.startTest(["Parent", "Child1", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["Parent", "Child2", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["Parent", "Child1", "Test2"]);
            metrics.stopTest();

            const child1Test1 = metrics.getTestMetrics(["Parent", "Child1", "Test1"]);
            const child2Test1 = metrics.getTestMetrics(["Parent", "Child2", "Test1"]);
            const child1Test2 = metrics.getTestMetrics(["Parent", "Child1", "Test2"]);

            assert.strictEqual(child1Test1.suiteTestNumber, 1, 'First test in Child1 should have suite test number 1');
            assert.strictEqual(child2Test1.suiteTestNumber, 1, 'First test in Child2 should have suite test number 1');
            assert.strictEqual(child1Test2.suiteTestNumber, 2, 'Second test in Child1 should have suite test number 2');
        });
    });

    suite("Timing and Duration", function() {
        test("Accurate timing information", function() {
            metrics.startTest(["TimingSuite", "TimingTest"]);

            // Add measurable delay
            const delayStart = Date.now();
            while (Date.now() - delayStart < 100) { /* busy wait */ }

            metrics.stopTest();

            const testMetrics = metrics.getTestMetrics(["TimingSuite", "TimingTest"]);

            // Verify timing properties exist and are reasonable
            assert.isNumber(testMetrics.startTimestamp, 'Start timestamp should be a number');
            assert.isAbove(testMetrics.startTimestamp, 0, 'Start timestamp should be positive');
            assert.isNumber(testMetrics.endTimestamp, 'End timestamp should be a number');
            assert.isAbove(testMetrics.endTimestamp, testMetrics.startTimestamp, 'End timestamp should be after start timestamp');
            assert.isNumber(testMetrics.duration, 'Duration should be a number');
            assert.isAbove(testMetrics.duration, 0, 'Duration should be positive');
            assert.strictEqual(testMetrics.duration, testMetrics.endTimestamp - testMetrics.startTimestamp, 'Duration should equal timestamp difference');

            // Verify the duration is reasonable (should be at least a few microseconds due to the delay)
            assert.isAbove(testMetrics.duration, 1000, 'Duration should be at least 1ms in microseconds due to delay');
        });

        test("Very short duration tests", function() {
            metrics.startTest(["QuickSuite", "QuickTest"]);
            for (let i = 0; i < 100; ++i) {
                // Placeholder work ...
            }
            metrics.stopTest(); // Immediate stop

            const testMetrics = metrics.getTestMetrics(["QuickSuite", "QuickTest"]);

            assert.isNumber(testMetrics.duration, 'Duration should be a number for quick test');
            assert.isAtLeast(testMetrics.duration, 0, 'Duration should be non-negative for quick test');
            assert.isBelow(testMetrics.startTimestamp, testMetrics.endTimestamp, 'Start timestamp should be before end timestamp for quick test');
        });

        test("Tests with different durations", function() {
            // Fast test
            metrics.startTest(["DurationSuite", "FastTest"]);
            addDelay(10);
            metrics.stopTest();

            // Slow test
            metrics.startTest(["DurationSuite", "SlowTest"]);
            addDelay(100);
            metrics.stopTest();

            const fastTest = metrics.getTestMetrics(["DurationSuite", "FastTest"]);
            const slowTest = metrics.getTestMetrics(["DurationSuite", "SlowTest"]);

            assert.isAbove(slowTest.duration, fastTest.duration, 'Slow test should have longer duration than fast test');
            assert.isAbove(fastTest.duration, 10_000, 'Fast test should have at least 10ms duration');
            assert.isAbove(slowTest.duration, 100_000, 'Slow test should have at least 100ms duration');
        });
    });

    suite("Data Immutability and Integrity", function() {
        test("Return copy of test data (not reference)", function() {
            metrics.startTest(["ImmutableSuite", "ImmutableTest"]);
            metrics.stopTest();

            const testMetrics1 = metrics.getTestMetrics(["ImmutableSuite", "ImmutableTest"]);
            const testMetrics2 = metrics.getTestMetrics(["ImmutableSuite", "ImmutableTest"]);

            assert.deepEqual(testMetrics1, testMetrics2, 'Multiple calls should return equal objects');
            assert.notEqual(testMetrics1, testMetrics2, 'Multiple calls should return different object references');

            // Verify modifying returned object doesn't affect internal state
            // @ts-ignore - Testing immutability
            testMetrics1.duration = 999999;
            const testMetrics3 = metrics.getTestMetrics(["ImmutableSuite", "ImmutableTest"]);
            assert.notEqual(testMetrics3.duration, 999999, 'Modifying returned object should not affect internal state');
            assert.deepEqual(testMetrics3, testMetrics2, 'Internal state should remain unchanged after modification');
        });

        test("Readonly properties", function() {
            metrics.startTest(["ReadonlySuite", "ReadonlyTest"]);
            metrics.stopTest();

            const testMetrics = metrics.getTestMetrics(["ReadonlySuite", "ReadonlyTest"]);

            // These should be readonly according to the type definition
            assert.isString(testMetrics.name, 'Name should be a string');
            assert.isNumber(testMetrics.testNumber, 'Test number should be a number');
            assert.isNumber(testMetrics.suiteTestNumber, 'Suite test number should be a number');
        });

        test("All required Test properties", function() {
            metrics.startTest(["CompleteSuite", "CompleteTest"]);
            metrics.stopTest();

            const testMetrics = metrics.getTestMetrics(["CompleteSuite", "CompleteTest"]);

            // Verify all properties from Test type are present
            assert.hasAllKeys(testMetrics, [
                'name', 'startTimestamp', 'endTimestamp', 'duration', 'testNumber', 'suiteTestNumber'
            ], 'Test metrics should have all required properties');

            // Verify property types
            assert.isString(testMetrics.name, 'Name property should be string');
            assert.isNumber(testMetrics.startTimestamp, 'Start timestamp property should be number');
            assert.isNumber(testMetrics.endTimestamp, 'End timestamp property should be number');
            assert.isNumber(testMetrics.duration, 'Duration property should be number');
            assert.isNumber(testMetrics.testNumber, 'Test number property should be number');
            assert.isNumber(testMetrics.suiteTestNumber, 'Suite test number property should be number');
        });
    });

    suite("Complex Scenarios", function() {
        test("Multiple tests in deeply nested suites", function() {
            const deepPath1 = ["L1", "L2", "L3", "L4", "L5", "Test1"];
            const deepPath2 = ["L1", "L2", "L3", "L4", "L5", "Test2"];
            const deepPath3 = ["L1", "L2", "L3", "L4", "L6", "Test3"];

            metrics.startTest(deepPath1);
            metrics.stopTest();

            metrics.startTest(deepPath2);
            metrics.stopTest();

            metrics.startTest(deepPath3);
            metrics.stopTest();

            const test1 = metrics.getTestMetrics(deepPath1);
            const test2 = metrics.getTestMetrics(deepPath2);
            const test3 = metrics.getTestMetrics(deepPath3);

            assert.strictEqual(test1.name, "Test1", 'First deep test should have correct name');
            assert.strictEqual(test2.name, "Test2", 'Second deep test should have correct name');
            assert.strictEqual(test3.name, "Test3", 'Third deep test should have correct name');

            assert.strictEqual(test1.suiteTestNumber, 1, 'First test in L5 suite should have suite test number 1');
            assert.strictEqual(test2.suiteTestNumber, 2, 'Second test in L5 suite should have suite test number 2');
            assert.strictEqual(test3.suiteTestNumber, 1, 'First test in L6 suite should have suite test number 1');

            assert.strictEqual(test1.testNumber, 1, 'First test globally should have test number 1');
            assert.strictEqual(test2.testNumber, 2, 'Second test globally should have test number 2');
            assert.strictEqual(test3.testNumber, 3, 'Third test globally should have test number 3');
        });

        test("Tests with identical names in different suites", function() {
            metrics.startTest(["Suite1", "DuplicateName"]);
            metrics.stopTest();

            metrics.startTest(["Suite2", "DuplicateName"]);
            metrics.stopTest();

            metrics.startTest(["Suite1", "SubSuite", "DuplicateName"]);
            metrics.stopTest();

            const test1 = metrics.getTestMetrics(["Suite1", "DuplicateName"]);
            const test2 = metrics.getTestMetrics(["Suite2", "DuplicateName"]);
            const test3 = metrics.getTestMetrics(["Suite1", "SubSuite", "DuplicateName"]);

            assert.strictEqual(test1.name, "DuplicateName", 'First duplicate test should have correct name');
            assert.strictEqual(test2.name, "DuplicateName", 'Second duplicate test should have correct name');
            assert.strictEqual(test3.name, "DuplicateName", 'Third duplicate test should have correct name');

            assert.strictEqual(test1.testNumber, 1, 'First test should have global test number 1');
            assert.strictEqual(test2.testNumber, 2, 'Second test should have global test number 2');
            assert.strictEqual(test3.testNumber, 3, 'Third test should have global test number 3');

            assert.strictEqual(test1.suiteTestNumber, 1, 'First test in Suite1 should have suite test number 1');
            assert.strictEqual(test2.suiteTestNumber, 1, 'First test in Suite2 should have suite test number 1');
            assert.strictEqual(test3.suiteTestNumber, 1, 'First test in SubSuite should have suite test number 1');
        });

        test("Consistency across multiple operations", function() {
            // Create a complex test structure
            metrics.startTest(["ConsistencySuite", "Test1"]);
            metrics.stopTest();

            const initialTest = metrics.getTestMetrics(["ConsistencySuite", "Test1"]);

            // Add more tests
            metrics.startTest(["ConsistencySuite", "Test2"]);
            metrics.stopTest();

            metrics.startTest(["ConsistencySuite", "SubSuite", "Test3"]);
            metrics.stopTest();

            // Original test should remain unchanged
            const laterTest = metrics.getTestMetrics(["ConsistencySuite", "Test1"]);
            assert.deepEqual(laterTest, initialTest, 'Original test metrics should remain unchanged after adding more tests');

            // New tests should have correct numbering
            const test2 = metrics.getTestMetrics(["ConsistencySuite", "Test2"]);
            const test3 = metrics.getTestMetrics(["ConsistencySuite", "SubSuite", "Test3"]);

            assert.strictEqual(test2.suiteTestNumber, 2, 'Second test in main suite should have suite test number 2');
            assert.strictEqual(test3.suiteTestNumber, 1, 'First test in sub suite should have suite test number 1');
            assert.strictEqual(test2.testNumber, 2, 'Second test globally should have test number 2');
            assert.strictEqual(test3.testNumber, 3, 'Third test globally should have test number 3');
        });
    });

    suite("Edge Cases and Error Conditions", function() {
        test("Very long suite and test names", function() {
            const longSuiteName = "A".repeat(1000);
            const longTestName = "B".repeat(1000);

            metrics.startTest([longSuiteName, longTestName]);
            metrics.stopTest();

            const testMetrics = metrics.getTestMetrics([longSuiteName, longTestName]);
            assert.strictEqual(testMetrics.name, longTestName, 'Very long test name should be preserved');
            assert.strictEqual(testMetrics.name.length, 1000, 'Test name should maintain full length');
        });

        test("Suite names that look like array indices", function() {
            metrics.startTest(["0", "1", "2"]);
            metrics.stopTest();

            const testMetrics = metrics.getTestMetrics(["0", "1", "2"]);
            assert.strictEqual(testMetrics.name, "2", 'Test name that looks like array index should be preserved');
        });

        test("Whitespace-only names (but not empty)", function() {
            const whitespaceSuite = "   ";
            const whitespaceTest = "\t\n ";

            metrics.startTest([whitespaceSuite, whitespaceTest]);
            metrics.stopTest();

            const testMetrics = metrics.getTestMetrics([whitespaceSuite, whitespaceTest]);
            assert.strictEqual(testMetrics.name, whitespaceTest, 'Whitespace-only test name should be preserved');
        });

        test("Case-sensitive test names", function() {
            metrics.startTest(["CaseSuite", "TestName"]);
            metrics.stopTest();

            metrics.startTest(["CaseSuite", "testname"]);
            metrics.stopTest();

            metrics.startTest(["CaseSuite", "TESTNAME"]);
            metrics.stopTest();

            const test1 = metrics.getTestMetrics(["CaseSuite", "TestName"]);
            const test2 = metrics.getTestMetrics(["CaseSuite", "testname"]);
            const test3 = metrics.getTestMetrics(["CaseSuite", "TESTNAME"]);

            assert.strictEqual(test1.name, "TestName", 'Original case test name should be preserved');
            assert.strictEqual(test2.name, "testname", 'Lowercase test name should be preserved');
            assert.strictEqual(test3.name, "TESTNAME", 'Uppercase test name should be preserved');

            assert.strictEqual(test1.suiteTestNumber, 1, 'Original case test should have suite test number 1');
            assert.strictEqual(test2.suiteTestNumber, 2, 'Lowercase test should have suite test number 2');
            assert.strictEqual(test3.suiteTestNumber, 3, 'Uppercase test should have suite test number 3');
        });
    });

    suite("State Isolation", function() {
        test("Not affect other tests when retrieving metrics", function() {
            metrics.startTest(["IsolationSuite", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["IsolationSuite", "Test2"]);
            metrics.stopTest();

            // Getting metrics for one test shouldn't affect the other
            const test1Before = metrics.getTestMetrics(["IsolationSuite", "Test1"]);
            const test2Before = metrics.getTestMetrics(["IsolationSuite", "Test2"]);

            // Get test1 metrics multiple times
            for (let i = 0; i < 5; i++) {
                metrics.getTestMetrics(["IsolationSuite", "Test1"]);
            }

            const test1After = metrics.getTestMetrics(["IsolationSuite", "Test1"]);
            const test2After = metrics.getTestMetrics(["IsolationSuite", "Test2"]);

            assert.deepEqual(test1After, test1Before, 'Test1 metrics should remain unchanged after multiple retrievals');
            assert.deepEqual(test2After, test2Before, 'Test2 metrics should remain unchanged after retrieving Test1 metrics');
        });

        test("Work correctly after instance reset", function() {
            metrics.startTest(["ResetSuite", "Test1"]);
            metrics.stopTest();

            assert.isTrue(metrics.testExists(["ResetSuite", "Test1"]), 'Test should exist before reset');

            SuiteMetrics.resetInstance();
            const newMetrics = SuiteMetrics.getInstance();

            assert.throws(() => newMetrics.getTestMetrics(["ResetSuite", "Test1"]), 'Suite path [ResetSuite] does not exist');
            assert.isFalse(newMetrics.testExists(["ResetSuite", "Test1"]), 'Test should not exist after reset');

            // Should work with new instance
            newMetrics.startTest(["NewSuite", "NewTest"]);
            newMetrics.stopTest();

            const newTestMetrics = newMetrics.getTestMetrics(["NewSuite", "NewTest"]);
            assert.strictEqual(newTestMetrics.name, "NewTest", 'New test should work correctly after reset');
            assert.strictEqual(newTestMetrics.testNumber, 1, 'Test counter should be reset');
        });
    });
});

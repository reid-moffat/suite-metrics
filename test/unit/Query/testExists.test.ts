import { assert } from 'chai';
import SuiteMetrics from "suite-metrics";

suite("[BaseSuiteMetrics] testExists", function() {

    let metrics: SuiteMetrics;

    setup(function() {
        metrics = new SuiteMetrics();
    });

    suite("Input Validation", function() {
        test("Non-array path", function() {
            // @ts-ignore - Testing runtime validation
            assert.throws(() => metrics.queries.testExists("not an array"), 'Test path must be an array', 'Should throw error when path is not an array');
        });

        test("Array with non-string elements", function() {
            // @ts-ignore - Testing runtime validation
            assert.throws(() => metrics.queries.testExists([123, "test"]), "Test path element at index 0 must be a 'string', got 'number'");
            // @ts-ignore - Testing runtime validation
            assert.throws(() => metrics.queries.testExists(["suite", null]), 'Test path element at index 1 must be a' +
                ' \'string\', got \'object\'', 'Should throw error when array contains null');
            // @ts-ignore - Testing runtime validation
            assert.throws(() => metrics.queries.testExists(["suite", undefined]), 'Test path element at index 1 must' +
                ' be a \'string\', got \'undefined\'', 'Should throw error when array contains undefined');
        });

        test("Array with empty string elements", function() {
            assert.throws(() => metrics.queries.testExists(["suite", ""]), 'Test path element at index 1 cannot be empty', 'Should throw error when array contains empty string at end');
            assert.throws(() => metrics.queries.testExists(["", "test"]), 'Test path element at index 0 cannot be empty', 'Should throw error when array contains empty string at start');
        });

        test("Empty array", function() {
            assert.throws(() => metrics.queries.testExists([]), 'A test must be inside a suite. E.g. ["Suite 1", "Test 2"] (at least two array elements)', 'Should throw error when path array is empty');
        });

        test("Single-element array", function() {
            assert.isFalse(metrics.queries.testExists(["suite1", "just-test"]), 'Single-element array should return false');
        });
    });

    suite("Basic Functionality", function() {
        test("Non-existent test in non-existent suite", function() {
            assert.isFalse(metrics.queries.testExists(["NonExistentSuite", "NonExistentTest"]), 'Non-existent test in non-existent suite should return false');
        });

        test("Non-existent test in existing suite", function() {
            // Create a suite with one test
            metrics.startTest(["ExistingSuite", "ExistingTest"]);
            metrics.stopTest();

            assert.isFalse(metrics.queries.testExists(["ExistingSuite", "NonExistentTest"]), 'Non-existent test in existing suite should return false');
        });

        test("Existing test", function() {
            metrics.startTest(["TestSuite", "ExistingTest"]);
            metrics.stopTest();

            assert.isTrue(metrics.queries.testExists(["TestSuite", "ExistingTest"]), 'Existing test should return true');
        });

        test("Existing test in nested suite", function() {
            metrics.startTest(["Level1", "Level2", "Level3", "DeepTest"]);
            metrics.stopTest();

            assert.isTrue(metrics.queries.testExists(["Level1", "Level2", "Level3", "DeepTest"]), 'Existing test in nested suite should return true');
        });

        test("Test path that points to suite", function() {
            // Create nested structure
            metrics.startTest(["Suite1", "Suite2", "ActualTest"]);
            metrics.stopTest();

            // These are suites, not tests
            assert.isFalse(metrics.queries.testExists(["Suite1", "Suite2"]), 'Path pointing to suite should return false');
            assert.isFalse(metrics.queries.testExists(["Suite1", "test1"]), 'Path pointing to non-existent test in suite should return false');
        });
    });

    suite("Multiple Tests in Same Suite", function() {
        test("Multiple tests correctly", function() {
            // Create multiple tests in same suite
            metrics.startTest(["MultiTestSuite", "Test1"]);
            metrics.stopTest();

            metrics.startTest(["MultiTestSuite", "Test2"]);
            metrics.stopTest();

            metrics.startTest(["MultiTestSuite", "Test3"]);
            metrics.stopTest();

            assert.isTrue(metrics.queries.testExists(["MultiTestSuite", "Test1"]), 'First test should exist');
            assert.isTrue(metrics.queries.testExists(["MultiTestSuite", "Test2"]), 'Second test should exist');
            assert.isTrue(metrics.queries.testExists(["MultiTestSuite", "Test3"]), 'Third test should exist');
            assert.isFalse(metrics.queries.testExists(["MultiTestSuite", "Test4"]), 'Non-existent fourth test should return false');
        });

        test("Tests with same name in different suites", function() {
            metrics.startTest(["Suite1", "SameName"]);
            metrics.stopTest();

            metrics.startTest(["Suite2", "SameName"]);
            metrics.stopTest();

            assert.isTrue(metrics.queries.testExists(["Suite1", "SameName"]), 'Test with same name in first suite should exist');
            assert.isTrue(metrics.queries.testExists(["Suite2", "SameName"]), 'Test with same name in second suite should exist');
            assert.isFalse(metrics.queries.testExists(["Suite3", "SameName"]), 'Test with same name in non-existent suite should return false');
        });
    });

    suite("Edge Cases", function() {
        test("Tests with special characters", function() {
            metrics.startTest(["Suite", "Test@#$%^&*()"]);
            metrics.stopTest();

            assert.isTrue(metrics.queries.testExists(["Suite", "Test@#$%^&*()"]), 'Test with special characters should exist');
            assert.isFalse(metrics.queries.testExists(["Suite", "Test@#$%^&*()_different"]), 'Similar test with different special characters should return false');
        });

        test("Tests with spaces", function() {
            metrics.startTest(["Suite", "Test With Spaces"]);
            metrics.stopTest();

            assert.isTrue(metrics.queries.testExists(["Suite", "Test With Spaces"]), 'Test with spaces should exist');
            assert.isFalse(metrics.queries.testExists(["Suite", "TestWithSpaces"]), 'Test without spaces should return false');
        });

        test("Very long test names", function() {
            const longTestName = "T".repeat(1000);
            metrics.startTest(["Suite", longTestName]);
            metrics.stopTest();

            assert.isTrue(metrics.queries.testExists(["Suite", longTestName]), 'Test with very long name should exist');
        });

        test("Case sensitivity for test names", function() {
            metrics.startTest(["Suite", "CaseSensitiveTest"]);
            metrics.stopTest();

            assert.isTrue(metrics.queries.testExists(["Suite", "CaseSensitiveTest"]), 'Test with original case should exist');
            assert.isFalse(metrics.queries.testExists(["Suite", "casesensitivetest"]), 'Test with lowercase should return false');
            assert.isFalse(metrics.queries.testExists(["Suite", "CASESENSITIVETEST"]), 'Test with uppercase should return false');
            assert.isFalse(metrics.queries.testExists(["Suite", "CaseSENSITIVETest"]), 'Test with mixed case should return false');
        });

        test("Deeply nested test paths", function() {
            const deepPath: string[] = [];
            for (let i = 1; i <= 10; i++) {
                deepPath.push(`Level${i}`);
            }
            deepPath.push("VeryDeepTest");

            metrics.startTest(deepPath);
            metrics.stopTest();

            assert.isTrue(metrics.queries.testExists(deepPath), 'Deeply nested test should exist');

            // Verify that partial paths don't work as test paths
            for (let i = 1; i < deepPath.length; i++) {
                const partialPath = deepPath.slice(0, i);
                if (partialPath.length >= 2) {
                    assert.isFalse(metrics.queries.testExists(partialPath), `Partial path ${partialPath.join('/')} should return false`);
                }
            }
        });
    });

    suite("State Consistency", function() {
        test("Consistency during test lifecycle", function() {
            // Before test creation
            assert.isFalse(metrics.queries.testExists(["Suite", "Test"]), 'Test should not exist before creation');

            // During test execution
            metrics.startTest(["Suite", "Test"]);
            assert.isFalse(metrics.queries.testExists(["Suite", "Test"]), 'Test should not exist during execution');

            // After test completion
            metrics.stopTest();
            assert.isTrue(metrics.queries.testExists(["Suite", "Test"]), 'Test should exist after completion');
        });

        test("Multiple test creation and completion cycles", function() {
            // First cycle
            metrics.startTest(["Suite", "Test1"]);
            assert.isFalse(metrics.queries.testExists(["Suite", "Test1"]), 'First test should not exist during execution');
            metrics.stopTest();
            assert.isTrue(metrics.queries.testExists(["Suite", "Test1"]), 'First test should exist after completion');

            // Second cycle
            metrics.startTest(["Suite", "Test2"]);
            assert.isTrue(metrics.queries.testExists(["Suite", "Test1"]), 'First test should still exist during second test execution');
            assert.isFalse(metrics.queries.testExists(["Suite", "Test2"]), 'Second test should not exist during execution');
            metrics.stopTest();
            assert.isTrue(metrics.queries.testExists(["Suite", "Test1"]), 'First test should still exist after second test completion');
            assert.isTrue(metrics.queries.testExists(["Suite", "Test2"]), 'Second test should exist after completion');
        });
    });
});

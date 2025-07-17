import { assert } from 'chai';
import SuiteMetrics from "../../src/index.ts";

suite("[BaseSuiteMetrics] suiteExists", function() {

    let metrics: SuiteMetrics;

    setup(function() {
        metrics = new SuiteMetrics();
    });

    suite("suiteExists Method", function() {

        suite("Input Validation", function() {
            test("Non-array path", function() {
                // @ts-ignore - Testing runtime validation
                assert.throws(() => metrics.suiteExists("not an array"), 'Suite/test path must be an array', 'Non-array path should throw validation error');
            });

            test("Non-string elements", function() {
                // @ts-ignore - Testing runtime validation
                assert.throws(() => metrics.suiteExists([123, "suite"]), "Suite/test path element at index 0 must be a 'string', got 'number'");
                // @ts-ignore - Testing runtime validation
                assert.throws(() => metrics.suiteExists(["suite", null]), 'Suite/test path element at index 1 must' +
                    ' be a \'string\', got \'object\'', 'Array with null element should throw validation error');
                // @ts-ignore - Testing runtime validation
                assert.throws(() => metrics.suiteExists(["suite", undefined]), 'Suite/test path element at index 1' +
                    ' must be a \'string\', got \'undefined\'', 'Array with undefined element should throw validation' +
                    ' error');
                // @ts-ignore - Testing runtime validation
                assert.throws(() => metrics.suiteExists([{}, "suite"]), 'Suite/test path element at index 0 must be' +
                    ' a \'string\', got \'object\'', 'Array with object element should throw validation error');
            });

            test("Empty string elements", function() {
                assert.throws(() => metrics.suiteExists([""]), 'Suite/test path element at index 0 cannot be empty', 'Array with single empty string should throw validation error');
                assert.throws(() => metrics.suiteExists(["suite", ""]), 'Suite/test path element at index 1 cannot be empty', 'Array with empty string at end should throw validation error');
                assert.throws(() => metrics.suiteExists(["", "suite"]), 'Suite/test path element at index 0 cannot be empty', 'Array with empty string at start should throw validation error');
            });

            test("Allows empty array (top-level suite)", function() {
                assert.doesNotThrow(() => metrics.suiteExists([]), 'Empty array path should not throw error for top-level suite');
            });
        });

        suite("Basic Functionality", function() {
            test("Top-level suite (empty path)", function() {
                assert.isTrue(metrics.suiteExists([]), 'Top-level suite with empty path should exist');
            });

            test("Non-existent single-level suite", function() {
                assert.isFalse(metrics.suiteExists(["NonExistentSuite"]), 'Non-existent single-level suite should return false');
            });

            test("Non-existent multi-level suite", function() {
                assert.isFalse(metrics.suiteExists(["NonExistent", "Suite"]), 'Non-existent two-level suite should return false');
                assert.isFalse(metrics.suiteExists(["Non", "Existent", "Suite", "Path"]), 'Non-existent four-level suite should return false');
            });

            test("Existing single-level suite", function() {
                // Create a suite by creating a test in it
                metrics.startTest(["ExistingSuite", "Test1"]);
                metrics.stopTest();

                assert.isTrue(metrics.suiteExists(["ExistingSuite"]), 'Existing single-level suite should return true');
            });

            test("Existing multi-level suite", function() {
                // Create nested suites by creating a test in them
                metrics.startTest(["Level1", "Level2", "Level3", "Test1"]);
                metrics.stopTest();

                assert.isTrue(metrics.suiteExists(["Level1"]), 'First level of nested suite should exist');
                assert.isTrue(metrics.suiteExists(["Level1", "Level2"]), 'Second level of nested suite should exist');
                assert.isTrue(metrics.suiteExists(["Level1", "Level2", "Level3"]), 'Third level of nested suite should exist');
            });
        });

        suite("Edge Cases", function() {
            test("Suites with special characters", function() {
                metrics.startTest(["Suite-With-Dashes", "Test@#$%", "Test1"]);
                metrics.stopTest();

                assert.isTrue(metrics.suiteExists(["Suite-With-Dashes"]), 'Suite with dashes should exist');
                assert.isTrue(metrics.suiteExists(["Suite-With-Dashes", "Test@#$%"]), 'Suite with special characters should exist');
            });

            test("Suites with spaces", function() {
                metrics.startTest(["Suite With Spaces", "Sub Suite With Spaces", "Test1"]);
                metrics.stopTest();

                assert.isTrue(metrics.suiteExists(["Suite With Spaces"]), 'Suite with spaces should exist');
                assert.isTrue(metrics.suiteExists(["Suite With Spaces", "Sub Suite With Spaces"]), 'Nested suite with spaces should exist');
            });

            test("Very long suite names", function() {
                const longSuiteName = "A".repeat(1000);
                metrics.startTest([longSuiteName, "Test1"]);
                metrics.stopTest();

                assert.isTrue(metrics.suiteExists([longSuiteName]), 'Suite with very long name should exist');
            });

            test("Deeply nested suites", function() {
                const deepPath: string[] = [];
                for (let i = 1; i <= 10; i++) {
                    deepPath.push(`Level${i}`);
                }
                deepPath.push("DeepTest");

                metrics.startTest(deepPath);
                metrics.stopTest();

                // Check all levels exist
                for (let i = 1; i <= 10; i++) {
                    const pathToCheck = deepPath.slice(0, i);
                    assert.isTrue(metrics.suiteExists(pathToCheck), `Level ${i} of deeply nested suite should exist`);
                }
            });

            test("Case sensitivity", function() {
                metrics.startTest(["CaseSensitive", "Test1"]);
                metrics.stopTest();

                assert.isTrue(metrics.suiteExists(["CaseSensitive"]), 'Exact case suite name should exist');
                assert.isFalse(metrics.suiteExists(["casesensitive"]), 'All lowercase version should not exist');
                assert.isFalse(metrics.suiteExists(["CASESENSITIVE"]), 'All uppercase version should not exist');
                assert.isFalse(metrics.suiteExists(["CaseSENSITIVE"]), 'Mixed case version should not exist');
            });
        });

        suite("Partial Path Existence", function() {
            test("Partial paths when full path doesn't exist", function() {
                // Create Level1 -> Level2 -> Level3
                metrics.startTest(["Level1", "Level2", "Level3", "Test1"]);
                metrics.stopTest();

                // These should exist
                assert.isTrue(metrics.suiteExists(["Level1"]), 'First level should exist');
                assert.isTrue(metrics.suiteExists(["Level1", "Level2"]), 'Second level should exist');
                assert.isTrue(metrics.suiteExists(["Level1", "Level2", "Level3"]), 'Third level should exist');

                // These should not exist (wrong paths)
                assert.isFalse(metrics.suiteExists(["Level1", "WrongLevel2"]), 'Wrong second level should not exist');
                assert.isFalse(metrics.suiteExists(["Level1", "Level2", "WrongLevel3"]), 'Wrong third level should not exist');
                assert.isFalse(metrics.suiteExists(["Level1", "Level2", "Level3", "Level4"]), 'Non-existent fourth level should not exist');
            });

            test("Mixed existing and non-existing paths", function() {
                // Create multiple suite structures
                metrics.startTest(["Suite1", "SubSuite1", "Test1"]);
                metrics.stopTest();

                metrics.startTest(["Suite1", "SubSuite2", "Test2"]);
                metrics.stopTest();

                metrics.startTest(["Suite2", "SubSuite1", "Test3"]);
                metrics.stopTest();

                // Existing paths
                assert.isTrue(metrics.suiteExists(["Suite1"]), 'Suite1 should exist');
                assert.isTrue(metrics.suiteExists(["Suite1", "SubSuite1"]), 'Suite1/SubSuite1 should exist');
                assert.isTrue(metrics.suiteExists(["Suite1", "SubSuite2"]), 'Suite1/SubSuite2 should exist');
                assert.isTrue(metrics.suiteExists(["Suite2"]), 'Suite2 should exist');
                assert.isTrue(metrics.suiteExists(["Suite2", "SubSuite1"]), 'Suite2/SubSuite1 should exist');

                // Non-existing paths
                assert.isFalse(metrics.suiteExists(["Suite1", "SubSuite3"]), 'Suite1/SubSuite3 should not exist');
                assert.isFalse(metrics.suiteExists(["Suite2", "SubSuite2"]), 'Suite2/SubSuite2 should not exist');
                assert.isFalse(metrics.suiteExists(["Suite3"]), 'Suite3 should not exist');
                assert.isFalse(metrics.suiteExists(["Suite1", "SubSuite1", "SubSubSuite"]), 'Deeper non-existent suite should not exist');
            });
        });

        suite("State Consistency", function() {
            test("Consistency after multiple test operations", function() {
                // Initial state - nothing exists
                assert.isFalse(metrics.suiteExists(["TestSuite"]), 'TestSuite should not exist initially');

                // Create first test
                metrics.startTest(["TestSuite", "Test1"]);
                assert.isFalse(metrics.suiteExists(["TestSuite"]), 'TestSuite should not exist during test execution');
                metrics.stopTest();
                assert.isTrue(metrics.suiteExists(["TestSuite"]), 'TestSuite should exist after first test completion');

                // Create second test in same suite
                metrics.startTest(["TestSuite", "Test2"]);
                assert.isTrue(metrics.suiteExists(["TestSuite"]), 'TestSuite should still exist during second test');
                metrics.stopTest();
                assert.isTrue(metrics.suiteExists(["TestSuite"]), 'TestSuite should still exist after second test completion');

                // Create test in nested suite
                metrics.startTest(["TestSuite", "NestedSuite", "Test3"]);
                assert.isTrue(metrics.suiteExists(["TestSuite"]), 'Parent suite should exist during nested test');
                assert.isFalse(metrics.suiteExists(["TestSuite", "NestedSuite"]), 'Nested suite should not exist during test execution');
                metrics.stopTest();
                assert.isTrue(metrics.suiteExists(["TestSuite"]), 'Parent suite should exist after nested test completion');
                assert.isTrue(metrics.suiteExists(["TestSuite", "NestedSuite"]), 'Nested suite should exist after test completion');
            });
        });
    });

    suite("Cross-Method Consistency", function() {
        test("Consistency between suiteExists and testExists", function() {
            // Create a test structure
            metrics.startTest(["ParentSuite", "ChildSuite", "TestName"]);
            metrics.stopTest();

            // Suite existence checks
            assert.isTrue(metrics.suiteExists(["ParentSuite"]), 'ParentSuite should exist');
            assert.isTrue(metrics.suiteExists(["ParentSuite", "ChildSuite"]), 'ChildSuite should exist');

            // Test existence check
            assert.isTrue(metrics.testExists(["ParentSuite", "ChildSuite", "TestName"]), 'Test should exist');

            // Cross-validation: test path components should exist as suites
            assert.isTrue(metrics.suiteExists(["ParentSuite"]), 'Parent component of test path should exist as suite');
            assert.isTrue(metrics.suiteExists(["ParentSuite", "ChildSuite"]), 'Child component of test path should exist as suite');

            // But suite paths should not exist as tests
            assert.isFalse(metrics.testExists(["ParentSuite", "ChildSuite"]), 'Suite path should not exist as test');
        });

        test("Complex hierarchies consistency", function() {
            // Create complex structure
            metrics.startTest(["Root", "Branch1", "Leaf1"]);
            metrics.stopTest();

            metrics.startTest(["Root", "Branch1", "Leaf2"]);
            metrics.stopTest();

            metrics.startTest(["Root", "Branch2", "SubBranch", "DeepLeaf"]);
            metrics.stopTest();

            // Verify all suites exist
            assert.isTrue(metrics.suiteExists(["Root"]), 'Root suite should exist');
            assert.isTrue(metrics.suiteExists(["Root", "Branch1"]), 'Branch1 suite should exist');
            assert.isTrue(metrics.suiteExists(["Root", "Branch2"]), 'Branch2 suite should exist');
            assert.isTrue(metrics.suiteExists(["Root", "Branch2", "SubBranch"]), 'SubBranch suite should exist');

            // Verify all tests exist
            assert.isTrue(metrics.testExists(["Root", "Branch1", "Leaf1"]), 'Leaf1 test should exist');
            assert.isTrue(metrics.testExists(["Root", "Branch1", "Leaf2"]), 'Leaf2 test should exist');
            assert.isTrue(metrics.testExists(["Root", "Branch2", "SubBranch", "DeepLeaf"]), 'DeepLeaf test should exist');

            // Verify non-existent paths
            assert.isFalse(metrics.suiteExists(["Root", "Branch3"]), 'Branch3 suite should not exist');
            assert.isFalse(metrics.testExists(["Root", "Branch1", "Leaf3"]), 'Leaf3 test should not exist');
            assert.isFalse(metrics.testExists(["Root", "Branch2", "SubBranch", "ShallowLeaf"]), 'ShallowLeaf test should not exist');
        });
    });

    suite("Performance and Stress Tests", function() {
        test("Large number of suites efficiency", function() {
            const numSuites = 100;

            // Create many suites
            for (let i = 0; i < numSuites; i++) {
                metrics.startTest([`Suite${i}`, `Test${i}`]);
                metrics.stopTest();
            }

            // Verify all exist
            for (let i = 0; i < numSuites; i++) {
                assert.isTrue(metrics.suiteExists([`Suite${i}`]), `Suite${i} should exist`);
                assert.isTrue(metrics.testExists([`Suite${i}`, `Test${i}`]), `Test${i} in Suite${i} should exist`);
            }

            // Verify non-existent ones don't exist
            assert.isFalse(metrics.suiteExists([`Suite${numSuites}`]), `Suite${numSuites} should not exist`);
            assert.isFalse(metrics.testExists([`Suite0`, `Test${numSuites}`]), `Test${numSuites} in Suite0 should not exist`);
        });

        test("Large number of tests in same suite efficiency", function() {
            const numTests = 100;

            // Create many tests in same suite
            for (let i = 0; i < numTests; i++) {
                metrics.startTest(["LargeSuite", `Test${i}`]);
                metrics.stopTest();
            }

            // Verify all exist
            assert.isTrue(metrics.suiteExists(["LargeSuite"]), 'LargeSuite should exist');
            for (let i = 0; i < numTests; i++) {
                assert.isTrue(metrics.testExists(["LargeSuite", `Test${i}`]), `Test${i} in LargeSuite should exist`);
            }

            // Verify non-existent test doesn't exist
            assert.isFalse(metrics.testExists(["LargeSuite", `Test${numTests}`]), `Test${numTests} in LargeSuite should not exist`);
        });
    });

    suite("Error Recovery", function() {
        test("Graceful error handling and state maintenance", function() {
            // Create valid structure
            metrics.startTest(["ValidSuite", "ValidTest"]);
            metrics.stopTest();

            assert.isTrue(metrics.suiteExists(["ValidSuite"]), 'ValidSuite should exist before error operations');
            assert.isTrue(metrics.testExists(["ValidSuite", "ValidTest"]), 'ValidTest should exist before error operations');

            // Try invalid operations
            try {
                // @ts-ignore
                metrics.suiteExists("invalid");
            } catch (e) {
                // Expected error
            }

            try {
                metrics.testExists([]);
            } catch (e) {
                // Expected error
            }

            // Verify original state is maintained
            assert.isTrue(metrics.suiteExists(["ValidSuite"]), 'ValidSuite should still exist after error operations');
            assert.isTrue(metrics.testExists(["ValidSuite", "ValidTest"]), 'ValidTest should still exist after error operations');
        });
    });
});

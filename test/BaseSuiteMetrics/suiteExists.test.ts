import { expect } from 'chai';
import SuiteMetrics from "../../src/index.ts";

suite("BaseSuiteMetrics - suiteExists and testExists Comprehensive Tests", function() {

    let metrics: SuiteMetrics;

    setup(function() {
        metrics = new SuiteMetrics();
    });

    suite("suiteExists Method", function() {

        suite("Input Validation", function() {
            test("should throw error for non-array path", function() {
                // @ts-ignore - Testing runtime validation
                expect(() => metrics.suiteExists("not an array")).to.throw('Path must be an array of strings');
            });

            test("should throw error for array with non-string elements", function() {
                // @ts-ignore - Testing runtime validation
                expect(() => metrics.suiteExists([123, "suite"])).to.throw('Path must be an array of non-empty strings');
                // @ts-ignore - Testing runtime validation
                expect(() => metrics.suiteExists(["suite", null])).to.throw('Path must be an array of non-empty strings');
                // @ts-ignore - Testing runtime validation
                expect(() => metrics.suiteExists(["suite", undefined])).to.throw('Path must be an array of non-empty strings');
                // @ts-ignore - Testing runtime validation
                expect(() => metrics.suiteExists([{}, "suite"])).to.throw('Path must be an array of non-empty strings');
            });

            test("should throw error for array with empty string elements", function() {
                expect(() => metrics.suiteExists([""])).to.throw('Path must be an array of non-empty strings');
                expect(() => metrics.suiteExists(["suite", ""])).to.throw('Path must be an array of non-empty strings');
                expect(() => metrics.suiteExists(["", "suite"])).to.throw('Path must be an array of non-empty strings');
            });

            test("should allow empty array (top-level suite)", function() {
                expect(() => metrics.suiteExists([])).to.not.throw();
            });
        });

        suite("Basic Functionality", function() {
            test("should return true for top-level suite (empty path)", function() {
                expect(metrics.suiteExists([])).to.be.true;
            });

            test("should return false for non-existent single-level suite", function() {
                expect(metrics.suiteExists(["NonExistentSuite"])).to.be.false;
            });

            test("should return false for non-existent multi-level suite", function() {
                expect(metrics.suiteExists(["NonExistent", "Suite"])).to.be.false;
                expect(metrics.suiteExists(["Non", "Existent", "Suite", "Path"])).to.be.false;
            });

            test("should return true for existing single-level suite", function() {
                // Create a suite by creating a test in it
                metrics.startTest(["ExistingSuite", "Test1"]);
                metrics.stopTest();

                expect(metrics.suiteExists(["ExistingSuite"])).to.be.true;
            });

            test("should return true for existing multi-level suite", function() {
                // Create nested suites by creating a test in them
                metrics.startTest(["Level1", "Level2", "Level3", "Test1"]);
                metrics.stopTest();

                expect(metrics.suiteExists(["Level1"])).to.be.true;
                expect(metrics.suiteExists(["Level1", "Level2"])).to.be.true;
                expect(metrics.suiteExists(["Level1", "Level2", "Level3"])).to.be.true;
            });
        });

        suite("Edge Cases", function() {
            test("should handle suites with special characters", function() {
                metrics.startTest(["Suite-With-Dashes", "Test@#$%", "Test1"]);
                metrics.stopTest();

                expect(metrics.suiteExists(["Suite-With-Dashes"])).to.be.true;
                expect(metrics.suiteExists(["Suite-With-Dashes", "Test@#$%"])).to.be.true;
            });

            test("should handle suites with spaces", function() {
                metrics.startTest(["Suite With Spaces", "Sub Suite With Spaces", "Test1"]);
                metrics.stopTest();

                expect(metrics.suiteExists(["Suite With Spaces"])).to.be.true;
                expect(metrics.suiteExists(["Suite With Spaces", "Sub Suite With Spaces"])).to.be.true;
            });

            test("should handle very long suite names", function() {
                const longSuiteName = "A".repeat(1000);
                metrics.startTest([longSuiteName, "Test1"]);
                metrics.stopTest();

                expect(metrics.suiteExists([longSuiteName])).to.be.true;
            });

            test("should handle deeply nested suites", function() {
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
                    expect(metrics.suiteExists(pathToCheck)).to.be.true;
                }
            });

            test("should be case sensitive", function() {
                metrics.startTest(["CaseSensitive", "Test1"]);
                metrics.stopTest();

                expect(metrics.suiteExists(["CaseSensitive"])).to.be.true;
                expect(metrics.suiteExists(["casesensitive"])).to.be.false;
                expect(metrics.suiteExists(["CASESENSITIVE"])).to.be.false;
                expect(metrics.suiteExists(["CaseSENSITIVE"])).to.be.false;
            });
        });

        suite("Partial Path Existence", function() {
            test("should return false for partial paths when full path doesn't exist", function() {
                // Create Level1 -> Level2 -> Level3
                metrics.startTest(["Level1", "Level2", "Level3", "Test1"]);
                metrics.stopTest();

                // These should exist
                expect(metrics.suiteExists(["Level1"])).to.be.true;
                expect(metrics.suiteExists(["Level1", "Level2"])).to.be.true;
                expect(metrics.suiteExists(["Level1", "Level2", "Level3"])).to.be.true;

                // These should not exist (wrong paths)
                expect(metrics.suiteExists(["Level1", "WrongLevel2"])).to.be.false;
                expect(metrics.suiteExists(["Level1", "Level2", "WrongLevel3"])).to.be.false;
                expect(metrics.suiteExists(["Level1", "Level2", "Level3", "Level4"])).to.be.false;
            });

            test("should handle mixed existing and non-existing paths", function() {
                // Create multiple suite structures
                metrics.startTest(["Suite1", "SubSuite1", "Test1"]);
                metrics.stopTest();

                metrics.startTest(["Suite1", "SubSuite2", "Test2"]);
                metrics.stopTest();

                metrics.startTest(["Suite2", "SubSuite1", "Test3"]);
                metrics.stopTest();

                // Existing paths
                expect(metrics.suiteExists(["Suite1"])).to.be.true;
                expect(metrics.suiteExists(["Suite1", "SubSuite1"])).to.be.true;
                expect(metrics.suiteExists(["Suite1", "SubSuite2"])).to.be.true;
                expect(metrics.suiteExists(["Suite2"])).to.be.true;
                expect(metrics.suiteExists(["Suite2", "SubSuite1"])).to.be.true;

                // Non-existing paths
                expect(metrics.suiteExists(["Suite1", "SubSuite3"])).to.be.false;
                expect(metrics.suiteExists(["Suite2", "SubSuite2"])).to.be.false;
                expect(metrics.suiteExists(["Suite3"])).to.be.false;
                expect(metrics.suiteExists(["Suite1", "SubSuite1", "SubSubSuite"])).to.be.false;
            });
        });

        suite("State Consistency", function() {
            test("should maintain consistency after multiple test operations", function() {
                // Initial state - nothing exists
                expect(metrics.suiteExists(["TestSuite"])).to.be.false;

                // Create first test
                metrics.startTest(["TestSuite", "Test1"]);
                expect(metrics.suiteExists(["TestSuite"])).to.be.true;
                metrics.stopTest();
                expect(metrics.suiteExists(["TestSuite"])).to.be.true;

                // Create second test in same suite
                metrics.startTest(["TestSuite", "Test2"]);
                expect(metrics.suiteExists(["TestSuite"])).to.be.true;
                metrics.stopTest();
                expect(metrics.suiteExists(["TestSuite"])).to.be.true;

                // Create test in nested suite
                metrics.startTest(["TestSuite", "NestedSuite", "Test3"]);
                expect(metrics.suiteExists(["TestSuite"])).to.be.true;
                expect(metrics.suiteExists(["TestSuite", "NestedSuite"])).to.be.true;
                metrics.stopTest();
                expect(metrics.suiteExists(["TestSuite"])).to.be.true;
                expect(metrics.suiteExists(["TestSuite", "NestedSuite"])).to.be.true;
            });
        });
    });



    suite("Cross-Method Consistency", function() {
        test("should maintain consistency between suiteExists and testExists", function() {
            // Create a test structure
            metrics.startTest(["ParentSuite", "ChildSuite", "TestName"]);
            metrics.stopTest();

            // Suite existence checks
            expect(metrics.suiteExists(["ParentSuite"])).to.be.true;
            expect(metrics.suiteExists(["ParentSuite", "ChildSuite"])).to.be.true;

            // Test existence check
            expect(metrics.testExists(["ParentSuite", "ChildSuite", "TestName"])).to.be.true;

            // Cross-validation: test path components should exist as suites
            expect(metrics.suiteExists(["ParentSuite"])).to.be.true;
            expect(metrics.suiteExists(["ParentSuite", "ChildSuite"])).to.be.true;

            // But suite paths should not exist as tests
            expect(metrics.testExists(["ParentSuite", "ChildSuite"])).to.be.false;
        });

        test("should handle complex hierarchies consistently", function() {
            // Create complex structure
            metrics.startTest(["Root", "Branch1", "Leaf1"]);
            metrics.stopTest();

            metrics.startTest(["Root", "Branch1", "Leaf2"]);
            metrics.stopTest();

            metrics.startTest(["Root", "Branch2", "SubBranch", "DeepLeaf"]);
            metrics.stopTest();

            // Verify all suites exist
            expect(metrics.suiteExists(["Root"])).to.be.true;
            expect(metrics.suiteExists(["Root", "Branch1"])).to.be.true;
            expect(metrics.suiteExists(["Root", "Branch2"])).to.be.true;
            expect(metrics.suiteExists(["Root", "Branch2", "SubBranch"])).to.be.true;

            // Verify all tests exist
            expect(metrics.testExists(["Root", "Branch1", "Leaf1"])).to.be.true;
            expect(metrics.testExists(["Root", "Branch1", "Leaf2"])).to.be.true;
            expect(metrics.testExists(["Root", "Branch2", "SubBranch", "DeepLeaf"])).to.be.true;

            // Verify non-existent paths
            expect(metrics.suiteExists(["Root", "Branch3"])).to.be.false;
            expect(metrics.testExists(["Root", "Branch1", "Leaf3"])).to.be.false;
            expect(metrics.testExists(["Root", "Branch2", "SubBranch", "ShallowLeaf"])).to.be.false;
        });
    });

    suite("Performance and Stress Tests", function() {
        test("should handle large number of suites efficiently", function() {
            const numSuites = 100;

            // Create many suites
            for (let i = 0; i < numSuites; i++) {
                metrics.startTest([`Suite${i}`, `Test${i}`]);
                metrics.stopTest();
            }

            // Verify all exist
            for (let i = 0; i < numSuites; i++) {
                expect(metrics.suiteExists([`Suite${i}`])).to.be.true;
                expect(metrics.testExists([`Suite${i}`, `Test${i}`])).to.be.true;
            }

            // Verify non-existent ones don't exist
            expect(metrics.suiteExists([`Suite${numSuites}`])).to.be.false;
            expect(metrics.testExists([`Suite0`, `Test${numSuites}`])).to.be.false;
        });

        test("should handle large number of tests in same suite efficiently", function() {
            const numTests = 100;

            // Create many tests in same suite
            for (let i = 0; i < numTests; i++) {
                metrics.startTest(["LargeSuite", `Test${i}`]);
                metrics.stopTest();
            }

            // Verify all exist
            expect(metrics.suiteExists(["LargeSuite"])).to.be.true;
            for (let i = 0; i < numTests; i++) {
                expect(metrics.testExists(["LargeSuite", `Test${i}`])).to.be.true;
            }

            // Verify non-existent test doesn't exist
            expect(metrics.testExists(["LargeSuite", `Test${numTests}`])).to.be.false;
        });
    });

    suite("Error Recovery", function() {
        test("should handle errors gracefully and maintain state", function() {
            // Create valid structure
            metrics.startTest(["ValidSuite", "ValidTest"]);
            metrics.stopTest();

            expect(metrics.suiteExists(["ValidSuite"])).to.be.true;
            expect(metrics.testExists(["ValidSuite", "ValidTest"])).to.be.true;

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
            expect(metrics.suiteExists(["ValidSuite"])).to.be.true;
            expect(metrics.testExists(["ValidSuite", "ValidTest"])).to.be.true;
        });
    });
});

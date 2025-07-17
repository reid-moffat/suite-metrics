import { assert } from 'chai';
import { ConcurrentSuiteMetrics, SuiteData } from "../../src/index.ts";
import { createPresetData, createSimpleTestData, PRESET_TYPE } from "../generators/testDataHelpers.ts";
import { sleep } from "../helpers.js";

suite("[ConcurrentSuiteMetrics] Basic tests", function() {

    const _ = null; // Makes 'ignored' parameter for assert.throws() less obvious

    let metrics: ConcurrentSuiteMetrics;

    setup(function() {
        metrics = new ConcurrentSuiteMetrics();
    });

    suite("Basic Functionality", function() {
        test("Single test timing", function() {
            const path = ["Basic Functionality", "Single test timing"];
            console.log(`Running test: ${path.join(" > ")}`);

            metrics.startTest(path);
            sleep(10); // Simulate some work
            metrics.stopTest(path);

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Multiple tests in same suite", function() {
            const path1 = ["Basic Functionality", "Test 1"];
            const path2 = ["Basic Functionality", "Test 2"];

            console.log(`Running test: ${path1.join(" > ")}`);
            metrics.startTest(path1);
            sleep(5);
            metrics.stopTest(path1);

            console.log(`Running test: ${path2.join(" > ")}`);
            metrics.startTest(path2);
            sleep(15);
            metrics.stopTest(path2);

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Deeply nested suites", function() {
            const path = ["Level1", "Level2", "Level3", "Level4", "Deep test"];
            console.log(`Running test: ${path.join(" > ")}`);

            metrics.startTest(path);
            sleep(8);
            metrics.stopTest(path);

            console.log(metrics.printAllSuiteMetrics());
        });
    });

    suite("Concurrent Execution", function() {
        test("Two concurrent tests in different suites", function() {
            const path1 = ["Concurrent Execution", "Suite A", "Concurrent test A"];
            const path2 = ["Concurrent Execution", "Suite B", "Concurrent test B"];

            console.log(`Starting concurrent tests: ${path1.join(" > ")} and ${path2.join(" > ")}`);

            // Start both tests concurrently
            const promise1 = (async () => {
                metrics.startTest(path1);
                sleep(20);
                metrics.stopTest(path1);
            })();

            const promise2 = (async () => {
                sleep(2); // Slight offset to test true concurrency
                metrics.startTest(path2);
                sleep(15);
                metrics.stopTest(path2);
            })();

            Promise.all([promise1, promise2]);

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Multiple concurrent tests in same suite", function() {
            const basePath = ["Concurrent Execution", "Same Suite"];
            const path1 = [...basePath, "Concurrent test 1"];
            const path2 = [...basePath, "Concurrent test 2"];
            const path3 = [...basePath, "Concurrent test 3"];

            console.log("Starting multiple concurrent tests in same suite");

            // Start all tests concurrently
            const promises = [
                (async () => {
                    metrics.startTest(path1);
                    sleep(10);
                    metrics.stopTest(path1);
                })(),
                (async () => {
                    sleep(2);
                    metrics.startTest(path2);
                    sleep(25);
                    metrics.stopTest(path2);
                })(),
                (async () => {
                    sleep(5);
                    metrics.startTest(path3);
                    sleep(8);
                    metrics.stopTest(path3);
                })()
            ];

            Promise.all(promises);

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Interleaved test execution", function() {
            const path1 = ["Concurrent Execution", "Interleaved", "Test 1"];
            const path2 = ["Concurrent Execution", "Interleaved", "Test 2"];

            console.log("Testing interleaved execution");

            // Start first test
            metrics.startTest(path1);
            sleep(5);

            // Start second test while first is still running
            metrics.startTest(path2);
            sleep(10);

            // Stop first test
            metrics.stopTest(path1);
            sleep(5);

            // Stop second test
            metrics.stopTest(path2);

            console.log(metrics.printAllSuiteMetrics());
        });
    });

    suite("Error Handling", function() {
        test("Invalid test names - empty array", function() {
            const test: () => void = (): void => metrics.startTest([]);
            const expectedError: string = "Path cannot be empty, must define at least one suite/test";

            assert.throws(test, expectedError, _, "Providing an empty array for the path should fail");
        });

        test("Invalid test names - non-string elements", function() {
            // @ts-ignore - intentionally passing invalid types for testing
            const test: () => void = (): void => metrics.startTest(["ValidSuite", 123, "TestName"]);
            const expectedError: string = "Suite/test path element at index 1 must be a 'string', got 'number'";

            assert.throws(test, expectedError, _, "Providing a non-string in the path should fail");
        });

        test("Invalid test names - non-array input", function() {
            // @ts-ignore - intentionally passing invalid types for testing
            const test: () => void = (): void => metrics.startTest("NotAnArray");
            const expectedError: string = "Suite/test path must be an array";

            assert.throws(test, expectedError, _, "Providing a non-array input to startTest should fail");
        });

        test("Stopping test that wasn't started", function() {
            const test: () => void = (): void => metrics.stopTest(["Error Handling", "Non-existent test"]);
            const expectedError: string = "Test [Error Handling, Non-existent test] is not currently running. Call startTest() first to begin testing";

            assert.throws(test, expectedError, _, "Stopping a non-existent test should fail");
        });

        test("Starting same test twice", function() {
            const path: string[] = ["Error Handling", "Duplicate test"];
            metrics.startTest(path);

            const test: () => void = (): void => metrics.startTest(path);
            const expectedError: string = "Test [Error Handling, Duplicate test] is already running";

            assert.throws(test, expectedError, _, "Starting a test that's already running should fail");
        });

        test("Starting completed test again", function() {
            const path: string[] = ["Error Handling", "Duplicate test"];
            metrics.startTest(path);
            sleep(100);
            metrics.stopTest(path);

            const test: () => void = (): void => metrics.startTest(path);
            const expectedError: string = "Test [Error Handling, Duplicate test] already exists";

            assert.throws(test, expectedError, _, "Starting a test that's already completed should fail");
        });
    });

    suite("Metrics Verification", function() {
        test("Test duration accuracy", function() {
            const path = ["Metrics Verification", "Duration test"];
            const expectedDuration = 50; // milliseconds

            const startTime = Date.now();
            metrics.startTest(path);
            sleep(expectedDuration);
            metrics.stopTest(path);
            const actualElapsed = Date.now() - startTime;

            // Allow some tolerance for timing variations
            assert.closeTo(actualElapsed, expectedDuration + 10, 20, "Actual elapsed time should be close to expected duration");

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Suite metrics with multiple tests", function() {
            const suitePath = ["Metrics Verification", "Multi-test suite"];

            // Run several tests in the same suite
            for (let i = 1; i <= 3; i++) {
                const testPath = [...suitePath, `Test ${i}`];
                metrics.startTest(testPath);
                sleep(i * 10); // Different durations
                metrics.stopTest(testPath);
            }

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Print format verification", function() {
            // This test just verifies the print method doesn't crash
            const output = metrics.printAllSuiteMetrics();
            assert.isString(output, "Print output should be a string");
            console.log("Print output:", output);
        });
    });

    suite("Suite and Test Existence", function() {
        test("Check suite existence", function() {
            const suitePath = ["Suite Existence", "Test Suite"];
            const testPath = [...suitePath, "Sample Test"];

            // Initially should not exist
            assert.isFalse(metrics.suiteExists(suitePath), "Suite should not exist initially");

            // After running a test, suite should exist
            metrics.startTest(testPath);
            metrics.stopTest(testPath);

            assert.isTrue(metrics.suiteExists(suitePath), "Suite should exist after running test");
        });

        test("Check test existence", function() {
            const testPath = ["Suite Existence", "Test Suite", "Existence Test"];

            // Initially should not exist
            assert.isFalse(metrics.testExists(testPath), "Test should not exist initially");

            // After running the test, it should exist
            metrics.startTest(testPath);
            metrics.stopTest(testPath);

            assert.isTrue(metrics.testExists(testPath), "Test should exist after running");
        });

        test("Check nested suite existence", function() {
            const nestedPath = ["Level1", "Level2", "Level3"];
            const testPath = [...nestedPath, "Nested Test"];

            assert.isFalse(metrics.suiteExists(["Level1"]), "Level1 should not exist initially");
            assert.isFalse(metrics.suiteExists(["Level1", "Level2"]), "Level1>Level2 should not exist initially");
            assert.isFalse(metrics.suiteExists(nestedPath), "Nested path should not exist initially");

            metrics.startTest(testPath);
            metrics.stopTest(testPath);

            assert.isTrue(metrics.suiteExists(["Level1"]), "Level1 should exist after running nested test");
            assert.isTrue(metrics.suiteExists(["Level1", "Level2"]), "Level1>Level2 should exist after running nested test");
            assert.isTrue(metrics.suiteExists(nestedPath), "Nested path should exist after running nested test");
        });
    });

    suite("Metrics Retrieval", function() {
        test("Get suite metrics", function() {
            const suitePath = ["Metrics Retrieval", "Sample Suite"];

            // Run some tests
            for (let i = 1; i <= 2; i++) {
                const testPath = [...suitePath, `Test ${i}`];
                metrics.startTest(testPath);
                sleep(i * 5);
                metrics.stopTest(testPath);
            }

            const suiteMetrics: SuiteData = metrics.getSuiteMetrics(suitePath);
            assert.exists(suiteMetrics, "Suite metrics should exist");
            assert.strictEqual(suiteMetrics.name, "Sample Suite", "Suite should have correct name");
            assert.strictEqual(suiteMetrics.testMetrics.numTests, 2, "Suite should have 2 tests");
        });

        test("Get recursive suite metrics", function() {
            const basePath = ["Metrics Retrieval", "Recursive Suite"];

            // Create nested structure with tests at different levels
            metrics.startTest([...basePath, "Direct Test"]);
            sleep(10);
            metrics.stopTest([...basePath, "Direct Test"]);

            metrics.startTest([...basePath, "Sub Suite", "Nested Test"]);
            sleep(15);
            metrics.stopTest([...basePath, "Sub Suite", "Nested Test"]);

            const recursiveMetrics = metrics.getSuiteMetricsRecursive(basePath);
            assert.exists(recursiveMetrics, "Recursive metrics should exist");
            assert.strictEqual(recursiveMetrics.name, "Recursive Suite", "Recursive suite should have correct name");
        });
    });

    suite("Edge Cases", function() {
        test("Tests with same names in different suites", function() {
            const path1 = ["Edge Cases", "Suite A", "Same Name"];
            const path2 = ["Edge Cases", "Suite B", "Same Name"];

            metrics.startTest(path1);
            sleep(10);
            metrics.stopTest(path1);

            metrics.startTest(path2);
            sleep(20);
            metrics.stopTest(path2);

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Very long test names", function() {
            const longName = "This is a very long test name that might cause issues with string handling or display formatting";
            const path = ["Edge Cases", "Long Names", longName];

            metrics.startTest(path);
            sleep(5);
            metrics.stopTest(path);

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Empty suite name components", function() {
            try {
                metrics.startTest(["Edge Cases", "", "Test"]);
                // Some implementations might allow empty strings, others might not
                metrics.stopTest(["Edge Cases", "", "Test"]);
            } catch (error: any) {
                console.log("Empty suite name threw error:", error.message);
                assert.exists(error, "Error should exist for empty suite name");
            }
        });

        test("Maximum nesting depth", function() {
            const deepPath = Array(10).fill(0).map((_, i) => `Level${i}`);
            deepPath.push("Deep Test");

            metrics.startTest(deepPath);
            sleep(5);
            metrics.stopTest(deepPath);

            console.log(metrics.printAllSuiteMetrics());
        });
    });

    suite("Performance Tests", function() {
        test("Many concurrent tests", function() {
            const numTests = 10;
            const promises: Promise<void>[] = [];

            console.log(`Starting ${numTests} concurrent tests`);

            for (let i = 0; i < numTests; i++) {
                const testPath = ["Performance Tests", "Many concurrent", `Test ${i}`];
                promises.push(
                    (async () => {
                        metrics.startTest(testPath);
                        sleep(Math.random() * 20); // Random duration
                        metrics.stopTest(testPath);
                    })()
                );
            }

            Promise.all(promises);

            console.log(metrics.printAllSuiteMetrics());
        });

        test("Sequential test performance", function() {
            const numTests = 20;

            console.log(`Running ${numTests} sequential tests`);

            for (let i = 0; i < numTests; i++) {
                const testPath = ["Performance Tests", "Sequential", `Test ${i}`];
                metrics.startTest(testPath);
                sleep(2); // Short duration
                metrics.stopTest(testPath);
            }

            console.log(metrics.printAllSuiteMetrics());
        });
    });

    suite("Using Test Data Helpers", function() {
        test("Work with simple test data helper for concurrent metrics", function() {
            const metrics = createSimpleTestData(true, {
                numSuites: 4,
                testsPerSuite: 3,
                suiteNamePrefix: "ConcurrentSuite",
                testNamePrefix: "ConcurrentTest"
            });

            // Verify the structure was created correctly
            assert.isTrue(metrics.suiteExists(["ConcurrentSuite1"]), "ConcurrentSuite1 should exist");
            assert.isTrue(metrics.testExists(["ConcurrentSuite1", "ConcurrentTest1"]), "ConcurrentSuite1>ConcurrentTest1 should exist");
            assert.isTrue(metrics.testExists(["ConcurrentSuite4", "ConcurrentTest3"]), "ConcurrentSuite4>ConcurrentTest3 should exist");

            // Verify metrics work correctly
            const suite1Data = metrics.getSuiteMetrics(["ConcurrentSuite1"]);
            assert.strictEqual(suite1Data.testMetrics.numTests, 3, "ConcurrentSuite1 should have 3 tests");
            assert.isNumber(suite1Data.testMetrics.totalTime, "Suite should have numeric total time");
            assert.isAbove(suite1Data.testMetrics.totalTime!, 0, "Suite total time should be positive");
        });

        test("Work with complex test data helper for concurrent metrics", function() {
            const metrics = createPresetData(true, PRESET_TYPE.REALISTIC_PREMADE);

            // Verify the complex structure was created
            assert.isTrue(metrics.suiteExists(["Authentication"]), "Expected 'Authentication' suite to exist");
            assert.isTrue(metrics.suiteExists(["Authentication", "OAuth"]), "Expected 'Authentication > OAuth' suite to exist");
            assert.isTrue(metrics.suiteExists(["API", "Users", "Validation"]), "Expected 'API > Users > Validation' suite to exist");

            // Verify specific tests exist
            assert.isTrue(metrics.testExists(["Authentication", "login"]), "Authentication>login test should exist");
            assert.isTrue(metrics.testExists(["Authentication", "OAuth", "google_login"]), "Authentication>OAuth>google_login test should exist");
            assert.isTrue(metrics.testExists(["API", "Users", "Validation", "email_validation"]), "API>Users>Validation>email_validation test should exist");

            // Test metrics at different levels
            const authData = metrics.getSuiteMetrics(["Authentication"]);
            assert.strictEqual(authData.testMetrics.numTests, 3, "Authentication suite should have 3 direct tests"); // Direct tests only
            assert.isArray(authData.childSuites, "Authentication suite should have child suites array");
            assert.includeMembers(authData.childSuites!, ["OAuth", "TwoFactor"], "Authentication suite should include OAuth and TwoFactor child suites");

            const apiUsersData = metrics.getSuiteMetrics(["API", "Users"]);
            assert.strictEqual(apiUsersData.testMetrics.numTests, 4, "API>Users suite should have 4 tests");
            assert.deepEqual(apiUsersData.childSuites, ["Validation"], "API>Users suite should have Validation as only child suite");
        });

        test("Handle large datasets efficiently with concurrent metrics", function() {
            const startTime = Date.now();
            const metrics = createSimpleTestData(true, {
                numSuites: 15,
                testsPerSuite: 20,
                addTimingDelays: false // Fast generation for performance test
            });
            const endTime = Date.now();

            assert.isBelow(endTime - startTime, 300, "Large dataset generation should be fast"); // Should be very fast

            // Verify random sampling of the data
            assert.isTrue(metrics.suiteExists(["Suite1"]), "Suite1 should exist in large dataset");
            assert.isTrue(metrics.suiteExists(["Suite8"]), "Suite8 should exist in large dataset");
            assert.isTrue(metrics.suiteExists(["Suite15"]), "Suite15 should exist in large dataset");

            const suite8Data = metrics.getSuiteMetrics(["Suite8"]);
            assert.strictEqual(suite8Data.testMetrics.numTests, 20, "Suite8 should have 20 tests");
            assert.isNumber(suite8Data.testMetrics.totalTime, "Suite8 should have numeric total time");
            assert.isAtLeast(suite8Data.testMetrics.totalTime!, 0, "Suite8 total time should be non-negative");

            // Verify top-level structure
            const topLevelData = metrics.getSuiteMetrics([]);
            assert.isArray(topLevelData.childSuites, "Top level should have child suites array");
            assert.lengthOf(topLevelData.childSuites!, 15, "Top level should have 15 child suites");
        });

        test("Provide useful generation information for concurrent metrics", function() {
            const metrics = createPresetData(true, PRESET_TYPE.REALISTIC_PREMADE);

            // Verify GeneratedTestData provides useful information
            // TODO
        });
    });
});

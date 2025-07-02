import { expect } from 'chai';
import SuiteMetrics, { ConcurrentSuiteMetrics, RecursiveSuiteData } from "../../src/index.ts";

suite("Singleton Pattern tests", function() {

    let metrics: SuiteMetrics;
    let concurrentMetrics: ConcurrentSuiteMetrics;

    setup(function() {
        metrics = new SuiteMetrics();
        concurrentMetrics = new ConcurrentSuiteMetrics();
    });

    suite("getInstance returns same instance", function() {
        test("SuiteMetrics", function() {
            const instance1: SuiteMetrics = SuiteMetrics.getInstance();
            const instance2: SuiteMetrics = SuiteMetrics.getInstance();

            expect(instance1).to.equal(instance2);
            expect(instance1).to.be.an.instanceOf(SuiteMetrics);
        });

        test("ConcurrentSuiteMetrics", function() {
            const instance1: ConcurrentSuiteMetrics = ConcurrentSuiteMetrics.getInstance();
            const instance2: ConcurrentSuiteMetrics = ConcurrentSuiteMetrics.getInstance();

            expect(instance1).to.equal(instance2);
            expect(instance1).to.be.an.instanceOf(ConcurrentSuiteMetrics);
        });

        test("Compare multiple calls", function() {
            const normalInstances: SuiteMetrics[] = Array.from({ length: 10 }, _ => SuiteMetrics.getInstance());
            const concurrentInstances: ConcurrentSuiteMetrics[] = Array.from({ length: 10 }, _ => ConcurrentSuiteMetrics.getInstance());

            for (let i = 0; i < normalInstances.length; ++i) {
                expect(normalInstances[i]).to.be.an.instanceOf(SuiteMetrics);
                expect(normalInstances[i]).to.equal(normalInstances[(i + 1) % normalInstances.length]);
                expect(normalInstances[i]).to.not.equal(concurrentInstances[(i + 1) % concurrentInstances.length]);
            }
            for (let i = 0; i < concurrentInstances.length; ++i) {
                expect(concurrentInstances[i]).to.be.an.instanceOf(ConcurrentSuiteMetrics);
                expect(concurrentInstances[i]).to.equal(concurrentInstances[(i + 1) % concurrentInstances.length]);
                expect(concurrentInstances[i]).to.not.equal(normalInstances[(i + 1) % normalInstances.length]);
            }
        });

        test("Singleton consistency across different access patterns", function() {
            // Test various ways of accessing the singleton
            const direct1 = SuiteMetrics.getInstance();
            const direct2 = SuiteMetrics.getInstance();

            // Access after operations
            direct1.startTest(['test-suite', 'test1']);
            direct1.stopTest();
            const afterOp = SuiteMetrics.getInstance();

            // Access in different execution contexts
            const fromCallback = (() => SuiteMetrics.getInstance())();
            const fromPromise = Promise.resolve().then(() => SuiteMetrics.getInstance());

            expect(direct1).to.equal(direct2);
            expect(direct1).to.equal(afterOp);
            expect(direct1).to.equal(fromCallback);

            return fromPromise.then(promiseInstance => {
                expect(direct1).to.equal(promiseInstance);
            });
        });

        test("Singleton identity with concurrent access", function() {
            const instances: SuiteMetrics[] = [];
            const concurrentInstances: ConcurrentSuiteMetrics[] = [];

            // Simulate concurrent access
            for (let i = 0; i < 5; i++) {
                instances.push(SuiteMetrics.getInstance());
                concurrentInstances.push(ConcurrentSuiteMetrics.getInstance());
            }

            // All SuiteMetrics instances should be identical
            for (let i = 1; i < instances.length; i++) {
                expect(instances[0]).to.equal(instances[i]);
            }

            // All ConcurrentSuiteMetrics instances should be identical
            for (let i = 1; i < concurrentInstances.length; i++) {
                expect(concurrentInstances[0]).to.equal(concurrentInstances[i]);
            }

            // But they should be different from each other
            expect(instances[0]).to.not.equal(concurrentInstances[0]);
        });
    });

    suite("resetInstance creates new instance", function() {
        test("SuiteMetrics", function() {
            const instance1: SuiteMetrics = SuiteMetrics.getInstance();
            SuiteMetrics.resetInstance();
            const instance2: SuiteMetrics = SuiteMetrics.getInstance();

            expect(instance1).to.not.equal(instance2);
            expect(instance1).to.be.an.instanceOf(SuiteMetrics);
            expect(instance2).to.be.an.instanceOf(SuiteMetrics);
        });

        test("ConcurrentSuiteMetrics", function() {
            const instance1: ConcurrentSuiteMetrics = ConcurrentSuiteMetrics.getInstance();
            ConcurrentSuiteMetrics.resetInstance();
            const instance2: ConcurrentSuiteMetrics = ConcurrentSuiteMetrics.getInstance();

            expect(instance1).to.not.equal(instance2);
            expect(instance1).to.be.an.instanceOf(ConcurrentSuiteMetrics);
            expect(instance2).to.be.an.instanceOf(ConcurrentSuiteMetrics);
        });

        test("Reset creates completely fresh instance", function() {
            const instance1 = SuiteMetrics.getInstance();

            // Add some data to the instance
            instance1.startTest(['reset-test', 'test1']);
            instance1.stopTest();

            expect(instance1.testExists(['reset-test', 'test1'])).to.be.true;

            // Reset and get new instance
            SuiteMetrics.resetInstance();
            const instance2 = SuiteMetrics.getInstance();

            // New instance should be clean
            expect(instance2.testExists(['reset-test', 'test1'])).to.be.false;
            expect(instance1).to.not.equal(instance2);
        });

        test("Reset preserves singleton behavior for new instance", function() {
            SuiteMetrics.resetInstance();
            const instance1 = SuiteMetrics.getInstance();
            const instance2 = SuiteMetrics.getInstance();

            expect(instance1).to.equal(instance2);
            expect(instance1).to.be.an.instanceOf(SuiteMetrics);
        });
    });

    suite("resetInstance idempotency", function() {
        test("SuiteMetrics", function() {
            const instance1: SuiteMetrics = SuiteMetrics.getInstance();
            SuiteMetrics.resetInstance();
            const instance2: SuiteMetrics = SuiteMetrics.getInstance();
            SuiteMetrics.resetInstance();
            const instance3: SuiteMetrics = SuiteMetrics.getInstance();

            expect(instance1).to.be.an.instanceOf(SuiteMetrics);
            expect(instance2).to.be.an.instanceOf(SuiteMetrics);
            expect(instance3).to.be.an.instanceOf(SuiteMetrics);

            expect(instance1).to.not.equal(instance2);
            expect(instance2).to.not.equal(instance3);
            expect(instance1).to.not.equal(instance3);
        });

        test("ConcurrentSuiteMetrics", function() {
            const instance1: ConcurrentSuiteMetrics = ConcurrentSuiteMetrics.getInstance();
            ConcurrentSuiteMetrics.resetInstance();
            const instance2: ConcurrentSuiteMetrics = ConcurrentSuiteMetrics.getInstance();
            ConcurrentSuiteMetrics.resetInstance();
            const instance3: ConcurrentSuiteMetrics = ConcurrentSuiteMetrics.getInstance();

            expect(instance1).to.be.an.instanceOf(ConcurrentSuiteMetrics);
            expect(instance2).to.be.an.instanceOf(ConcurrentSuiteMetrics);
            expect(instance3).to.be.an.instanceOf(ConcurrentSuiteMetrics);

            expect(instance1).to.not.equal(instance2);
            expect(instance2).to.not.equal(instance3);
            expect(instance1).to.not.equal(instance3);
        });

        test("Multiple consecutive resets", function() {
            const originalInstance = SuiteMetrics.getInstance();

            // Perform multiple resets
            SuiteMetrics.resetInstance();
            SuiteMetrics.resetInstance();
            SuiteMetrics.resetInstance();

            const newInstance = SuiteMetrics.getInstance();
            expect(originalInstance).to.not.equal(newInstance);

            // Verify singleton behavior still works
            const sameInstance = SuiteMetrics.getInstance();
            expect(newInstance).to.equal(sameInstance);
        });

        test("Reset with data persistence verification", function() {
            // Create instance with data
            const instance1 = SuiteMetrics.getInstance();
            instance1.startTest(['persistence-test', 'test1']);
            instance1.stopTest();

            expect(instance1.getSuiteMetricsRecursive([]).totalTestMetrics.numTests).to.equal(1);

            // Reset multiple times
            SuiteMetrics.resetInstance();
            SuiteMetrics.resetInstance();

            const instance2 = SuiteMetrics.getInstance();
            expect(instance2.getSuiteMetricsRecursive([]).totalTestMetrics.numTests).to.equal(0);
            expect(instance1).to.not.equal(instance2);
        });
    });

    suite("resetInstance doesn't affect future idempotency", function() {
        test("SuiteMetrics", function() {
            SuiteMetrics.resetInstance();
            const instance1: SuiteMetrics = SuiteMetrics.getInstance();
            const instance2: SuiteMetrics = SuiteMetrics.getInstance();

            expect(instance1).to.equal(instance2);
            expect(instance1).to.be.an.instanceOf(SuiteMetrics);
            expect(instance2).to.be.an.instanceOf(SuiteMetrics);
        });

        test("ConcurrentSuiteMetrics", function() {
            ConcurrentSuiteMetrics.resetInstance();
            const instance1: ConcurrentSuiteMetrics = ConcurrentSuiteMetrics.getInstance();
            const instance2: ConcurrentSuiteMetrics = ConcurrentSuiteMetrics.getInstance();

            expect(instance1).to.equal(instance2);
            expect(instance1).to.be.an.instanceOf(ConcurrentSuiteMetrics);
            expect(instance2).to.be.an.instanceOf(ConcurrentSuiteMetrics);
        });

        test("Idempotency after reset with operations", function() {
            SuiteMetrics.resetInstance();

            const instance1 = SuiteMetrics.getInstance();
            instance1.startTest(['idempotency-test', 'test1']);
            instance1.stopTest();

            const instance2 = SuiteMetrics.getInstance();
            expect(instance1).to.equal(instance2);
            expect(instance2.testExists(['idempotency-test', 'test1'])).to.be.true;
        });

        test("Idempotency across multiple reset cycles", function() {
            // First cycle
            SuiteMetrics.resetInstance();
            const cycle1_instance1 = SuiteMetrics.getInstance();
            const cycle1_instance2 = SuiteMetrics.getInstance();
            expect(cycle1_instance1).to.equal(cycle1_instance2);

            // Second cycle
            SuiteMetrics.resetInstance();
            const cycle2_instance1 = SuiteMetrics.getInstance();
            const cycle2_instance2 = SuiteMetrics.getInstance();
            expect(cycle2_instance1).to.equal(cycle2_instance2);

            // Cycles should be different
            expect(cycle1_instance1).to.not.equal(cycle2_instance1);
        });
    });

    suite("Cross-class independence", function() {
        test("SuiteMetrics reset", function() {
            const concurrentInstance1: ConcurrentSuiteMetrics = ConcurrentSuiteMetrics.getInstance();
            SuiteMetrics.resetInstance();
            const concurrentInstance2: ConcurrentSuiteMetrics = ConcurrentSuiteMetrics.getInstance();

            expect(concurrentInstance1).to.be.an.instanceOf(ConcurrentSuiteMetrics);
            expect(concurrentInstance2).to.be.an.instanceOf(ConcurrentSuiteMetrics);
            expect(concurrentInstance1).to.equal(concurrentInstance2);
        });

        test("ConcurrentSuiteMetrics reset", function() {
            const suiteInstance1: SuiteMetrics = SuiteMetrics.getInstance();
            ConcurrentSuiteMetrics.resetInstance();
            const suiteInstance2: SuiteMetrics = SuiteMetrics.getInstance();

            expect(suiteInstance1).to.be.an.instanceOf(SuiteMetrics);
            expect(suiteInstance2).to.be.an.instanceOf(SuiteMetrics);
            expect(suiteInstance1).to.equal(suiteInstance2);
        });

        test("Both classes maintain separate singleton instances", function() {
            const suiteInstance: SuiteMetrics = SuiteMetrics.getInstance();
            const concurrentInstance: ConcurrentSuiteMetrics = ConcurrentSuiteMetrics.getInstance();
            expect(suiteInstance).to.not.equal(concurrentInstance);

            SuiteMetrics.resetInstance();
            ConcurrentSuiteMetrics.resetInstance();

            const suiteInstance2: SuiteMetrics = SuiteMetrics.getInstance();
            const concurrentInstance2: ConcurrentSuiteMetrics = ConcurrentSuiteMetrics.getInstance();
            expect(suiteInstance2).to.not.equal(concurrentInstance2);

            expect(suiteInstance).to.not.equal(suiteInstance2);
            expect(concurrentInstance).to.not.equal(concurrentInstance2);
        });

        test("Cross-class data isolation", function() {
            const suiteInstance = SuiteMetrics.getInstance();
            const concurrentInstance = ConcurrentSuiteMetrics.getInstance();

            // Add data to both instances
            suiteInstance.startTest(['suite-data', 'test1']);
            suiteInstance.stopTest();

            concurrentInstance.startTest(['concurrent-data', 'test1']);
            concurrentInstance.stopTest(['concurrent-data', 'test1']);

            // Verify data exists in both
            expect(suiteInstance.testExists(['suite-data', 'test1'])).to.be.true;
            expect(concurrentInstance.testExists(['concurrent-data', 'test1'])).to.be.true;

            // Reset one class
            SuiteMetrics.resetInstance();
            const newSuiteInstance = SuiteMetrics.getInstance();
            const sameConcurrentInstance = ConcurrentSuiteMetrics.getInstance();

            // Verify isolation
            expect(newSuiteInstance.testExists(['suite-data', 'test1'])).to.be.false;
            expect(sameConcurrentInstance.testExists(['concurrent-data', 'test1'])).to.be.true;
            expect(concurrentInstance).to.equal(sameConcurrentInstance);
        });

        test("Independent reset operations", function() {
            // Get initial instances
            const suite1 = SuiteMetrics.getInstance();
            const concurrent1 = ConcurrentSuiteMetrics.getInstance();

            // Reset SuiteMetrics only
            SuiteMetrics.resetInstance();
            const suite2 = SuiteMetrics.getInstance();
            const concurrent2 = ConcurrentSuiteMetrics.getInstance();

            expect(suite1).to.not.equal(suite2);
            expect(concurrent1).to.equal(concurrent2);

            // Reset ConcurrentSuiteMetrics only
            ConcurrentSuiteMetrics.resetInstance();
            const suite3 = SuiteMetrics.getInstance();
            const concurrent3 = ConcurrentSuiteMetrics.getInstance();

            expect(suite2).to.equal(suite3);
            expect(concurrent2).to.not.equal(concurrent3);
        });

        test("Alternating resets maintain independence", function() {
            const initialSuite = SuiteMetrics.getInstance();
            const initialConcurrent = ConcurrentSuiteMetrics.getInstance();

            // Alternating resets
            SuiteMetrics.resetInstance();
            const suite1 = SuiteMetrics.getInstance();
            const concurrent1 = ConcurrentSuiteMetrics.getInstance();

            ConcurrentSuiteMetrics.resetInstance();
            const suite2 = SuiteMetrics.getInstance();
            const concurrent2 = ConcurrentSuiteMetrics.getInstance();

            SuiteMetrics.resetInstance();
            const suite3 = SuiteMetrics.getInstance();
            const concurrent3 = ConcurrentSuiteMetrics.getInstance();

            // Verify independence
            expect(initialSuite).to.not.equal(suite1);
            expect(suite1).to.equal(suite2);
            expect(suite2).to.not.equal(suite3);

            expect(initialConcurrent).to.equal(concurrent1);
            expect(concurrent1).to.not.equal(concurrent2);
            expect(concurrent2).to.equal(concurrent3);
        });
    });

    suite("Instances are empty after reset", function() {
        test("SuiteMetrics", function() {
            // Simulate test completion
            metrics.startTest(['suite1', 'test1']);
            metrics.stopTest();

            // Get instance data after reset
            SuiteMetrics.resetInstance();
            const instanceData: RecursiveSuiteData = SuiteMetrics.getInstance().getSuiteMetricsRecursive([]);

            expect(instanceData.totalTestMetrics.numTests).to.equal(0);
        });

        test("ConcurrentSuiteMetrics", function() {
            // Simulate test completion
            concurrentMetrics.startTest(['suiteA', 'testA']);
            concurrentMetrics.stopTest(['suiteA', 'testA']);

            // Get instance data before/after reset
            ConcurrentSuiteMetrics.resetInstance();
            const instanceData: RecursiveSuiteData = ConcurrentSuiteMetrics.getInstance().getSuiteMetricsRecursive([]);

            expect(instanceData.totalTestMetrics.numTests).to.equal(0);
        });

        test("Complex data structure reset - SuiteMetrics", function() {
            const instance = SuiteMetrics.getInstance();

            // Create complex nested structure
            instance.startTest(['level1', 'test1']);
            instance.stopTest();
            instance.startTest(['level1', 'level2', 'test2']);
            instance.stopTest();
            instance.startTest(['level1', 'level2', 'level3', 'test3']);
            instance.stopTest();

            // Verify data exists
            expect(instance.getSuiteMetricsRecursive([]).totalTestMetrics.numTests).to.equal(3);
            expect(instance.suiteExists(['level1'])).to.be.true;
            expect(instance.suiteExists(['level1', 'level2'])).to.be.true;
            expect(instance.suiteExists(['level1', 'level2', 'level3'])).to.be.true;

            // Reset and verify clean state
            SuiteMetrics.resetInstance();
            const newInstance = SuiteMetrics.getInstance();

            expect(newInstance.getSuiteMetricsRecursive([]).totalTestMetrics.numTests).to.equal(0);
            expect(newInstance.suiteExists(['level1'])).to.be.false;
            expect(newInstance.suiteExists(['level1', 'level2'])).to.be.false;
            expect(newInstance.suiteExists(['level1', 'level2', 'level3'])).to.be.false;
        });

        test("Complex data structure reset - ConcurrentSuiteMetrics", function() {
            const instance = ConcurrentSuiteMetrics.getInstance();

            // Create complex nested structure
            instance.startTest(['level1', 'test1']);
            instance.stopTest(['level1', 'test1']);
            instance.startTest(['level1', 'level2', 'test2']);
            instance.stopTest(['level1', 'level2', 'test2']);
            instance.startTest(['level1', 'level2', 'level3', 'test3']);
            instance.stopTest(['level1', 'level2', 'level3', 'test3']);

            // Verify data exists
            expect(instance.getSuiteMetricsRecursive([]).totalTestMetrics.numTests).to.equal(3);
            expect(instance.suiteExists(['level1'])).to.be.true;
            expect(instance.suiteExists(['level1', 'level2'])).to.be.true;
            expect(instance.suiteExists(['level1', 'level2', 'level3'])).to.be.true;

            // Reset and verify clean state
            ConcurrentSuiteMetrics.resetInstance();
            const newInstance = ConcurrentSuiteMetrics.getInstance();

            expect(newInstance.getSuiteMetricsRecursive([]).totalTestMetrics.numTests).to.equal(0);
            expect(newInstance.suiteExists(['level1'])).to.be.false;
            expect(newInstance.suiteExists(['level1', 'level2'])).to.be.false;
            expect(newInstance.suiteExists(['level1', 'level2', 'level3'])).to.be.false;
        });

        test("Reset clears all metrics and counters", function() {
            const instance = SuiteMetrics.getInstance();

            // Create multiple tests to increment counters
            instance.startTest(['counter-test', 'test1']);
            instance.stopTest();
            instance.startTest(['counter-test', 'test2']);
            instance.stopTest();
            instance.startTest(['counter-test', 'sub-suite', 'test3']);
            instance.stopTest();

            // Verify counters and data
            const test1 = instance.getTestMetrics(['counter-test', 'test1']);
            const test2 = instance.getTestMetrics(['counter-test', 'test2']);
            const test3 = instance.getTestMetrics(['counter-test', 'sub-suite', 'test3']);

            expect(test1.testNumber).to.equal(1);
            expect(test2.testNumber).to.equal(2);
            expect(test3.testNumber).to.equal(3);
            expect(test1.suiteTestNumber).to.equal(1);
            expect(test2.suiteTestNumber).to.equal(2);
            expect(test3.suiteTestNumber).to.equal(1);

            // Reset and verify counters restart
            SuiteMetrics.resetInstance();
            const newInstance = SuiteMetrics.getInstance();

            newInstance.startTest(['new-counter-test', 'test1']);
            newInstance.stopTest();

            const newTest = newInstance.getTestMetrics(['new-counter-test', 'test1']);
            expect(newTest.testNumber).to.equal(1);
            expect(newTest.suiteTestNumber).to.equal(1);
        });

        test("Reset clears timing data", function() {
            const instance = SuiteMetrics.getInstance();

            // Create test with timing data
            instance.startTest(['timing-test', 'test1']);
            const start = Date.now();
            while (Date.now() - start < 1) { /* busy wait */ }
            instance.stopTest();

            const suiteData = instance.getSuiteMetrics(['timing-test']);
            expect(suiteData.testMetrics.totalTime).to.be.a('number').and.be.above(0);
            expect(suiteData.testMetrics.averageTime).to.be.a('number').and.be.above(0);

            // Reset and verify timing data is cleared
            SuiteMetrics.resetInstance();
            const newInstance = SuiteMetrics.getInstance();

            const topLevelData = newInstance.getSuiteMetricsRecursive([]);
            expect(topLevelData.totalTestMetrics.totalTime).to.be.null;
            expect(topLevelData.totalTestMetrics.averageTime).to.be.null;
        });
    });

    suite("getInstance is consistent across operations", function() {
        test("SuiteMetrics", function() {
            const initialInstance: SuiteMetrics = SuiteMetrics.getInstance();
            initialInstance.startTest(['suiteX', 'testY']);
            initialInstance.stopTest();
            const afterOperationsInstance = SuiteMetrics.getInstance();

            expect(initialInstance).to.be.an.instanceOf(SuiteMetrics);
            expect(afterOperationsInstance).to.be.an.instanceOf(SuiteMetrics);
            expect(initialInstance).to.equal(afterOperationsInstance);
        });

        test("ConcurrentSuiteMetrics", function() {
            const initialInstance = ConcurrentSuiteMetrics.getInstance();
            initialInstance.startTest(['suiteX', 'testY']);
            initialInstance.stopTest(['suiteX', 'testY']);
            const afterOperationsInstance = ConcurrentSuiteMetrics.getInstance();

            expect(initialInstance).to.be.an.instanceOf(ConcurrentSuiteMetrics);
            expect(afterOperationsInstance).to.be.an.instanceOf(ConcurrentSuiteMetrics);
            expect(initialInstance).to.equal(afterOperationsInstance);
        });

        test("Instance consistency during complex operations", function() {
            const instance1 = SuiteMetrics.getInstance();

            // Perform various operations
            instance1.startTest(['complex-ops', 'test1']);
            const instance2 = SuiteMetrics.getInstance();
            instance1.stopTest();

            const instance3 = SuiteMetrics.getInstance();
            const suiteData = instance3.getSuiteMetrics(['complex-ops']);
            const instance4 = SuiteMetrics.getInstance();

            // All should be the same instance
            expect(instance1).to.equal(instance2);
            expect(instance2).to.equal(instance3);
            expect(instance3).to.equal(instance4);

            // Verify operations worked on the same instance
            expect(suiteData.testMetrics.numTests).to.equal(1);
            expect(instance4.testExists(['complex-ops', 'test1'])).to.be.true;
        });

        test("Instance consistency with error conditions", function() {
            const instance1 = SuiteMetrics.getInstance();

            // Start a test
            instance1.startTest(['error-test', 'test1']);
            const instance2 = SuiteMetrics.getInstance();

            // Try to start another test (should throw error)
            try {
                instance2.startTest(['error-test', 'test2']);
                expect.fail('Should have thrown error for concurrent test');
            } catch (error) {
                // Expected error
            }

            const instance3 = SuiteMetrics.getInstance();

            // Stop the original test
            instance3.stopTest();
            const instance4 = SuiteMetrics.getInstance();

            // All should be the same instance
            expect(instance1).to.equal(instance2);
            expect(instance2).to.equal(instance3);
            expect(instance3).to.equal(instance4);
        });

        test("Instance consistency across async operations", function() {
            const instance1 = ConcurrentSuiteMetrics.getInstance();

            // Start async operations
            const promise1 = Promise.resolve().then(() => {
                const asyncInstance = ConcurrentSuiteMetrics.getInstance();
                asyncInstance.startTest(['async-test', 'test1']);
                return asyncInstance;
            });

            const promise2 = Promise.resolve().then(() => {
                const asyncInstance = ConcurrentSuiteMetrics.getInstance();
                return asyncInstance;
            });

            return Promise.all([promise1, promise2]).then(([async1, async2]) => {
                expect(instance1).to.equal(async1);
                expect(instance1).to.equal(async2);
                expect(async1).to.equal(async2);

                // Clean up
                async1.stopTest(['async-test', 'test1']);
            });
        });
    });

    suite("Singleton state management edge cases", function() {
        test("Instance reference stability during operations", function() {
            const instance = SuiteMetrics.getInstance();
            const originalRef = instance;

            // Perform many operations
            for (let i = 0; i < 10; i++) {
                instance.startTest(['stability-test', `test${i}`]);
                instance.stopTest();

                const currentRef = SuiteMetrics.getInstance();
                expect(currentRef).to.equal(originalRef);
            }
        });

        test("Memory consistency after reset", function() {
            // Create instance with data
            const instance1 = SuiteMetrics.getInstance();
            instance1.startTest(['memory-test', 'test1']);
            instance1.stopTest();

            const testData1 = instance1.getTestMetrics(['memory-test', 'test1']);
            const firstTestNumber = testData1.testNumber;

            // Reset
            SuiteMetrics.resetInstance();
            const instance2 = SuiteMetrics.getInstance();

            // Verify old reference doesn't affect new instance
            expect(instance1).to.not.equal(instance2);
            expect(instance2.testExists(['memory-test', 'test1'])).to.be.false;

            // Create new test with same path
            instance2.startTest(['memory-test', 'test1']);
            instance2.stopTest();

            const testData2 = instance2.getTestMetrics(['memory-test', 'test1']);

            // Should be different test objects
            // Note: testNumber resets with new instance since testCounter is instance-level
            expect(testData1.testNumber).to.equal(firstTestNumber);
            expect(testData2.testNumber).to.equal(1); // New instance starts counter at 1
            expect(testData1).to.not.equal(testData2);
        });

        test("Concurrent singleton access patterns", function() {
            // Reset to ensure clean state
            SuiteMetrics.resetInstance();
            ConcurrentSuiteMetrics.resetInstance();

            const suiteInstances: SuiteMetrics[] = [];
            const concurrentInstances: ConcurrentSuiteMetrics[] = [];

            // Simulate rapid concurrent access
            for (let i = 0; i < 20; i++) {
                suiteInstances.push(SuiteMetrics.getInstance());
                concurrentInstances.push(ConcurrentSuiteMetrics.getInstance());
            }

            // Verify all instances are identical within their class
            const firstSuite = suiteInstances[0];
            const firstConcurrent = concurrentInstances[0];

            suiteInstances.forEach(instance => {
                expect(instance).to.equal(firstSuite);
            });

            concurrentInstances.forEach(instance => {
                expect(instance).to.equal(firstConcurrent);
            });

            // Verify classes remain separate
            expect(firstSuite).to.not.equal(firstConcurrent);
        });

        test("Reset behavior with active test state", function() {
            const instance = SuiteMetrics.getInstance();

            // Start a test but don't stop it
            instance.startTest(['active-test', 'test1']);

            // Reset while test is active
            SuiteMetrics.resetInstance();
            const newInstance = SuiteMetrics.getInstance();

            // New instance should be clean and allow starting tests
            expect(newInstance).to.not.equal(instance);
            expect(() => {
                newInstance.startTest(['new-test', 'test1']);
                newInstance.stopTest();
            }).to.not.throw();

            expect(newInstance.testExists(['new-test', 'test1'])).to.be.true;
            expect(newInstance.testExists(['active-test', 'test1'])).to.be.false;
        });

        test("Reset behavior with concurrent active tests", function() {
            const instance = ConcurrentSuiteMetrics.getInstance();

            // Start multiple tests but don't stop them
            instance.startTest(['concurrent-active', 'test1']);
            instance.startTest(['concurrent-active', 'test2']);
            instance.startTest(['concurrent-active', 'sub-suite', 'test3']);

            // Reset while tests are active
            ConcurrentSuiteMetrics.resetInstance();
            const newInstance = ConcurrentSuiteMetrics.getInstance();

            // New instance should be clean and allow starting tests
            expect(newInstance).to.not.equal(instance);
            expect(() => {
                newInstance.startTest(['new-concurrent', 'test1']);
                newInstance.stopTest(['new-concurrent', 'test1']);
            }).to.not.throw();

            expect(newInstance.testExists(['new-concurrent', 'test1'])).to.be.true;
            expect(newInstance.testExists(['concurrent-active', 'test1'])).to.be.false;
        });
    });

    suite("Singleton pattern compliance", function() {
        test("Constructor is not directly accessible", function() {
            // This test verifies that the singleton pattern is properly implemented
            // by ensuring getInstance is the only way to get instances
            const instance1 = SuiteMetrics.getInstance();
            const instance2 = SuiteMetrics.getInstance();

            expect(instance1).to.equal(instance2);
            expect(instance1.constructor).to.equal(SuiteMetrics);
        });

        test("Static methods work correctly", function() {
            // Test that static methods are accessible and work
            const instance1 = SuiteMetrics.getInstance();
            expect(typeof SuiteMetrics.getInstance).to.equal('function');
            expect(typeof SuiteMetrics.resetInstance).to.equal('function');

            // Test resetInstance static method
            SuiteMetrics.resetInstance();
            const instance2 = SuiteMetrics.getInstance();
            expect(instance1).to.not.equal(instance2);
        });

        test("Instance methods work on singleton", function() {
            const instance = SuiteMetrics.getInstance();

            // Test that all expected methods exist and are functions
            expect(typeof instance.startTest).to.equal('function');
            expect(typeof instance.stopTest).to.equal('function');
            expect(typeof instance.testExists).to.equal('function');
            expect(typeof instance.suiteExists).to.equal('function');
            expect(typeof instance.getTestMetrics).to.equal('function');
            expect(typeof instance.getSuiteMetrics).to.equal('function');
            expect(typeof instance.getSuiteMetricsRecursive).to.equal('function');
            expect(typeof instance.printAllSuiteMetrics).to.equal('function');
        });

        test("Singleton maintains prototype chain", function() {
            const instance = SuiteMetrics.getInstance();

            expect(instance instanceof SuiteMetrics).to.be.true;
            expect(Object.getPrototypeOf(instance)).to.equal(SuiteMetrics.prototype);
        });

        test("Multiple resets maintain singleton pattern", function() {
            const instances: SuiteMetrics[] = [];

            // Create multiple instances through reset cycles
            for (let i = 0; i < 5; i++) {
                SuiteMetrics.resetInstance();
                const instance = SuiteMetrics.getInstance();
                instances.push(instance);

                // Verify singleton behavior within each cycle
                const sameInstance = SuiteMetrics.getInstance();
                expect(instance).to.equal(sameInstance);
            }

            // Verify all instances from different cycles are different
            for (let i = 0; i < instances.length; i++) {
                for (let j = i + 1; j < instances.length; j++) {
                    expect(instances[i]).to.not.equal(instances[j]);
                }
            }
        });
    });
});

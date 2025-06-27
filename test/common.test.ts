import { expect } from 'chai';
import SuiteMetrics, { ConcurrentSuiteMetrics, RecursiveSuiteData, SuiteData } from "../src/index.ts";

suite("Base class tests", function() {

    let metrics: SuiteMetrics;
    let concurrentMetrics: ConcurrentSuiteMetrics;

    setup(function() {
        metrics = new SuiteMetrics();
        concurrentMetrics = new ConcurrentSuiteMetrics();
    });

    suite("Singleton Pattern", function() {
        suite("getInstance returns same instance", function() {
            test("SuiteMetrics", function() {
                const instance1: SuiteMetrics = SuiteMetrics.getInstance();
                const instance2: SuiteMetrics = SuiteMetrics.getInstance();

                expect(instance1).to.equal(instance2);
                expect(instance1).to.be.an.instanceOf(SuiteMetrics)
            });

            test("ConcurrentSuiteMetrics", function() {
                const instance1: ConcurrentSuiteMetrics = ConcurrentSuiteMetrics.getInstance();
                const instance2: ConcurrentSuiteMetrics = ConcurrentSuiteMetrics.getInstance();

                expect(instance1).to.equal(instance2);
                expect(instance1).to.be.an.instanceOf(ConcurrentSuiteMetrics);
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
        });

        suite("resetInstance multiple times", function() {
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
        });
    });
});

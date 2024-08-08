import { expect } from 'chai';
import SuiteMetrics from "../src/index.ts";

suite("Basic test suite", () => {
    test("start test", () => {
        const metrics = new SuiteMetrics();
        metrics.startTest(["Basic test suite", "start test"]);
        expect(true).to.equal(true);
        metrics.stopTest();
    });
});

import { expect } from 'chai';
import SuiteMetrics from "../src/index.ts";

suite("Basic test suite", () => {
    test("start test", () => {
        SuiteMetrics.startTest(["Basic test suite", "start test"]);
        expect(true).to.equal(true);
        SuiteMetrics.stopTest();
    });
});

import { expect } from 'chai';
import SuiteMetrics from "../src/index.ts";
import ConcurrentSuiteMetrics from "../src/ConcurrentSuiteMetrics.ts";

suite("Base class tests", function() {

    let metrics: SuiteMetrics;
    let concurrentMetrics: ConcurrentSuiteMetrics;

    setup(function() {
        metrics = new SuiteMetrics();
        concurrentMetrics = new ConcurrentSuiteMetrics();
    });

    suite("", function() {

    });

    suite("", function() {

    });

    suite("", function() {

    });
});

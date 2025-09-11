import Suites from "../helpers/Suites.ts";
import { Suite, Test } from "../types/structures.ts";
import { SuiteData, SuiteTestMetrics } from "../types/returnTypes.ts";

/**
 * Methods for calculating overall test metrics
 */
class Metrics {

    // Ref to suites instance with all this metrics' data
    private readonly suites: Suites;

    public constructor(suites: Suites) {
        this.suites = suites;
    }

    /**
     * Gets the total number of completed tests across all suites
     *
     * @returns The total number of completed tests in this metrics instance
     */
    public getTotalTestCount(): number {
        return this.suites.getNumTests();
    }

    /**
     * Gets the average completion duration (microseconds) for all tests in this metrics instance
     *
     * @returns The average test completion duration, rounded to the nearest microsecond
     * @throws Error If there are no completed tests in this instance
     */
    public getAverageTestDuration(): number {
        if (this.getTotalTestCount() === 0) {
            throw new Error(`There are no completed tests in this instance`);
        }

        return this.suites.getAverageTestDuration();
    }

    /**
     * Gets the median duration of all tests in this instance
     *
     * @returns The median test completion duration, in microseconds. May be a decimal (x.5) when an even number of
     *          tests are present
     * @throws Error If there are no completed tests in this instance
     */
    public getMedianTestDuration(): number {
        if (this.getTotalTestCount() === 0) {
            throw new Error(`There are no completed tests in this instance`);
        }

        const sortedTests: Test[] = this.suites.getAllTestsSlowestFirst();
        const mid: number = Math.floor(sortedTests.length / 2);

        if (sortedTests.length % 2 === 1) {
            return sortedTests[mid].duration; // Odd length -> middle element is the median
        }

        // Even length: median is the average of the two middle elements
        return (sortedTests[mid - 1].duration + sortedTests[mid].duration) / 2;
    }

    /**
     * Gets metrics for a given suite and its sub-suites
     *
     * @param path Path to the desired suite for, e.g. ['suite 1', 'sub-suite 2']. Top-level suite ([]) allowed
     * @returns An object with suite metadata, and metrics for direct & subtests
     */
    public getSuiteMetrics(path: readonly string[]): SuiteData {
        const suite: Suite = this.suites.navigateToSuite(path);

        // Direct metrics: Test and duration data for just the tests directly in this suite
        const directTests: number = suite.tests.size;
        const directTime: number = Array.from(suite.tests.values()).reduce((sum: number, test: Test): number => sum + test.duration, 0);
        const averageDirectTime: number = directTests === 0 ? 0 : directTime / directTests;
        const directMetrics: SuiteTestMetrics = {
            numTests: directTests,
            totalTime: directTime,
            averageTime: averageDirectTime
        };

        // Total metrics: Test and duration data for all tests in this suite and all sub-suites
        const totalTests: number = suite.aggregateData.numTests;
        const totalTime: number = suite.aggregateData.totalTestTime;
        const averageTotalTime: number = totalTests === 0 ? 0 : totalTime / totalTests;
        const totalMetrics: SuiteTestMetrics = {
            numTests: totalTests,
            totalTime: totalTime,
            averageTime: averageTotalTime
        };

        // Sub metrics: Test and duration data for all tests in all sub-suites (but not this suite directly)
        const subTests: number = totalTests - directTests;
        const subTime: number = totalTime - directTime;
        const averageSubTime: number = subTests === 0 ? 0 : subTime / subTests;
        const subMetrics: SuiteTestMetrics = {
            numTests: subTests,
            totalTime: subTime,
            averageTime: averageSubTime
        };

        return {
            name: suite.name,
            parentSuites: path.slice(0, -1),
            subSuites: Array.from(suite.subSuites.keys()),

            directTestMetrics: directMetrics,
            subTestMetrics: subMetrics,
            totalTestMetrics: totalMetrics
        };
    }

    /**
     * Returns a formatted string with all suite's data regarding tests
     *
     * @param topLevelSuite Include a top-level suite with all suite data summed up at the top (default: true)
     * @returns Formatted string (warning: may be very long for large contexts)
     */
    public printAllSuiteMetrics(topLevelSuite: boolean = true): string {
        const lines: string[] = [];

        if (topLevelSuite) {
            this.formatSuiteForPrint(this.suites.getTopLevelSuite(), lines, 0);
        } else {
            for (const suite of this.suites.getTopLevelSuite().subSuites.values()) {
                this.formatSuiteForPrint(suite, lines, 0);
            }
        }

        return lines.join('\n');
    }


    /**
     * Formats suite information for printing
     *
     * @param suite Suite object to get information for
     * @param lines Current array of lines (pass [] on initial call)
     * @param indentLevel Number of indents for each level of information separation
     */
    private formatSuiteForPrint(suite: Suite, lines: string[], indentLevel: number): void {
        const indent: string = ' '.repeat(indentLevel);
        const directTestCount: number = suite.tests.size;
        const directTestDuration: number = Array.from(suite.tests.values())
            .reduce((sum: number, test: Test): number => sum + test.duration, 0);

        const directDuration: number = directTestDuration / 1000;
        const subDuration: number = suite.aggregateData.totalTestTime / 1000;

        lines.push(`${indent}Suite: ${suite.name}`);
        lines.push(`${indent}  Summary:`);
        lines.push(`${indent}    Direct tests:`);
        lines.push(`${indent}    - Total: ${directTestCount}`);
        lines.push(`${indent}    - Total duration: ${directDuration.toFixed(3)} ms`);
        lines.push(`${indent}    Sub-suites (recursive):`);
        lines.push(`${indent}    - Total tests: ${suite.aggregateData.numTests - directTestCount}`);
        lines.push(`${indent}    - Total duration: ${(subDuration - directDuration).toFixed(3)} ms`);

        if (suite.tests && suite.tests.size > 0) {
            lines.push(`\n${indent}  Tests:`);
            let testNumber: number = 1;
            for (const test of suite.tests.values()) {
                lines.push(`${indent}    ${testNumber++}) '${test.name}': ${(test.duration / 1000).toFixed(2)} ms`);
            }
        }

        if (suite.subSuites && suite.subSuites.size > 0) {
            lines.push(`\n${indent}  Sub-Suites:`);
            for (const subSuite of suite.subSuites.values()) {
                this.formatSuiteForPrint(subSuite, lines, indentLevel + 4);
            }
        }
    }
}

export default Metrics;

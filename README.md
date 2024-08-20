# suite-metrics

[![npm](https://img.shields.io/npm/v/suite-metrics)](https://www.npmjs.com/package/suite-metrics)
[![npm](https://img.shields.io/npm/dt/suite-metrics)](https://www.npmjs.com/package/suite-metrics)
[![npm](https://img.shields.io/npm/l/suite-metrics)](https://www.npmjs.com/package/suite-metrics)

Easily keep track of metrics for many nested test suites

Features:
- **Precision Tracking**: Measure test execution time down to microseconds
- **Flexible Nesting**: Organize tests in any number of nested suites with any structure
- **Comprehensive Metrics**: Collect data for top-level suites, sub-suites, and individual tests
- **Simple Interface**: Easily integrate into your testing workflow with only a few lines of code
- **Mocha integration**: Use 'this' in place of test/suite names in Mocha

[comment]: <> (**Concurrency Support**: Allows for tracking of multiple concurrent tests)

## 📦 Installation

```bash
npm i suite-metrics -D

# or
pnpm i suite-metrics -D

# or
yarn add suite-metrics -D
```

## 🚀 Usage

### Setup

```typescript
import SuiteMetrics from 'suite-metrics';

// Use as a singleton for easy access across multiple files
const metrics = SuiteMetrics.getInstance();

// Alternatively, create a new instance for isolated metrics
const metrics = new SuiteMetrics();

// Reset the singleton instance to clear data (not required for new instances)
SuiteMetrics.resetInstance();
```

### Tracking Tests

```typescript
// Start tracking a test (directly before test logic for best accuracy)
metrics.startTest(["Suite Name", "Sub-suite name", "Test Name"]);

// Execute your test logic here...

// Call directly after test logic completes to stop tracking
metrics.endTest();
```

### Getting Metrics

```typescript
// Simple summary of all suites and tests - # test/suites, total/avg time
console.log(metrics.printAllSuiteMetrics());

// Detailed metrics for a specific test
metrics.getTestMetrics(["Suite Name", "Test Name"]);

// Detailed metrics for a specific suite and its direct tests
metrics.getSuiteMetrics(["Suite Name"]);

// Detailed metrics for a specific suite and all sub-suites & sub-tests
metrics.getSuiteMetricsRecursive(["Suite Name"]);

// Helpers
if (metrics.suiteExists(["Suite Name"])) {
    // ...
}

if (metrics.testExists(["Suite Name", "Test Name"])) {
    // ...
}
```

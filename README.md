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

If you do not need concurrent tracking, use SuiteMetrics:

```typescript
import SuiteMetrics, { ConcurrentSuiteMetrics } from 'suite-metrics';

// Use as a lazy singleton for easy access across multiple files
const metricsSingleton = SuiteMetrics.getInstance();

// Alternatively, create a new instance for isolated metrics
const metrics = new SuiteMetrics();
```

For running concurrent tests, ConcurrentSuiteMetrics is required:

```typescript
import { ConcurrentSuiteMetrics } from 'suite-metrics';

const concurrentSingleton = ConcurrentSuiteMetrics.getInstance();
// or
const concurrentMetrics = new ConcurrentSuiteMetrics();
```

### Tracking Tests

```typescript
// Start tracking a test (directly before test logic for best accuracy)
metrics.startTest(["Suite Name", "Sub-suite name", "Test Name"]);

// Execute your test logic here...

// Call directly after test logic completes to stop tracking
metrics.stopTest();
```

```typescript
await concurrentMetrics.startTest(["Suite Name", "Test Name 1"]);
// Start a promise...
await concurrentMetrics.startTest(["Suite Name", "Test Name 2"]);

await concurrentMetrics.startTest(["Suite Name", "Test Name 3"]);

concurrentMetrics.stopTest();
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

## ⏱️ Time complexity

This package uses lazy loading and caching to make as many calls as possible `O(1)`

Non-constant operations:

- `ConcurrentSuiteMetrics` methods use locks for its methods, making it `O(k)` where `k` is the number of waiting 
  operations. This is process is quite fast, though, 100 concurrent tests starting or stopping should take a few 
  milliseconds max
- Getting or adding Suites/Tests is `O(k)` where `k` is the depth of the Suite/Test. This is minimal in most cases
- Any operation that involves returning `k` Suites or Tests is `O(k)` as these values require a deep copy to prevent 
  leaking references
- Methods in `performance` require a cache rebuild (`O(n * log(n))`) when called after test(s) are added. Otherwise, 
  it is `O(k)` where `k` is the number of tests to return
- Methods in `statistics` (except `interpretZScore()`) require a standard deviation cache rebuild (`O(n)`) when called 
  after test(s) are added. Otherwise, it is `O(1)` (or `O(n)` for `getAllTestsWithZScores`)
- `toJSON()` and `printAllSuiteMetrics()` are `O(n)`

Overall, the performance overhead is very minimal in most cases. However, there are some cases to avoid:

- Run all tests first, then get metrics. This ensures cached expensive operations only need to be run once, 
  independent of the number of tests or metric calls (run 100k tests, thousands of performance calls -> only one sort 
  required)
- Don't use excessively deep suites. Anything you manually create should be fine, but avoid 100s/1000s of generated 
  suites in a deep chain. Thousands of shallow tests or suites is a relatively flat structure is fine though
- Avoid repeated calls to methods that return large amounts of tests (100,000+)

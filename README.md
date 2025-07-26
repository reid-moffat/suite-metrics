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
- **Concurrency Support**: Allows for tracking of multiple concurrent tests

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

const concurrentSingleton = await ConcurrentSuiteMetrics.getInstance();
// or
const concurrentMetrics = new ConcurrentSuiteMetrics();
```

*Note: ConcurrentSuiteMetrics does work fine for sequential tests; however, it requires async calls, a parameter for 
stopTest(), and a bit more overhead with the mutex locks. It is recommended to only use it when required for simplicity*

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

## ⏱️ Performance & Time Complexity

### Overview
This package uses **lazy loading** and **caching** to optimize performance, making most operations `O(1)` constant time.

### Non-Constant Operations

| Operation | Complexity | Notes                                                                                         |
|-----------|------------|-----------------------------------------------------------------------------------------------|
| **ConcurrentSuiteMetrics methods** | `O(k)` | `k` = number of waiting operations. Very fast in practice (~few ms for 100 concurrent tests)  |
| **Getting/Adding Suites/Tests** | `O(k)` | `k` = depth of Suite/Test in hierarchy. Minimal for typical use cases                         |
| **Returning multiple Suites/Tests** | `O(k)` | `k` = number of items returned. Requires a deep copy to prevent reference leaks               |
| **Performance methods** | `O(n log n)` → `O(k)` | Cache rebuild when tests added, then `O(k)` for subsequent calls (returning `k` Tests)        |
| **Statistics methods** | `O(n)` → `O(1)` | Cache rebuild when tests added, then constant time (except `getAllTestsWithZScores` which is `O(n)`) |
| **JSON export & printing** | `O(n)` | `toJSON()` and `printAllSuiteMetrics()` require a full traverse                               |

> **Note**: `interpretZScore()` is always `O(1)` and doesn't require cache rebuilds.

### ⚡ Performance Best Practices

- **Test execution**: Run all tests before gathering metrics to ensure cache rebuilds only run once
- **Suite depth**: Keep suite hierarchies reasonable (avoid 100s of deeply nested suites)
- **Bulk operations**: Minimize repeated calls to methods returning large datasets (10,000+ tests)

### Real-World Performance
In typical scenarios, performance overhead is **negligible** due to efficient caching. For large cases (~10,000+ tests),
following the recommended patterns above to reduce overhead.

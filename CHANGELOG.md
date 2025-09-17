# suite-metrics

## 2.2.0

### Minor Changes

ca5a90d:
* Added metrics.getStructureMetadata() to provide high-level aggregate data about your tests as whole.
* Return 0 for average and median test duration when no tests are present rather than throwing an error
* Testing and minor documentation improvements

## 2.1.2

### Patch Changes

- 10b1072: Optimized sorting tests by time (merge into existing sorted tests). Froze arrays of tests to prevent external array
  mutations. Fixed documentation issues in README/API. Internal refactoring for clarity.

## 2.1.1

### Patch Changes

- ad03bd0: Improved caching for performance metrics (no re-build for fastest tests). Minor wording, documentation, testing, and
  refactoring updates

## 2.1.0

### Minor Changes

ae722d4:

Main update:

- Fully freeze all suite and test data with Immer, preventing all state-breaking external updates
- Removed unnecessary Suite copying (immutable), significantly improving query performance
- Made suite aggregateData fields readonly

Minor additions:

- Slight start time accuracy improvement
- Clarified paths are readonly as parameters
- Clarified Test start & end times are relative to epoch
- Added path to Suite object
- Method documentation improvements
- Minor error message clarity improvements
- Minor refactoring for clarity and efficiency
- Fixed CI/CD testing gaps

## 2.0.2

### Patch Changes

- 577d28b: Froze test objects to prevent copying overhead for large queries

## 2.0.1

### Patch Changes

- f5621f0: Cached partial statistic values, optimizing standard deviation calculations after new tests are added (e.g. adding 10 tests to 100,000 tests with a calculated standard deviation only requires looping thrugh the 10 aded tests, not all 100,010)

## 2.0.0

### Major Changes

- a4935a9: Major update! 🎉

* Significantly improved existing functionality, breaking existing contracts
* Added a thread-safe ConcurrentSuiteMetrics class for running multiple tests at once
* Added helpers to get more test metrics, statistics, querying, and performance
* Fixed many bugs with extensive testing

## 1.3.1

### Patch Changes

- 9574848: Removed buggy Mocha context validation. Can be done relatively easily with a helper method if desired.

## 1.3.0

### Minor Changes

- 56905e5:

* Added option to reset Metrics singleton
* Added getNameFromMocha to easily get the test path format from a Mocha test
* Allow passing Mocha contexts to methods in place of literal name arrays

## 1.2.0

### Minor Changes

- f611f21: Fixed singleton bug (should be static). Added method to get metrics for a specific test. Improved printed metrics formatting + data.

## 1.1.0

### Minor Changes

- 881c02b: Added optional singleton for ease of use. Added number of sub-suite tests in printing metrics, and added a README with instructions

## 1.0.0

### Major Changes

- 150d03b: First release. Added suite metrics main class with options ot start & stop testing, check test/suite exists, getting suite metrics and printing metrics

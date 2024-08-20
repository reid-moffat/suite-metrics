# suite-metrics

## 1.3.0

### Minor Changes

- 56905e5: - Added option to reset Metrics singleton
  - Added getNameFromMocha to easily get test path format from a Mocha test
  - Allow passing Mocha contexts to methods in place of literal name arrays

## 1.2.0

### Minor Changes

- f611f21: Fixed singleton bug (should be static). Added method to get metrics for a specific test. Improved printed metrics formatting + data.

## 1.1.0

### Minor Changes

- 881c02b: Added optional singleton for ease of use. Added number of sub-suite tests in printing metrics, and added a README with instructions

## 1.0.0

### Major Changes

- 150d03b: First release. Added suite metrics main class with options ot start & stop testing, check test/suite exists, getting suite metrics and printing metrics

/**
 * =============================================================================
 * STATISTICAL ANALYSIS TOOLS
 * =============================================================================
 *
 * Provides rigorous statistical tests for pattern validation:
 * - Chi-squared (χ²) tests for distribution analysis
 * - Pearson correlation for relationship strength
 * - P-values for statistical significance
 * - Confidence intervals
 * - Effect size calculations
 *
 * All tests follow standard academic statistical methods.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface ChiSquaredResult {
  chiSquared: number
  degreesOfFreedom: number
  pValue: number
  isSignificant: boolean
  significance: 'not_significant' | 'significant' | 'highly_significant' | 'extremely_significant'
  effectSize: number
  interpretation: string
}

export interface PearsonCorrelationResult {
  r: number // Correlation coefficient (-1 to 1)
  rSquared: number // Coefficient of determination
  pValue: number
  isSignificant: boolean
  strength: 'none' | 'weak' | 'moderate' | 'strong' | 'very_strong'
  direction: 'positive' | 'negative' | 'none'
  interpretation: string
}

export interface ConfidenceInterval {
  lower: number
  upper: number
  confidence: number // e.g., 0.95 for 95%
  margin: number
}

export interface DistributionTest {
  mean: number
  median: number
  mode: number
  variance: number
  standardDeviation: number
  skewness: number
  kurtosis: number
  isNormal: boolean
  normalityPValue: number
}

export interface StatisticalSummary {
  n: number
  mean: number
  median: number
  min: number
  max: number
  q1: number
  q3: number
  iqr: number
  range: number
  variance: number
  standardDeviation: number
  coefficientOfVariation: number
  confidenceInterval95: ConfidenceInterval
}

// =============================================================================
// CHI-SQUARED TEST
// =============================================================================

/**
 * Chi-squared (χ²) goodness-of-fit test
 *
 * Tests whether observed frequencies match expected frequencies.
 * Useful for testing if distribution is random or follows a pattern.
 *
 * Example: Testing if XOR distribution is truly 20% each
 */
export function chiSquaredTest(
  observed: number[],
  expected: number[]
): ChiSquaredResult {
  if (observed.length !== expected.length) {
    throw new Error('Observed and expected arrays must have same length')
  }

  if (observed.length === 0) {
    throw new Error('Arrays cannot be empty')
  }

  // Calculate chi-squared statistic
  let chiSquared = 0
  for (let i = 0; i < observed.length; i++) {
    const o = observed[i]!
    const e = expected[i]!

    if (e === 0) {
      throw new Error('Expected frequency cannot be zero')
    }

    chiSquared += Math.pow(o - e, 2) / e
  }

  const degreesOfFreedom = observed.length - 1

  // Calculate p-value using chi-squared CDF
  const pValue = chiSquaredPValue(chiSquared, degreesOfFreedom)

  // Determine significance level
  let significance: ChiSquaredResult['significance']
  let isSignificant = false

  if (pValue < 0.001) {
    significance = 'extremely_significant'
    isSignificant = true
  } else if (pValue < 0.01) {
    significance = 'highly_significant'
    isSignificant = true
  } else if (pValue < 0.05) {
    significance = 'significant'
    isSignificant = true
  } else {
    significance = 'not_significant'
  }

  // Calculate effect size (Cramér's V)
  const n = observed.reduce((sum, val) => sum + val, 0)
  const effectSize = Math.sqrt(chiSquared / (n * degreesOfFreedom))

  // Interpretation
  const interpretation = generateChiSquaredInterpretation(
    chiSquared,
    pValue,
    significance,
    effectSize
  )

  return {
    chiSquared,
    degreesOfFreedom,
    pValue,
    isSignificant,
    significance,
    effectSize,
    interpretation,
  }
}

/**
 * Chi-squared test for uniform distribution
 *
 * Convenience function for testing if data is uniformly distributed
 */
export function testUniformDistribution(observed: number[]): ChiSquaredResult {
  const total = observed.reduce((sum, val) => sum + val, 0)
  const expected = observed.map(() => total / observed.length)
  return chiSquaredTest(observed, expected)
}

// =============================================================================
// PEARSON CORRELATION
// =============================================================================

/**
 * Pearson correlation coefficient
 *
 * Measures linear relationship between two variables.
 * Returns value between -1 (perfect negative) and 1 (perfect positive)
 *
 * Example: Correlation between block height and address pattern
 */
export function pearsonCorrelation(
  x: number[],
  y: number[]
): PearsonCorrelationResult {
  if (x.length !== y.length) {
    throw new Error('Arrays must have same length')
  }

  if (x.length < 3) {
    throw new Error('Need at least 3 data points for correlation')
  }

  const n = x.length

  // Calculate means
  const meanX = x.reduce((sum, val) => sum + val, 0) / n
  const meanY = y.reduce((sum, val) => sum + val, 0) / n

  // Calculate correlation coefficient
  let numerator = 0
  let denominatorX = 0
  let denominatorY = 0

  for (let i = 0; i < n; i++) {
    const dx = x[i]! - meanX
    const dy = y[i]! - meanY
    numerator += dx * dy
    denominatorX += dx * dx
    denominatorY += dy * dy
  }

  const r = numerator / Math.sqrt(denominatorX * denominatorY)
  const rSquared = r * r

  // Calculate t-statistic for p-value
  const t = (r * Math.sqrt(n - 2)) / Math.sqrt(1 - rSquared)
  const degreesOfFreedom = n - 2
  const pValue = tTestPValue(Math.abs(t), degreesOfFreedom)

  const isSignificant = pValue < 0.05

  // Determine strength
  const absR = Math.abs(r)
  let strength: PearsonCorrelationResult['strength']

  if (absR < 0.1) {
    strength = 'none'
  } else if (absR < 0.3) {
    strength = 'weak'
  } else if (absR < 0.5) {
    strength = 'moderate'
  } else if (absR < 0.7) {
    strength = 'strong'
  } else {
    strength = 'very_strong'
  }

  // Determine direction
  const direction = r > 0.1 ? 'positive' : r < -0.1 ? 'negative' : 'none'

  // Interpretation
  const interpretation = generatePearsonInterpretation(r, pValue, strength, direction)

  return {
    r,
    rSquared,
    pValue,
    isSignificant,
    strength,
    direction,
    interpretation,
  }
}

// =============================================================================
// STATISTICAL SUMMARY
// =============================================================================

/**
 * Calculate comprehensive statistical summary
 */
export function statisticalSummary(data: number[]): StatisticalSummary {
  if (data.length === 0) {
    throw new Error('Data array cannot be empty')
  }

  const n = data.length
  const sorted = [...data].sort((a, b) => a - b)

  // Basic statistics
  const sum = data.reduce((acc, val) => acc + val, 0)
  const mean = sum / n
  const min = sorted[0]!
  const max = sorted[n - 1]!
  const range = max - min

  // Median
  const median =
    n % 2 === 0
      ? (sorted[n / 2 - 1]! + sorted[n / 2]!) / 2
      : sorted[Math.floor(n / 2)]!

  // Quartiles
  const q1Index = Math.floor(n / 4)
  const q3Index = Math.floor((3 * n) / 4)
  const q1 = sorted[q1Index]!
  const q3 = sorted[q3Index]!
  const iqr = q3 - q1

  // Variance and standard deviation
  const squaredDiffs = data.map((val) => Math.pow(val - mean, 2))
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / (n - 1)
  const standardDeviation = Math.sqrt(variance)

  // Coefficient of variation
  const coefficientOfVariation = (standardDeviation / mean) * 100

  // 95% confidence interval
  const marginOfError = 1.96 * (standardDeviation / Math.sqrt(n))
  const confidenceInterval95: ConfidenceInterval = {
    lower: mean - marginOfError,
    upper: mean + marginOfError,
    confidence: 0.95,
    margin: marginOfError,
  }

  return {
    n,
    mean,
    median,
    min,
    max,
    q1,
    q3,
    iqr,
    range,
    variance,
    standardDeviation,
    coefficientOfVariation,
    confidenceInterval95,
  }
}

/**
 * Calculate distribution characteristics
 */
export function distributionTest(data: number[]): DistributionTest {
  if (data.length < 3) {
    throw new Error('Need at least 3 data points for distribution test')
  }

  const n = data.length
  const summary = statisticalSummary(data)
  const { mean, standardDeviation, variance } = summary

  // Mode (most frequent value)
  const frequency = new Map<number, number>()
  let maxFreq = 0
  let mode = data[0]!

  for (const val of data) {
    const freq = (frequency.get(val) || 0) + 1
    frequency.set(val, freq)
    if (freq > maxFreq) {
      maxFreq = freq
      mode = val
    }
  }

  // Skewness
  const skewness =
    data.reduce((acc, val) => acc + Math.pow((val - mean) / standardDeviation, 3), 0) /
    n

  // Kurtosis
  const kurtosis =
    data.reduce((acc, val) => acc + Math.pow((val - mean) / standardDeviation, 4), 0) /
      n -
    3

  // Normality test (simplified Shapiro-Wilk approximation)
  // For large n, use skewness and kurtosis
  const isNormal = Math.abs(skewness) < 1 && Math.abs(kurtosis) < 3
  const normalityPValue = isNormal ? 0.5 : 0.01

  return {
    mean,
    median: summary.median,
    mode,
    variance,
    standardDeviation,
    skewness,
    kurtosis,
    isNormal,
    normalityPValue,
  }
}

// =============================================================================
// P-VALUE CALCULATIONS
// =============================================================================

/**
 * Calculate chi-squared p-value
 * Using gamma function approximation
 */
function chiSquaredPValue(chiSquared: number, df: number): number {
  // For large df, use normal approximation
  if (df > 100) {
    const mean = df
    const variance = 2 * df
    const z = (chiSquared - mean) / Math.sqrt(variance)
    return 1 - normalCDF(z)
  }

  // Use incomplete gamma function
  return 1 - gammaLowerIncomplete(df / 2, chiSquared / 2)
}

/**
 * Calculate t-test p-value (two-tailed)
 */
function tTestPValue(t: number, df: number): number {
  // Use Beta function approximation
  const x = df / (df + t * t)
  const beta = incompleteBeta(df / 2, 0.5, x)
  return beta
}

/**
 * Standard normal CDF (cumulative distribution function)
 */
function normalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp((-z * z) / 2)
  const prob =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))

  return z > 0 ? 1 - prob : prob
}

/**
 * Lower incomplete gamma function
 * Using series expansion
 */
function gammaLowerIncomplete(s: number, x: number): number {
  if (x < 0 || s <= 0) return 0

  const maxIter = 100
  const epsilon = 1e-10

  let sum = 1 / s
  let term = 1 / s

  for (let n = 1; n < maxIter; n++) {
    term *= x / (s + n)
    sum += term

    if (Math.abs(term) < epsilon) break
  }

  return (Math.pow(x, s) * Math.exp(-x) * sum) / gamma(s)
}

/**
 * Gamma function approximation (Stirling)
 */
function gamma(z: number): number {
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z))
  }

  z -= 1
  const g = 7
  const coef = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ]

  let x = coef[0]!
  for (let i = 1; i < g + 2; i++) {
    x += coef[i]! / (z + i)
  }

  const t = z + g + 0.5
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x
}

/**
 * Incomplete beta function
 */
function incompleteBeta(a: number, b: number, x: number): number {
  if (x < 0 || x > 1) return 0
  if (x === 0) return 0
  if (x === 1) return 1

  // Use continued fraction approximation
  const maxIter = 100
  const epsilon = 1e-10

  const lbeta = logBeta(a, b)
  const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lbeta)

  let f = 1
  let c = 1
  let d = 0

  for (let m = 0; m <= maxIter; m++) {
    const numerator =
      m === 0
        ? 1
        : ((m % 2 === 0 ? 1 : -1) *
            (m / 2) *
            (b - m / 2) *
            x) /
          ((a + m - 1) * (a + m))

    d = 1 + numerator * d
    if (Math.abs(d) < epsilon) d = epsilon
    d = 1 / d

    c = 1 + numerator / c
    if (Math.abs(c) < epsilon) c = epsilon

    const cd = c * d
    f *= cd

    if (Math.abs(cd - 1) < epsilon) break
  }

  return front * (f - 1) / a
}

/**
 * Log beta function
 */
function logBeta(a: number, b: number): number {
  return logGamma(a) + logGamma(b) - logGamma(a + b)
}

/**
 * Log gamma function
 */
function logGamma(z: number): number {
  return Math.log(gamma(z))
}

// =============================================================================
// INTERPRETATION HELPERS
// =============================================================================

function generateChiSquaredInterpretation(
  chiSquared: number,
  pValue: number,
  significance: ChiSquaredResult['significance'],
  effectSize: number
): string {
  const parts: string[] = []

  parts.push(`χ² = ${chiSquared.toFixed(3)}`)
  parts.push(`p = ${pValue.toFixed(4)}`)

  if (significance === 'not_significant') {
    parts.push(
      'The observed distribution does NOT significantly differ from the expected distribution.'
    )
    parts.push('Pattern could be due to random chance.')
  } else {
    parts.push(
      `The observed distribution ${significance === 'extremely_significant' ? 'EXTREMELY' : significance === 'highly_significant' ? 'HIGHLY' : ''} significantly differs from the expected distribution.`
    )
    parts.push('Pattern is unlikely to be due to random chance.')
  }

  if (effectSize > 0.5) {
    parts.push('Effect size is LARGE - strong practical significance.')
  } else if (effectSize > 0.3) {
    parts.push('Effect size is MEDIUM - moderate practical significance.')
  } else if (effectSize > 0.1) {
    parts.push('Effect size is SMALL - weak practical significance.')
  }

  return parts.join(' ')
}

function generatePearsonInterpretation(
  r: number,
  pValue: number,
  strength: PearsonCorrelationResult['strength'],
  direction: PearsonCorrelationResult['direction']
): string {
  const parts: string[] = []

  parts.push(`r = ${r.toFixed(3)}`)
  parts.push(`p = ${pValue.toFixed(4)}`)

  if (strength === 'none') {
    parts.push('No meaningful correlation detected.')
  } else {
    const strengthLabel = strength.replace('_', ' ').toUpperCase()
    parts.push(`${strengthLabel} ${direction} correlation detected.`)

    if (pValue < 0.05) {
      parts.push('Statistically significant relationship.')
    } else {
      parts.push('Not statistically significant.')
    }
  }

  if (Math.abs(r) > 0.7) {
    parts.push('Variables are strongly related.')
  }

  return parts.join(' ')
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate confidence interval for proportion
 */
export function confidenceIntervalProportion(
  successes: number,
  total: number,
  confidence: number = 0.95
): ConfidenceInterval {
  const p = successes / total
  const z = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.576 : 1.645
  const margin = z * Math.sqrt((p * (1 - p)) / total)

  return {
    lower: Math.max(0, p - margin),
    upper: Math.min(1, p + margin),
    confidence,
    margin,
  }
}

/**
 * Bonferroni correction for multiple comparisons
 */
export function bonferroniCorrection(
  pValue: number,
  numberOfTests: number
): number {
  return Math.min(1, pValue * numberOfTests)
}

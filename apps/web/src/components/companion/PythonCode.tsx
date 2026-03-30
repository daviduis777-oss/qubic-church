import { useMemo, type CSSProperties } from 'react'

// PDF-matching token palette (Anna Matrix Companion style)
const COLORS = {
  keyword: '#ec4899', // magenta — import, def, return, for, if, as, in, etc.
  boolean: '#10B981', // green — True, False, None
  builtin: '#22d3ee', // cyan — print, len, range, sum, tuple, abs, set, sorted, ...
  func: '#7dd3fc', // light cyan — user-defined function names
  module: '#5eead4', // teal — imported module names (numpy, json, urllib, ...)
  string: '#86efac', // soft green — string literals
  number: '#fb7185', // coral — numeric literals
  comment: 'rgba(216, 216, 226, 0.45)', // muted — # comments
  punct: 'rgba(216, 216, 226, 0.65)', // dim white — operators, punctuation
  identifier: '#e5e7eb', // near-white — variable identifiers
  expectedLabel: '#10B981', // green — "Expected output:" prefix
  expectedValue: '#86efac', // soft green — the expected output string
}

const KEYWORDS = new Set([
  'import',
  'from',
  'as',
  'def',
  'return',
  'if',
  'else',
  'elif',
  'for',
  'while',
  'in',
  'not',
  'and',
  'or',
  'class',
  'with',
  'try',
  'except',
  'finally',
  'raise',
  'yield',
  'pass',
  'break',
  'continue',
  'lambda',
  'global',
  'nonlocal',
  'assert',
  'is',
  'del',
  'await',
  'async',
])

const BOOLEANS = new Set(['True', 'False', 'None'])

const BUILTINS = new Set([
  'print',
  'range',
  'len',
  'sum',
  'tuple',
  'list',
  'dict',
  'set',
  'abs',
  'min',
  'max',
  'sorted',
  'enumerate',
  'map',
  'filter',
  'str',
  'int',
  'float',
  'bool',
  'type',
  'isinstance',
  'open',
  'input',
  'round',
  'any',
  'all',
  'reversed',
  'zip',
  'iter',
  'next',
  'hasattr',
  'getattr',
  'setattr',
  'callable',
  'repr',
  'id',
  'hash',
])

// Common module names worth coloring distinctly when they appear after `import`
// or at the start of a dotted access (e.g. `np.array`).
const COMMON_MODULES = new Set([
  'numpy',
  'np',
  'json',
  'urllib',
  'request',
  'datetime',
  'math',
  'random',
  'os',
  'sys',
  're',
  'time',
  'itertools',
  'functools',
  'collections',
])

type Token = { type: keyof typeof COLORS; value: string }

function tokenizePython(code: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const len = code.length

  // Track whether we just saw `import` or `from` so we can color the next
  // identifier as a module.
  let lastNonWhitespaceKeyword: string | null = null

  while (i < len) {
    const ch = code[i]!

    // Whitespace (preserve verbatim)
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      let j = i
      while (j < len) {
        const c = code[j]
        if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
          j++
        } else {
          break
        }
      }
      tokens.push({ type: 'punct', value: code.slice(i, j) })
      i = j
      continue
    }

    // Comment
    if (ch === '#') {
      let j = i
      while (j < len && code[j] !== '\n') j++
      tokens.push({ type: 'comment', value: code.slice(i, j) })
      i = j
      continue
    }

    // String literal — supports plain, single/double, optional f/r/b prefix
    if (
      ch === '"' ||
      ch === "'" ||
      ((ch === 'f' || ch === 'r' || ch === 'b' || ch === 'F' || ch === 'R' || ch === 'B') &&
        (code[i + 1] === '"' || code[i + 1] === "'"))
    ) {
      const start = i
      // skip prefix char
      if (ch === 'f' || ch === 'r' || ch === 'b' || ch === 'F' || ch === 'R' || ch === 'B') {
        i++
      }
      const quote = code[i]!
      i++ // open quote
      while (i < len && code[i] !== quote) {
        if (code[i] === '\\' && i + 1 < len) {
          i += 2
        } else if (code[i] === '\n') {
          // unterminated — bail
          break
        } else {
          i++
        }
      }
      if (i < len) i++ // closing quote
      tokens.push({ type: 'string', value: code.slice(start, i) })
      lastNonWhitespaceKeyword = null
      continue
    }

    // Number literal (int, float, hex)
    if (
      /[0-9]/.test(ch) ||
      (ch === '-' && i + 1 < len && /[0-9]/.test(code[i + 1] ?? ''))
    ) {
      const start = i
      if (ch === '-') i++
      while (i < len && /[0-9.xXoObBeE_a-fA-F]/.test(code[i] ?? '')) {
        i++
      }
      tokens.push({ type: 'number', value: code.slice(start, i) })
      lastNonWhitespaceKeyword = null
      continue
    }

    // Identifier / keyword
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i
      while (j < len && /[a-zA-Z0-9_]/.test(code[j] ?? '')) j++
      const word = code.slice(i, j)
      const next = code[j]

      let type: keyof typeof COLORS = 'identifier'
      if (KEYWORDS.has(word)) {
        type = 'keyword'
        lastNonWhitespaceKeyword = word
      } else if (BOOLEANS.has(word)) {
        type = 'boolean'
        lastNonWhitespaceKeyword = null
      } else if (BUILTINS.has(word)) {
        type = 'builtin'
        lastNonWhitespaceKeyword = null
      } else if (
        (lastNonWhitespaceKeyword === 'import' || lastNonWhitespaceKeyword === 'from') &&
        COMMON_MODULES.has(word)
      ) {
        type = 'module'
      } else if (COMMON_MODULES.has(word) && next === '.') {
        // `np.array(...)`, `json.loads(...)` — color the leading module
        type = 'module'
      } else if (next === '(') {
        type = 'func'
      } else {
        type = 'identifier'
      }

      // Update keyword tracking only for actual keyword hits
      if (type !== 'keyword') {
        // `import numpy, urllib` — keep tracking until newline
        if (
          lastNonWhitespaceKeyword === 'import' ||
          lastNonWhitespaceKeyword === 'from'
        ) {
          // continue tracking — only reset on newline below
        } else {
          lastNonWhitespaceKeyword = null
        }
      }

      tokens.push({ type, value: word })
      i = j
      continue
    }

    // Reset module-tracking on newline
    if (ch === '\n') {
      lastNonWhitespaceKeyword = null
    }

    // Punctuation / operator (single char)
    tokens.push({ type: 'punct', value: ch })
    i++
  }

  return tokens
}

// Comments starting with "Expected" get special treatment so the matching
// expected-output line is visually distinct, like in the PDF.
function styleCommentToken(value: string): CSSProperties {
  if (/^#\s*Expected/i.test(value)) {
    return { color: COLORS.expectedLabel, fontWeight: 600 }
  }
  return { color: COLORS.comment, fontStyle: 'italic' }
}

export function PythonCode({ code }: { code: string }) {
  const tokens = useMemo(() => tokenizePython(code), [code])

  return (
    <pre
      className="p-4 sm:p-5 text-[12px] sm:text-[13px] font-mono leading-[1.7] overflow-x-auto"
      style={{ color: COLORS.identifier }}
    >
      <code>
        {tokens.map((t, idx) => {
          if (t.type === 'comment') {
            return (
              <span key={idx} style={styleCommentToken(t.value)}>
                {t.value}
              </span>
            )
          }
          return (
            <span key={idx} style={{ color: COLORS[t.type] }}>
              {t.value}
            </span>
          )
        })}
      </code>
    </pre>
  )
}

export default PythonCode

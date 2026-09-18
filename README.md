# IT 207 AI Assisted Programming Workshop

Simplified JavaScript implementations of two Linux commands, plus an original
command line tool that combines them.

**Author:** Kenneth Fosuhene
**Course:** IT 207, George Mason University

## Requirements

Node.js 18 or newer. No external dependencies.

```bash
node --version
```

## The Commands

### grep.js

Prints every line of a file that contains a given pattern.

```bash
node grep.js <pattern> <file>
node grep.js -i <pattern> <file>    # case insensitive
```

Example:

```bash
node grep.js ERROR samples/server.log
```

Exits 0 when at least one line matched, 1 when nothing matched, and 2 on a file
error. This mirrors the real `grep`.

### head.js

Prints the first n lines of a file. Defaults to 10.

```bash
node head.js <file>
node head.js -n <count> <file>
```

Example:

```bash
node head.js -n 3 samples/server.log
```

The file is streamed rather than loaded into memory, so reading stops once n
lines have been collected.

### findfirst.js (original tool)

Scans a file for a pattern and stops as soon as n matches are found. This is
`grep` and `head` in a single pass.

```bash
node findfirst.js <pattern> <file>
node findfirst.js -n <count> -i -l <pattern> <file>
```

| Flag | Meaning |
| --- | --- |
| `-n <count>` | Stop after this many matches. Default 5. |
| `-i` | Case insensitive matching. |
| `-l` | Show the line number of each match. |

Example:

```bash
node findfirst.js -n 2 -l ERROR samples/server.log
```

```
4: 2026-09-14 08:07:02 ERROR Failed to connect to cache node 2
6: 2026-09-14 08:07:09 ERROR Cache retry failed, falling back to disk
```

**Why it is not just `grep | head`.** Piping means `grep` keeps scanning the
whole file and producing output long after `head` already has what it needs.
FindFirst breaks out of the loop at the nth match and never reads the rest of
the file. On a multi gigabyte log that is the difference between an instant
result and a full scan.

## Running the Tests

```bash
node tests.js
```

23 assertions covering normal use and edge cases. Current status: all passing.

## Edge Cases Covered

| Case | Expected behavior |
| --- | --- |
| Empty file | Returns nothing, no crash |
| File with no trailing newline | Final line is still read and matched |
| Pattern matches nothing | Empty result, nonzero exit code |
| n larger than the number of lines or matches | Returns everything available |
| n is 0 or negative | Returns nothing |
| Empty pattern | Returns nothing rather than matching every line |
| Missing or unreadable file | Clear error message, nonzero exit, no stack trace |
| Case mismatch | Case sensitive by default, `-i` to override |
| Lines with tabs or extra whitespace | Preserved exactly, not trimmed |

## Sample Files

| File | Purpose |
| --- | --- |
| `samples/server.log` | Realistic log with 15 lines and 5 ERROR entries |
| `samples/empty.txt` | Zero byte file |
| `samples/oneline.txt` | Single line, no trailing newline |
| `samples/messy.txt` | Blank lines, tabs, and leading and trailing spaces |

## Project Structure

```
.
├── grep.js
├── head.js
├── findfirst.js
├── tests.js
├── samples/
│   ├── server.log
│   ├── empty.txt
│   ├── oneline.txt
│   └── messy.txt
├── AI_ASSISTANCE.md
└── README.md
```

## Responsible AI Use

See `AI_ASSISTANCE.md` for documented examples of where AI helped, where it was
wrong, and how the output was verified.

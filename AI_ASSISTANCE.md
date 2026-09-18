# Documented AI Assistance

Required workshop artifact. Each entry records what was asked, what the AI
produced, and how the output was verified or corrected.

---

## Example 1: Understanding the command before writing it

**Prompt:** What does the `grep` command do, and what inputs does `head`
expect?

**AI output:** Explained that grep filters lines matching a pattern and that
head takes a file plus an optional `-n` count, defaulting to 10 lines.

**Verification:** Checked directly in the terminal.

```bash
man head
head samples/server.log | wc -l     # 10
grep ERROR samples/server.log | wc -l   # 5
```

Both matched the explanation. Accepted.

---

## Example 2: A bug the AI introduced and the tests caught

This is the most useful entry in this file.

**Prompt:** How do I stop reading a file early in Node once I have enough
lines?

**AI output:** Suggested `readline` and said to call `rl.close()` inside the
`line` handler once the counter reached n.

**What happened:** The code ran with no error, but `head -n 3` returned all 15
lines and `findFirst` with n of 2 returned all 5 matches. Four tests failed:

```
FAIL  returns the first n lines
      Expected values to be strictly equal:
      15 !== 3
```

**Root cause:** `readline` emits every line already buffered from the current
chunk even after `close()` is called. On a small file the entire file fits in
one chunk, so closing changed nothing. The AI suggestion was incomplete, not
syntactically wrong, which is exactly why no error appeared.

**Fix:** Added an explicit guard flag so buffered events after the cutoff are
ignored.

```js
let done = false;
rl.on("line", (line) => {
  if (done) return;
  lines.push(line);
  if (lines.length >= n) {
    done = true;
    rl.close();
    stream.destroy();
  }
});
```

**Result:** 23 of 23 tests passing.

**Takeaway:** The AI produced code that ran cleanly and was still wrong. Only
the test suite exposed it. Code that executes without error is not code that is
correct, and verification is the programmer's responsibility, not the tool's.

---

## Example 3: Generating test cases

**Prompt:** What edge cases should I consider for a tool that finds the first n
lines matching a pattern?

**AI output:** Suggested empty file, pattern not found, n larger than the match
count, n of 0, missing file, and case sensitivity.

**Assessment:** A useful starting list, but incomplete. Two cases it missed
were added manually after testing:

1. A file with no trailing newline. Splitting on `\n` was dropping or
   mishandling the final line.
2. An empty pattern string, which with `.includes("")` matches every line and
   silently returns the whole file. Now guarded explicitly.

**Takeaway:** AI is good at producing the obvious half of a test matrix. The
cases that actually broke the code came from running it against real files.

---

## Example 4: Where AI was least useful

Broad prompts such as "write a grep clone in JavaScript" produced code that
worked on a clean input file and failed on anything unusual. The first version
printed extra blank lines because the trailing empty element from `.split("\n")`
was not filtered.

Narrow, behavior specific prompts produced far better results, for example
"how do I stop a Node read stream after n matches without loading the file into
memory."

**Takeaway:** The quality of AI output tracked the precision of the prompt.
Describing the required behavior worked. Naming the desired program did not.

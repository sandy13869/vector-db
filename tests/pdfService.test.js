const test = require("node:test");
const assert = require("node:assert/strict");

const { splitText, CHUNK_SIZE, CHUNK_OVERLAP } = require("../src/services/pdfService");

test("splitText ignores blank input and preserves short text", () => {
  assert.deepEqual(splitText(" \n\t "), []);
  assert.deepEqual(splitText("A short paragraph."), ["A short paragraph."]);
});

test("splitText creates bounded, overlapping chunks without losing the tail", () => {
  const text = Array.from({ length: 500 }, (_, index) => `word${index}.`).join(" ");
  const chunks = splitText(text);

  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.length <= CHUNK_SIZE));
  assert.ok(chunks.at(-1).includes("word499."));

  for (let index = 1; index < chunks.length; index += 1) {
    const previousTail = chunks[index - 1].slice(-CHUNK_OVERLAP / 2);
    assert.ok(chunks[index].includes(previousTail.trim().split(" ").at(-1)));
  }
});

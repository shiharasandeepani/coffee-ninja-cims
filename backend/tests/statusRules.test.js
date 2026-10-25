import test from "node:test";
import assert from "node:assert/strict";

const TRANSITIONS = {
  "New": ["In Progress"],
  "In Progress": ["New", "Resolved"],
  "Resolved": ["In Progress"],
};

function canTransition(from, to) {
  return Boolean(TRANSITIONS[from]?.includes(to));
}

test("New cannot jump directly to Resolved", () => {
  assert.equal(canTransition("New", "Resolved"), false);
});

test("Resolved can be reopened to In Progress", () => {
  assert.equal(canTransition("Resolved", "In Progress"), true);
});
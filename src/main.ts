import { createExpressionGraph } from "../lib/graph";
import { MultiLayerPerceptron } from "../lib/Neuron";
import { Value } from "../lib/Value";

import hljs from "highlight.js";

/** Style for a Value node in a graph. */
const valueStyle = {
  shape: "box",
  font: {
    color: "#fff",
    multi: "md",
  },
  color: {
    background: "#3f3f3f",
    border: "#999999",
    highlight: {
      background: "#545454",
      border: "#999999",
    },
  },
};

/** Style for an Operation node in a graph. */
const opStyle = {
  shape: "circle",
  font: {
    color: "#fff",
  },
  color: {
    background: "#ef4873",
    highlight: {
      background: "#f46583",
      border: "#ffaab6",
    },
    border: "#ffaab6",
  },
};

/** Populates the simple expression example. */
function createSimpleExpression(backward: boolean) {
  const simpleExpression = `const length = new Value(15, "length");
const width = new Value(200, "width");
const area = length.multiply(width).as("area");`;

  const simpleExpressionContainer = document.getElementById(
    "simple-expression"
  ) as HTMLElement;

  const simpleExpressionGraphContainer = document.getElementById(
    "simple-expression-graph"
  ) as HTMLElement;

  simpleExpressionContainer.innerHTML = simpleExpression;

  const area = new Function(
    "Value",
    `${simpleExpression} ${backward ? "area.backward();" : ""} return area;`
  )(Value);

  createExpressionGraph(
    area,
    simpleExpressionGraphContainer,
    valueStyle,
    opStyle
  );
}

/** Populates the complex expression example. */
function createComplexExpression(backward: boolean) {
  const complexExpression = `const a = new Value(200, "a");
const b = new Value(5.2, "b");
const c = a.multiply(b.pow(2)).as("c");
const d = c.negate().divide(a).as("d");
const e = new Value(0.89, "e");
const f = e.subtract(d).as("f");
`;

  const complexExpressionContainer = document.getElementById(
    "complex-expression"
  ) as HTMLElement;

  const complexExpressionGraphContainer = document.getElementById(
    "complex-expression-graph"
  ) as HTMLElement;

  complexExpressionContainer.innerHTML = complexExpression;

  const area = new Function(
    "Value",
    `${complexExpression} ${backward ? "f.backward();" : ""} return f;`
  )(Value);

  createExpressionGraph(
    area,
    complexExpressionGraphContainer,
    valueStyle,
    opStyle
  );
}

function wireBackpropagateHandler() {
  const backpropagateBtn = document.getElementById("backpropagate-expressions");
  if (backpropagateBtn) {
    backpropagateBtn.onclick = () => {
      createSimpleExpression(true);
      createComplexExpression(true);
      highlightAll();
    };
  }
}

/** Runs highlight js on all code and pre > code blocks */
function highlightAll() {
  hljs.configure({
    languages: ["typescript"],
  });

  hljs.highlightAll();

  document
    .querySelectorAll("code:not(pre code)")
    .forEach((c) => hljs.highlightElement(c as HTMLElement));
}

createSimpleExpression(false);
createComplexExpression(false);
highlightAll();
wireBackpropagateHandler();

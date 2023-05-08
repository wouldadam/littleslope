import { addNeuronToGraph, addValueToGraph, createGraph } from "../lib/graph";
import { Neuron } from "../lib/Neuron";
import { Value } from "../lib/Value";

import hljs from "highlight.js";

/** Styles for different kinds of nodes in the graph. */
const groups = {
  value: {
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
  },
  op: {
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
  },
  neuron: {
    shape: "hexagon",
    font: {
      color: "#fff",
    },

    color: {
      background: "#ff5722",
      highlight: {
        background: "#ff6d3b",
        border: "#ffb99b",
      },
      border: "#ffb99b",
    },
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

  const [network, nodes, edges] = createGraph(
    simpleExpressionGraphContainer,
    groups
  );

  addValueToGraph(area, "", nodes, edges);

  network.stabilize();
  network.fit();
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

  const [network, nodes, edges] = createGraph(
    complexExpressionGraphContainer,
    groups
  );

  addValueToGraph(area, "", nodes, edges);

  network.stabilize();
  network.fit();
}

/** Wire up the button for manual backpropagation. */
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

/** Create a single neuron example. */
function createNeuron() {
  const neuron = `const neuron = new Neuron(3, "neuron");
const inputs = [2.5, 1.5, 0.456];
const out = neuron.call(inputs);
`;

  const neuronContainer = document.getElementById("neuron") as HTMLElement;

  const neuronGraphContainer = document.getElementById(
    "neuron-graph"
  ) as HTMLElement;

  neuronContainer.innerHTML = neuron;

  const out = new Function("Neuron", `${neuron} return out;`)(Neuron);
  out.backward();

  const [network, nodes, edges] = createGraph(neuronGraphContainer, groups);

  addNeuronToGraph(out, "0", nodes, edges, network);

  network.stabilize();
  network.fit();
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
wireBackpropagateHandler();

createNeuron();

highlightAll();



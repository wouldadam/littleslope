import { Layer } from "../lib/Layer";
import { MultiLayerPerceptron } from "../lib/MultiLayerPerceptron";
import { Neuron } from "../lib/Neuron";
import { Value } from "../lib/Value";
import {
  GraphEdgeDataSet,
  GraphNodeDataSet,
  addValueToGraph,
  clusterLayer,
  clusterNeuron,
  createGraph,
} from "../lib/graph";
import { gradientDescent } from "../lib/train";

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
  layer: {
    shape: "diamond",
    font: {
      color: "#fff",
    },

    color: {
      background: "#4caf50",
      highlight: {
        background: "#63b863",
        border: "#b4dcb0",
      },
      border: "#b4dcb0",
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

  const nodes = new GraphNodeDataSet();
  const edges = new GraphEdgeDataSet();
  addValueToGraph(area, nodes, edges);

  const network = createGraph(
    simpleExpressionGraphContainer,
    groups,
    nodes,
    edges
  );

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

  const nodes = new GraphNodeDataSet();
  const edges = new GraphEdgeDataSet();
  addValueToGraph(area, nodes, edges);

  const network = createGraph(
    complexExpressionGraphContainer,
    groups,
    nodes,
    edges
  );

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
  const neuronCode = `const neuron = new Neuron(3, "neuron");
const inputs = [2.5, 1.5, 0.456];
const out = neuron.call(inputs);
`;

  const neuronContainer = document.getElementById("neuron") as HTMLElement;

  const neuronGraphContainer = document.getElementById(
    "neuron-graph"
  ) as HTMLElement;

  neuronContainer.innerHTML = neuronCode;

  const [out, neuron] = new Function(
    "Neuron",
    `${neuronCode} return [out, neuron];`
  )(Neuron);
  out.backward();

  const nodes = new GraphNodeDataSet();
  const edges = new GraphEdgeDataSet();
  addValueToGraph(out, nodes, edges);

  const network = createGraph(neuronGraphContainer, groups, nodes, edges);

  clusterNeuron(network, neuron.id);
  network.stabilize();
  network.fit();
}

/** Create a single layer example. */
function createLayer() {
  const layerCode = `const layer = new Layer(3, 3, "l");
const inputs = [2.5, 1.5, 0.456];
const outs = layer.call(inputs);
`;

  const layerContainer = document.getElementById("layer") as HTMLElement;

  const layerGraphContainer = document.getElementById(
    "layer-graph"
  ) as HTMLElement;

  layerContainer.innerHTML = layerCode;

  const [outs, layer] = new Function(
    "Layer",
    `${layerCode} return [outs, layer];`
  )(Layer);
  outs.forEach((out: Value) => out.backward());

  const nodes = new GraphNodeDataSet();
  const edges = new GraphEdgeDataSet();
  for (const out of outs) {
    addValueToGraph(out, nodes, edges);
  }

  const network = createGraph(layerGraphContainer, groups, nodes, edges);

  for (const neuron of layer.neurons) {
    clusterNeuron(network, neuron.id);
  }
  clusterLayer(network, layer.id);

  network.stabilize();
  network.fit();
}

/** Create a MLP example. */
function createMLP() {
  const mlpCode = `const mlp = new MultiLayerPerceptron(3, [4, 4, 1]);;
const inputs = [2.5, 1.5, 0.456];
const outs = mlp.call(inputs);
`;

  const mlpContainer = document.getElementById("mlp") as HTMLElement;

  const mlpGraphContainer = document.getElementById("mlp-graph") as HTMLElement;

  mlpContainer.innerHTML = mlpCode;

  const [outs, mlp] = new Function(
    "MultiLayerPerceptron",
    `${mlpCode} return [outs, mlp];`
  )(MultiLayerPerceptron);
  outs.forEach((out: Value) => out.backward());

  const nodes = new GraphNodeDataSet();
  const edges = new GraphEdgeDataSet();

  for (const out of outs) {
    addValueToGraph(out, nodes, edges);
  }

  const network = createGraph(mlpGraphContainer, groups, nodes, edges);

  for (const layer of mlp.layers) {
    for (const neuron of layer.neurons) {
      clusterNeuron(network, neuron.id);
    }
    clusterLayer(network, layer.id);
  }

  network.stabilize();
  network.fit();
}

/** Create a gradient descent example. */
function createGD() {
  const gdCode = `const mlp = new MultiLayerPerceptron(3, [4, 4, 1]);
const inputs = [
  [2, 3, -1],
  [3, -1, 0.5],
  [0.5, 1, 1],
  [1, 1, -1],
];
const expected = [[1], [-1], [-1], [1]];
const [results, loss] = gradientDescent(mlp, inputs, expected, 500 , 0.01);
`;

  const gdContainer = document.getElementById("gd") as HTMLElement;
  const lossContainer = document.getElementById("gd-loss") as HTMLElement;
  const resultsContainer = document.getElementById("gd-results") as HTMLElement;

  gdContainer.innerHTML = gdCode;

  const [_, results, loss] = new Function(
    "MultiLayerPerceptron",
    "gradientDescent",
    `${gdCode} return [mlp, results, loss];`
  )(MultiLayerPerceptron, gradientDescent);

  lossContainer.innerText = loss.data;
  resultsContainer.innerText = results
    .flatMap((result: Value[]) => {
      return result.map((value) => value.data);
    })
    .join(", ");
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
createLayer();
createMLP();
createGD();

highlightAll();



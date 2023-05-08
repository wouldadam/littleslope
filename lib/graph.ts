import { v4 as uuidV4 } from "uuid";
import { DataSet } from "vis-data";
import { Edge, Network, Node, Options } from "vis-network";
import { Value } from "./Value";

/** Custom data stored in a Node. */
export interface GraphNode extends Node {
  neuronId: string;
}

/** Custom data stored on an Edge. */
export interface GraphEdge extends Edge {
  neuronId: string;
}

/**
 * Creates an empty vis.js Network attached to the specified container.
 * The network can then be populated with Values and Neurons.
 *
 * @param container The container to attach the network to.
 * @param groups Custom styles for node/edge groups.
 * @returns The created network, alongside DataSets to add nodes and edges to.
 */
export function createGraph(container: HTMLElement, groups: Options["groups"]) {
  const nodes = new DataSet<GraphNode, "id">();
  const edges = new DataSet<GraphEdge, "id">();

  const options: Options = {
    layout: {
      hierarchical: {
        enabled: true,
        direction: "LR",
        sortMethod: "directed",
      },
    },
    physics: {
      hierarchicalRepulsion: {
        avoidOverlap: 0.4,
      },
    },
    groups,
  };

  const network = new Network(container, { nodes, edges }, options);

  // Open clusters on double click
  network.on("doubleClick", (params) => {
    let opened = false;
    for (const nodeId of params.nodes) {
      if (network.isCluster(nodeId)) {
        network.openCluster(nodeId);
        opened = true;
      }
    }

    if (opened) {
      network.stabilize();
      network.fit();
    }
  });

  // Cluster values into neurons on hold
  network.on("hold", (params) => {
    let clustered = false;

    for (const nodeId of params.nodes) {
      const node = nodes.get(nodeId, {});
      if (
        node &&
        (node.group === "value" || node.group === "op") &&
        node.neuronId.length > 0
      ) {
        clusterNeuron(network, node.neuronId);
        clustered = true;
      }
    }

    if (clustered) {
      network.stabilize();
      network.fit();
    }
  });

  return [network, nodes, edges] as const;
}

/**
 * Recursively adds a Value (and its children) to a graph.
 * @param value The Value to add.
 * @param neuronId The id of the Neuron the Value belongs to.
 * @param nodes The nodes DataSet to add to.
 * @param edges The edges DataSet to add to.
 * @returns
 */
export function addValueToGraph(
  value: Value,
  neuronId: string,
  nodes: DataSet<GraphNode, "id">,
  edges: DataSet<GraphEdge, "id">
) {
  if (nodes.get(value.id, {}) !== null) {
    return;
  }

  nodes.add({
    id: value.id,
    label: `*_${value.name}_*\n data: ${value.data.toFixed(
      4
    )}\ngrad: ${value.grad.toFixed(4)}`,
    group: "value",
    neuronId,
  });

  if (value.children.length > 0) {
    const opKey = uuidV4();
    nodes.add({
      id: opKey,
      label: ` ${value.operation} `,
      group: "op",
      neuronId,
    });
    edges.add({ from: opKey, to: value.id, arrows: "to", neuronId });

    for (const prev of value.children) {
      addValueToGraph(prev, neuronId, nodes, edges);
      edges.add({ from: prev.id, to: opKey, arrows: "to", neuronId });
    }
  }
}

/**
 *
 * @param output The Value representing the output of a call to the Neuron.
 * @param neuronId The id of the Neuron.
 * @param nodes The nodes DataSet to add to.
 * @param edges The edges DataSet to add to.
 * @param network The network being added to.
 */
export function addNeuronToGraph(
  output: Value,
  neuronId: string,
  nodes: DataSet<GraphNode, "id">,
  edges: DataSet<GraphEdge, "id">,
  network: Network
) {
  addValueToGraph(output, neuronId, nodes, edges);
  clusterNeuron(network, neuronId);
}

/** Clusters a neuron in a network. */
function clusterNeuron(network: Network, neuronId: string) {
  network.cluster({
    joinCondition: (node: GraphNode) => {
      return node.neuronId === neuronId;
    },
    clusterNodeProperties: {
      label: `Neuron ${neuronId}`,
      group: "neuron",
    },
  });
}

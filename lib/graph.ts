import { v4 as uuidV4 } from "uuid";
import { DataSet } from "vis-data";
import { Edge, Network, Node, Options } from "vis-network";
import { Value } from "./Value";

/** Custom data stored in a Node. */
export interface GraphNode extends Node {
  neuronId: string;
  layerId: string;
}

/** Custom data stored on an Edge. */
export interface GraphEdge extends Edge {
  neuronId: string;
  layerId: string;
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

  // On hold cluster: Values/Ops -> Neurons, Neurons -> Layers
  network.on("hold", (params) => {
    let clustered = false;

    for (const nodeId of params.nodes) {
      const node = nodes.get(nodeId, {});

      const isNeuronChild =
        node !== null &&
        (node.group === "value" || node.group === "op") &&
        node.neuronId.length > 0;

      if (isNeuronChild) {
        clusterNeuron(network, node.neuronId);
        clustered = true;
        continue;
      }

      if (nodeId.startsWith("cluster:")) {
        const clusterNodes = network.getNodesInCluster(nodeId);
        const clusterNode = nodes.get(clusterNodes[0], {});
        console.log(nodeId, clusterNodes, clusterNode);
        if (
          clusterNode &&
          (clusterNode.group === "value" || clusterNode.group === "op") &&
          clusterNode.layerId.length > 0
        ) {
          clusterLayer(network, clusterNode.layerId);
          clustered = true;
        }
      }

      if (clustered) {
        network.stabilize();
        network.fit();
      }
    }
  });

  return [network, nodes, edges] as const;
}

/**
 * Recursively adds a Value (and its children) to a graph.
 * @param value The Value to add.
 * @param neuronId The id of the Neuron the Value belongs to.
 * @param layerId The id of the Layer the Value belongs to.
 * @param nodes The nodes DataSet to add to.
 * @param edges The edges DataSet to add to.
 * @returns
 */
export function addValueToGraph(
  value: Value,
  neuronId: string,
  layerId: string,
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
    layerId,
  });

  if (value.children.length > 0) {
    const opKey = uuidV4();
    nodes.add({
      id: opKey,
      label: ` ${value.operation} `,
      group: "op",
      neuronId,
      layerId,
    });
    edges.add({ from: opKey, to: value.id, arrows: "to", neuronId, layerId });

    for (const prev of value.children) {
      addValueToGraph(prev, neuronId, layerId, nodes, edges);
      edges.add({ from: prev.id, to: opKey, arrows: "to", neuronId, layerId });
    }
  }
}

/**
 * Add a neuron to the graph.
 * @param output The Value representing the output of a call to the Neuron.
 * @param neuronId The id of the Neuron.
 * @param layerId The id of the Layer the Value belongs to.
 * @param nodes The nodes DataSet to add to.
 * @param edges The edges DataSet to add to.
 * @param network The network being added to.
 */
export function addNeuronToGraph(
  output: Value,
  neuronId: string,
  layerId: string,
  nodes: DataSet<GraphNode, "id">,
  edges: DataSet<GraphEdge, "id">,
  network: Network
) {
  addValueToGraph(output, neuronId, layerId, nodes, edges);
  clusterNeuron(network, neuronId);
}

/**
 * Add a layer to the graph.
 * @param output The Value representing the output of a call to the Neuron.
 * @param neuronId The id of the Neuron.
 * @param nodes The nodes DataSet to add to.
 * @param edges The edges DataSet to add to.
 * @param network The network being added to.
 */
export function addLayerToGraph(
  outputs: Value[],
  layerId: string,
  nodes: DataSet<GraphNode, "id">,
  edges: DataSet<GraphEdge, "id">,
  network: Network
) {
  for (let idx = 0; idx < outputs.length; ++idx) {
    addNeuronToGraph(
      outputs[idx],
      idx.toString(),
      layerId,
      nodes,
      edges,
      network
    );
  }

  clusterLayer(network, layerId);
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
    processProperties: (clusterOptions, childNodes) => {
      clusterOptions.neuronId = childNodes[0].neuronId;
      clusterOptions.layerId = childNodes[0].layerId;
      return clusterOptions;
    },
  });
}

/** Clusters a layer in a network. */
function clusterLayer(network: Network, layerId: string) {
  network.cluster({
    joinCondition: (node: GraphNode) => {
      return node.layerId === layerId;
    },
    clusterNodeProperties: {
      label: `Layer ${layerId}`,
      group: "layer",
    },
    processProperties: (clusterOptions, childNodes) => {
      clusterOptions.neuronId = childNodes[0].neuronId;
      clusterOptions.layerId = childNodes[0].layerId;
      return clusterOptions;
    },
  });
}

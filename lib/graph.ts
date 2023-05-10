import { v4 as uuidV4 } from "uuid";
import { DataSet } from "vis-data";
import { Edge, Network, Node, Options } from "vis-network";
import { Layer } from "./Layer";
import { Kind, Value } from "./Value";

/** Custom data stored in a Node. */
export interface GraphNode extends Node {
  neuronId: string;
  layerId: string;
  kind: Kind;
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
 * @param nodes The nodes DataSet to add to.
 * @param edges The edges DataSet to add to.
 * @returns
 */
export function addValueToGraph(
  value: Value,
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
    neuronId: value.neuronId,
    layerId: value.layerId,
    kind: value.kind,
  });

  if (value.children.length > 0) {
    const opKey = uuidV4();
    nodes.add({
      id: opKey,
      label: ` ${value.operation} `,
      group: "op",
      neuronId: value.neuronId,
      layerId: value.layerId,
      kind: "default",
    });
    edges.add({
      from: opKey,
      to: value.id,
      arrows: "to",
      neuronId: value.neuronId,
      layerId: value.layerId,
    });

    for (const prev of value.children) {
      addValueToGraph(prev, nodes, edges);
      edges.add({
        from: prev.id,
        to: opKey,
        arrows: "to",
        neuronId: value.neuronId,
        layerId: value.layerId,
      });
    }
  }
}

/**
 * Add a layer to the graph.
 * @param layer The Layer being added.
 * @param output The Value representing the output of a call to the Layer.
 * @param nodes The nodes DataSet to add to.
 * @param edges The edges DataSet to add to.
 * @param network The network being added to.
 */
export function addLayerToGraph(
  layer: Layer,
  outputs: Value[],
  nodes: DataSet<GraphNode, "id">,
  edges: DataSet<GraphEdge, "id">,
  network: Network
) {
  for (let idx = 0; idx < outputs.length; ++idx) {
    addValueToGraph(outputs[idx], nodes, edges);
  }

  for (const neuron of layer.neurons) {
    clusterNeuron(network, neuron.id);
  }
  clusterLayer(network, layer.id);
}

/**
 * Clusters a neuron in a network.
 * @param network The network to cluster.
 * @param neuronId The id of the Neuron to cluster.
 */
export function clusterNeuron(network: Network, neuronId: string) {
  network.cluster({
    joinCondition: (node: GraphNode) => {
      return node.neuronId === neuronId && node.kind === "default";
    },
    clusterNodeProperties: {
      ...{ allowSingleNodeCluster: true },
      label: `Neuron ${neuronId.substring(0, 6)}...`,
      group: "neuron",
    },
    processProperties: (clusterOptions, childNodes) => {
      clusterOptions.neuronId = childNodes[0].neuronId;
      clusterOptions.layerId = childNodes[0].layerId;
      return clusterOptions;
    },
  });
}

/** Clusters a layer in a network.
 * @param network The network to cluster.
 * @param layerId The id of the Layer to cluster.
 */
export function clusterLayer(network: Network, layerId: string) {
  network.cluster({
    joinCondition: (node: GraphNode) => {
      return (
        node.layerId === layerId &&
        node.kind !== "input" &&
        node.kind !== "output"
      );
    },
    clusterNodeProperties: {
      ...{ allowSingleNodeCluster: true },
      label: `Layer ${layerId.substring(0, 6)}...`,
      group: "layer",
    },
    processProperties: (clusterOptions, childNodes) => {
      clusterOptions.neuronId = childNodes[0].neuronId;
      clusterOptions.layerId = childNodes[0].layerId;
      return clusterOptions;
    },
  });
}

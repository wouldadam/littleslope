import { v4 as uuidV4 } from "uuid";
import { DataSet } from "vis-data";
import { Edge, Network, Node, Options } from "vis-network";
import { Value } from "./Value";

/**
 * Creates a vis.js Network attached to the specified container.
 * The network is populated with an expression graph.
 *
 * @param value The Value to create the expression graph for.[]
 * @param container The container to attach the network to.
 * @param valueOpts Node options for nodes that represent a Value.
 * @param opOpts Node options for nodes that represent an Operation.
 * @returns The created network.
 */
export function createExpressionGraph(
  value: Value,
  container: HTMLElement,
  valueOpts: Partial<Node> = {},
  opOpts: Partial<Node> = {}
) {
  const nodes = new DataSet<Node, "id">();
  const edges = new DataSet<Edge, "id">();

  addValueToGraph(value, nodes, edges, new Set(), valueOpts, opOpts);

  const options: Options = {
    layout: {
      hierarchical: {
        enabled: true,
        direction: "LR",
        sortMethod: "directed",
      },
    },
  };

  const network = new Network(container, { nodes, edges }, options);
  return network;
}

function addValueToGraph(
  value: Value,
  nodes: DataSet<Node, "id">,
  edges: DataSet<Edge, "id">,
  visited: Set<string>,
  valueOpts: Partial<Node>,
  opOpts: Partial<Node>
) {
  if (visited.has(value.id)) {
    return;
  }

  nodes.add({
    id: value.id,
    label: `*_${value.name}_*\n data: ${value.data.toFixed(
      4
    )}\ngrad: ${value.grad.toFixed(4)}`,
    ...valueOpts,
  });
  visited.add(value.id);

  if (value.children.length > 0) {
    const opKey = uuidV4();
    nodes.add({
      id: opKey,
      label: ` ${value.operation} `,
      ...opOpts,
    });
    edges.add({ from: opKey, to: value.id, arrows: "to" });

    for (const prev of value.children) {
      addValueToGraph(prev, nodes, edges, visited, valueOpts, opOpts);
      edges.add({ from: prev.id, to: opKey, arrows: "to" });
    }
  }
}

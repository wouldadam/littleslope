import { v4 as uuidV4 } from "uuid";
import { Neuron } from "./Neuron";
import { Value } from "./Value";

/**
 * Represents a single layer of Neurons in a network.
 */
export class Layer {
  /** A UUIDv4 unique to this Layer. */
  public readonly id = uuidV4();

  public neurons: Neuron[];

  /**
   * Creates a layer.
   * @param neuronInputCount the number of inputs each Neuron in the layer should accept.
   * @param neuronCount The number of Neurons in the network.
   * @param name A user friendly name for the layer.
   */
  constructor(
    neuronInputCount: number,
    neuronCount: number,
    public name: string
  ) {
    this.neurons = new Array(neuronCount);
    for (let neuronIdx = 0; neuronIdx < neuronCount; ++neuronIdx) {
      this.neurons[neuronIdx] = new Neuron(
        neuronInputCount,
        `${name}.n${neuronIdx}`,
        this.id
      );
    }
  }

  /**
   * Apply the inputs to every Neuron in the Layer and get the outputs.
   * @param inputs The inputs to provide to Neurons.
   * @returns An array of outputs. One for each Neuron.
   */
  call(inputs: Value[] | number[]): Value[] {
    inputs = inputs.map((data, idx) => {
      if (data instanceof Value) {
        return data;
      }

      data = new Value(data, `${this.name}.i${idx}`, "", this.id);
      data.kind = "input";
      return data;
    });

    const outs = this.neurons.map((neuron) => neuron.call(inputs));
    return outs;
  }

  /**
   * Get the weights and bias for every Neuron in the Layer.
   * @returns An array of weights.
   */
  getParameters(): Value[] {
    const params = this.neurons.flatMap((n) => n.getParameters());
    return params;
  }
}

import { Neuron } from "./Neuron";
import { Value } from "./Value";

/**
 * Represents a single layer of Neurons in a network.
 */
export class Layer {
  public neurons: Neuron[];

  /**
   * Creates a layer.
   * @param neuronInputCount the number of inputs each Neuron in the layer should accept.
   * @param neuronCount The number of Neurons in the network.
   * @param name A user friendly name for the layer.
   */
  constructor(neuronInputCount: number, neuronCount: number, name: string) {
    this.neurons = new Array(neuronCount);
    for (let neuronIdx = 0; neuronIdx < neuronCount; ++neuronIdx) {
      this.neurons[neuronIdx] = new Neuron(
        neuronInputCount,
        `${name}.n${neuronIdx}`
      );
    }
  }

  /**
   * Apply the inputs to every Neuron in the Layer and get the outputs.
   * @param inputs The inputs to provide to Neurons.
   * @returns An array of outputs. One for each Neuron.
   */
  call(x: Value[] | number[]): Value[] {
    const outs = this.neurons.map((neuron) => neuron.call(x));
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

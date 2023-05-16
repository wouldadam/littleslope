import { Layer } from "./Layer";
import { ActivationFunction, tanh } from "./Neuron";
import { Value } from "./Value";

/**
 * Represents a Multi Layer Perceptron.
 */
export class MultiLayerPerceptron {
  /** The Layers in the MLP. */
  public layers: Layer[];

  /**
   * Creates an MLP.
   * @param inputCount The number of inputs to the MLP.
   * @param layerConfig Array containing the config for each layer (starting with the first hidden layer). The config can be:
   *                    - A number indicating the number of neurons in the layer.
   *                    - An array indicating the number of neurons in the layer and then the activation function.
   */
  constructor(
    inputCount: number,
    layerConfig: Array<number | [number, ActivationFunction]>
  ) {
    this.layers = new Array(layerConfig.length);

    let layerInputCount = inputCount;
    for (let layerIdx = 0; layerIdx < this.layers.length; ++layerIdx) {
      const config = layerConfig[layerIdx];
      let layerNeuronCount = 1;
      let activationFunction = tanh;
      if (typeof config === "number") {
        layerNeuronCount = config;
      } else {
        layerNeuronCount = config[0];
        activationFunction = config[1];
      }

      this.layers[layerIdx] = new Layer(
        layerInputCount,
        layerNeuronCount,
        `l${layerIdx}`,
        activationFunction
      );

      layerInputCount = layerNeuronCount;
    }
  }

  /**
   * Apply th inputs to the MLP and get the outputs.
   * @param inputs The inputs to apply.
   * @returns The resulting output Values.
   */
  call(inputs: Value[] | number[]): Value[] {
    let result = inputs;
    for (const layer of this.layers) {
      result = layer.call(result);
    }

    return result as Value[];
  }

  /**
   * Gets an array of all parameters in each consecutive Layer.
   * @returns An array of weights.
   */
  getParameters(): Value[] {
    const params = this.layers.flatMap((l) => l.getParameters());
    return params;
  }
}

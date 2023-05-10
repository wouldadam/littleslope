import { Layer } from "./Layer";
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
   * @param neuronCountPerLayer An array indicating the number of Neurons in each
   *                            Layer (starting with the first hidden layer).
   */
  constructor(inputCount: number, neuronCountPerLayer: number[]) {
    this.layers = new Array(neuronCountPerLayer.length);

    for (let layerIdx = 0; layerIdx < this.layers.length; ++layerIdx) {
      const layerInputCount =
        layerIdx === 0 ? inputCount : neuronCountPerLayer[layerIdx - 1];

      this.layers[layerIdx] = new Layer(
        layerInputCount,
        neuronCountPerLayer[layerIdx],
        `l${layerIdx}`
      );
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

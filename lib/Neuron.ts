import { Value } from "./Value";

/**
 * Generates a random number within a range.
 * @param min The min number in the range (inclusive)
 * @param max The max number in the range (exclusive)
 * @returns A random number in the specified range.
 */
function randomRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

/**
 * Represents a single neuron.
 */
export class Neuron {
  /** The weights applied to each input. */
  public weights: Value[];

  /** The bias input value. */
  public bias: Value;

  /**
   * Creates a new Neuron.
   * @param inputCount The number of inputs this Neuron will accept.
   * @param name A user friendly name for the Neuron. Also used to name the weights and bias Values.
   */
  constructor(inputCount: number, public name: string) {
    this.weights = new Array(inputCount);

    for (let inputIdx = 0; inputIdx < inputCount; ++inputIdx) {
      this.weights[inputIdx] = new Value(
        randomRange(-1, 1),
        `${name}.w${inputIdx}`
      );
    }

    this.bias = new Value(randomRange(-1, 1), "bias");
  }

  /**
   * Apply inputs to the Neuron and get the output.
   * @param inputs The inputs the the Neuron
   * @returns The resulting output Value.
   */
  call(inputs: Value[] | number[]): Value {
    if (inputs.length !== this.weights.length) {
      throw new Error(
        `Neuron ${this.name} given ${inputs.length} inputs, expected ${this.weights.length}.`
      );
    }

    // Sum the weighted inputs and the bias, then squish
    let act = this.bias;
    for (let inputIdx = 0; inputIdx < this.weights.length; ++inputIdx) {
      act = act.add(
        this.weights[inputIdx]
          .multiply(inputs[inputIdx])
          .as(`${this.weights[inputIdx].name}.wtd`)
      );
    }

    act = act.tanh().as(`${this.name}.out`);

    return act;
  }

  /** Gets the weights + bias Values for the Neuron. */
  getParameters(): Value[] {
    return this.weights.concat([this.bias]);
  }
}

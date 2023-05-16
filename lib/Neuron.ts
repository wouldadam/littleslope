import { v4 as uuidV4 } from "uuid";
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
  /** A UUIDv4 unique to this Neuron. */
  public readonly id = uuidV4();

  /** The weights applied to each input. */
  public weights: Value[];

  /** The bias input value. */
  public bias: Value;

  /**
   * Creates a new Neuron.
   * @param inputCount The number of inputs this Neuron will accept.
   * @param name A user friendly name for the Neuron. Also used to name the weights and bias Values.
   * @param activationFunction The activation function to use in this Neuron.
   * @param layerId The id if the layer that generated this Neuron.
   */
  constructor(
    inputCount: number,
    public name: string,
    public activationFunction: ActivationFunction = tanh,
    public layerId: string = ""
  ) {
    this.weights = new Array(inputCount);

    for (let inputIdx = 0; inputIdx < inputCount; ++inputIdx) {
      this.weights[inputIdx] = new Value(
        randomRange(-1, 1),
        `${name}.w${inputIdx}`,
        this.id,
        this.layerId
      );
      this.weights[inputIdx].kind = "weight";
    }

    this.bias = new Value(
      randomRange(-1, 1),
      `${this.name}.bias`,
      this.id,
      this.layerId
    );
    this.bias.kind = "input";
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

    inputs = inputs.map((data, idx) => {
      if (data instanceof Value) {
        return data;
      }

      data = new Value(data, `${this.name}.i${idx}`, this.id, this.layerId);
      data.kind = "input";
      return data;
    });

    // Sum the weighted inputs and the bias, then squish
    let sum = this.bias;
    for (let inputIdx = 0; inputIdx < this.weights.length; ++inputIdx) {
      sum = sum.add(
        this.weights[inputIdx]
          .multiply(inputs[inputIdx])
          .as(`${this.weights[inputIdx].name}.wtd`, this.id, this.layerId)
      );
    }

    const out = this.activationFunction(sum).as(`${this.name}.out`);
    out.kind = "output";
    return out;
  }

  /** Gets the weights + bias Values for the Neuron. */
  getParameters(): Value[] {
    return this.weights.concat([this.bias]);
  }
}

/** Prototype for an activation function. */
export type ActivationFunction = (val: Value) => Value;

/** A linear activation function. */
export function linear(val: Value) {
  return val;
}

/** A sigmoid activation function. */
export function sigmoid(val: Value) {
  return new Value(1, "1").divide(val.negate().exp().add(1));
}

/** A tanh activation function. */
export function tanh(val: Value) {
  return val.tanh();
}

/** A rectified linear unit activation function. */
export function relu(val: Value) {
  return val.relu();
}

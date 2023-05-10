import { v4 as uuidV4 } from "uuid";

/**
 * Describes the operation that was used to form a Value.
 * */
export type Operation = "+" | "-" | "x" | "/" | "=" | "pow" | "exp" | "tanh";

/**
 * The kinds of Values that could exist.
 */
export type Kind = "default" | "input" | "weight" | "output";

/**
 * Represents an individual scalar value as part of an expression.
 */
export class Value {
  /** A UUIDv4 unique to this Value. */
  public readonly id = uuidV4();

  /** The kind of the Value */
  public kind: Kind = "default";

  /**
   * Derivative of the expression result with respect to this value.
   * Defaults to 0 and is only calculated when backpropagation is performed.
   */
  public grad = 0;

  /**
   * Calculates the grad of this Value's children.
   */
  protected backwardStep = () => {};

  /**
   * Creates a Value.
   * @param data The scalar value for this Value.
   * @param name A user friendly name for this Value.
   * @param neuronId The id of the Neuron this that generated this Value.
   * @param layerId The id of the Layer this that generated this Value.
   * @param operation The Operation that resulted in this Value.
   * @param children The Values that were part of the operation resulting in this Value.
   */
  constructor(
    public data: number,
    public name: string,
    public neuronId: string = "",
    public layerId: string = "",
    public readonly operation: Operation = "=",
    public readonly children: readonly Value[] = []
  ) {}

  /**
   * Adds this Value to another Value or scalar.
   * @param rhs The Value or scalar to add. Scalars are converted to Values.
   * @returns The resulting Value.
   */
  add(rhs: Value | number): Value {
    const rhsVal =
      typeof rhs === "number" ? new Value(rhs, rhs.toFixed(2)) : rhs;
    const resultName = `${this.name}+${rhsVal.name}`;

    const res = new Value(
      this.data + rhsVal.data,
      resultName,
      this.neuronId,
      this.layerId,
      "+",
      [this, rhsVal]
    );
    res.backwardStep = () => {
      this.grad += 1.0 * res.grad;
      rhsVal.grad += 1.0 * res.grad;
    };

    return res;
  }

  /**
   * Subtracts a Value or scalar from this Value.
   * @param rhs The Value or scalar to subtract. Scalars are converted to Values.
   * @returns The resulting Value.
   */
  subtract(rhs: Value | number): Value {
    const rhsVal =
      typeof rhs === "number" ? new Value(rhs, rhs.toFixed(2)) : rhs;
    const resultName = `${this.name}-${rhsVal.name}`;

    const res = new Value(
      this.data - rhsVal.data,
      resultName,
      this.neuronId,
      this.layerId,
      "-",
      [this, rhsVal]
    );
    res.backwardStep = () => {
      this.grad += 1.0 * res.grad;
      rhsVal.grad += 1.0 * res.grad;
    };

    return res;
  }

  /**
   * Multiplies this Value by another Value or scalar.
   * @param rhs The Value or scalar to multiply by. Scalars are converted to Values.
   * @returns The resulting Value.
   */
  multiply(rhs: Value | number): Value {
    const rhsVal =
      typeof rhs === "number" ? new Value(rhs, rhs.toFixed(2)) : rhs;
    const resultName = `${this.name}*${rhsVal.name}`;

    const res = new Value(
      this.data * rhsVal.data,
      resultName,
      this.neuronId,
      this.layerId,
      "x",
      [this, rhsVal]
    );
    res.backwardStep = () => {
      this.grad += rhsVal.data * res.grad;
      rhsVal.grad += this.data * res.grad;
    };

    return res;
  }

  /**
   * Divides this Value by another Value or scalar.
   * @param rhs The Value or scalar to divide by. Scalars are converted to Values.
   * @returns The resulting Value.
   */
  divide(rhs: Value | number): Value {
    const rhsVal =
      typeof rhs === "number" ? new Value(rhs, rhs.toFixed(2)) : rhs;
    const resultName = `${this.name}/${rhsVal.name}`;
    const res = new Value(
      this.data / rhsVal.data,
      resultName,
      this.neuronId,
      this.layerId,
      "/",
      [this, rhsVal]
    );
    res.backwardStep = () => {
      this.grad += (1 / rhsVal.data) * res.grad;
      rhsVal.grad += -((1 / this.data) * res.grad) / 2;
    };
    return res;
  }

  /**
   * Raises this Value to a power.
   * @param rhs The power.
   * @returns The resulting Value.
   */
  pow(rhs: number): Value {
    const resultName = `pow(${this.name}, ${rhs})`;

    const res = new Value(
      Math.pow(this.data, rhs),
      resultName,
      this.neuronId,
      this.layerId,
      "pow",
      [this]
    );
    res.backwardStep = () => {
      this.grad += rhs * Math.pow(rhs * this.data, rhs - 1) * res.grad;
    };

    return res;
  }

  /**
   * Calculates e raised to the power of this Value.
   * @returns The resulting Value.
   */
  exp(): Value {
    const resultName = `exp(${this.name})`;

    const res = new Value(
      Math.exp(this.data),
      resultName,
      this.neuronId,
      this.layerId,
      "exp",
      [this]
    );
    res.backwardStep = () => {
      this.grad += res.data * res.grad;
    };

    return res;
  }

  /**
   * Calculates the hyperbolic tangent of this Value.
   * @returns The resulting Value.
   */
  tanh() {
    const resultName = `tanh(${this.name})`;
    const res = new Value(
      Math.tanh(this.data),
      resultName,
      this.neuronId,
      this.layerId,
      "tanh",
      [this]
    );

    res.backwardStep = () => {
      this.grad += (1 - Math.pow(res.data, 2)) * res.grad;
    };

    return res;
  }

  /**
   * Negates this Value.
   * @returns The resulting Value.
   */
  negate() {
    return this.multiply(-1);
  }

  /**
   * Changes the name and ids of the Value.
   * This does not create a new Value.
   * @param name The new name.
   * @param neuronId The new neuronId. Unchanged if not set.
   * @param layerId The new layerId. Unchanged if not set.
   * @returns The current Value.
   */
  as(name: string, neuronId?: string, layerId?: string): Value {
    this.name = name;
    this.neuronId = neuronId ?? this.neuronId;
    this.layerId = layerId ?? this.layerId;
    return this;
  }

  /**
   * Propagate derivatives through the entire expression with respect to the calling value.
   *
   * Note that as grad is cumulative you may want to zero the grad values if
   * calling this repeatedly on the same expression.
   * @param zeroGrad Zeros all grad values in the expression before running.
   */
  backward(zeroGrad: boolean = false) {
    const order = topologicalSort(this);

    this.grad = 1;

    if (zeroGrad) {
      order.forEach((value) => (value.grad = 0));
    }

    for (let idx = order.length - 1; idx >= 0; --idx) {
      order[idx].backwardStep();
    }
  }
}

/**
 * Performs a topological sort of an expression.
 * @param value The next value to visit.
 * @param visited Ids of Values that have been visited already in the sort.
 * @param order The sorted order so far.
 * @returns
 */
function topologicalSort(
  value: Value,
  visited: Map<string, Value> = new Map(),
  order: Value[] = []
): Value[] {
  if (!visited.has(value.id)) {
    visited.set(value.id, value);

    for (const prev of value.children) {
      topologicalSort(prev, visited, order);
    }

    order.push(value);
  }

  return order;
}

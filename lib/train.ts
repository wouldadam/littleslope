import { MultiLayerPerceptron } from "./MultiLayerPerceptron";
import { Value } from "./Value";

/**
 * Perform gradient descent training on an MLP.
 * @param mlp The MLP to train.
 * @param inputs The arrays of training inputs.
 * @param expected The arrays of training outputs.
 * @param iterations The number of iterations to perform.
 * @param adjustment The amount to adjust weights by each iteration.
 * @returns The results and loss for the final iteration.
 */
export function gradientDescent(
  mlp: MultiLayerPerceptron,
  inputs: number[][],
  expected: number[][],
  iterations: number,
  adjustment: number
): [Value[][], Value] {
  let results: Value[][] = [];
  let loss = new Value(1, "loss");

  for (let iter = 0; iter < iterations; ++iter) {
    // Forward pass
    results = inputs.map((input) => mlp.call(input));
    const losses = results.flatMap((outputs, expIdx) =>
      outputs.map((output, outIdx) =>
        output.subtract(expected[expIdx][outIdx]).pow(2)
      )
    );
    loss = losses
      .reduce((accum, val) => accum.add(val), new Value(0, "loss"))
      .as("loss");

    // Backward pass
    for (const param of mlp.getParameters()) {
      param.grad = 0;
    }
    loss.backward();

    // Update
    for (const param of mlp.getParameters()) {
      param.data += -adjustment * param.grad;
    }
  }

  return [results, loss];
}

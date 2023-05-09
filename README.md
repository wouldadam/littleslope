# littleslope

[![License](https://img.shields.io/badge/license-BSD_3--Clause-blue.svg?style=for-the-badge)](https://github.com/wouldadam/littleslope/blob/main/LICENCE.md)
[![Build](https://img.shields.io/github/actions/workflow/status/wouldadam/littleslope/main.yml?style=for-the-badge)](https://github.com/wouldadam/littleslope/actions)
[![Vite](https://img.shields.io/badge/Vite--blue.svg?style=social&logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript--blue.svg?style=social&logo=typescript)](https://www.typescriptlang.org/)

A small autograd engine and toy neural network in TypeScript alongside some helpers for visualisation in [visjs](https://visjs.org/).
Heavily inspired by [micrograd](https://github.com/karpathy/micrograd/).

## Documentation

See the API docs [here](https://wouldadam.github.io/littleslope/).

## Examples

See examples [here](https://wouldadam.github.io/littleslope/examples).

## Build

The repo contains a `.devcontainer` configuration that describes a working build/dev env.

```bash
# Install dependencies and create a prod build of the library
yarn
yarn build

# Run a hot-reloading build of the examples
yarn dev

# Build the API docs and examples
yarn build-docs
yarn build-examples
```

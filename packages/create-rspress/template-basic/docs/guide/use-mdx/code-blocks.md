# Code Blocks

You can use the ``` syntax to create code blocks and support custom titles.

## Basic usage

**Input:**

````md
```js
console.log('Hello World');
```

```js title="hello.js"
console.log('Hello World');
```
````

**Output:**

```js
console.log('Hello World');
```

```js title="hello.js"
console.log('Hello World');
```

## Show line numbers

If you want to display line numbers, you can enable the `showLineNumbers` option in the config file:

```ts title="rspress.config.ts"
export default {
  // ...
  markdown: {
    showLineNumbers: true,
  },
};
```

## Wrap code

If you want to wrap long code line by default, you can enable the `defaultWrapCode` option in the config file:

```ts title="rspress.config.ts"
export default {
  // ...
  markdown: {
    defaultWrapCode: true,
  },
};
```

## Line highlighting

You can also apply line highlighting and code block title at the same time, for example:

**Input:**

````md
```js title="hello.js"
console.log('Hello World'); // [\!code highlight]

// [\!code highlight:3]
const a = 1;

console.log(a);

const b = 2;

console.log(b);
```
````

:::warning
The backslash (`\`) in `[\!code highlight]` is for Markdown escaping to display the raw syntax. Do not include it when using this notation in your actual code.
:::

**Output:**

```js title="hello.js"
console.log('Hello World'); // [!code highlight]

// [!code highlight:3]
const a = 1;

console.log(a);

const b = 2;

console.log(b);
```

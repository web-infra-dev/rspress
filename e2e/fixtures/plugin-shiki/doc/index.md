# @rspress/plugin-shiki

<!-- createTransformerDiff -->

```ts
export function foo() {
  console.log('Diff remove'); // [!code --]
  console.log('Diff add'); // [!code ++]
}
```

<!-- createTransformerLineNumber -->

```ts
export function foo() {
  console.log('Line number'); // [!code hl]
}
```

<!-- createTransformerErrorLevel -->

```ts
export function foo() {
  console.log('Error level'); // [!code error]
}
```

<!-- createTransformerFocus -->

```ts
export function foo() {
  console.log('Focus'); // [!code focus]
}
```

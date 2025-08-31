# @rspress/plugin-twoslash

## Extract type

```ts
const hi = 'Hello';
const msg = `${hi}, world`;
//    ^?
```

## Completions

```ts
// @noErrors
console.e;
//       ^|
```

## Highlighting

```ts
function add(a: number, b: number) {
  //     ^^^
  return a + b;
}
```

## Error

```ts
// @noErrorValidation
const str: string = 1;
```

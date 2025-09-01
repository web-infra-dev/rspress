# @rspress/plugin-twoslash

## Extract type

```ts twoslash
const hi = 'Hello';
const msg = `${hi}, world`;
//    ^?
```

## Completions

```ts twoslash
// @noErrors
console.e;
//       ^|
```

## Highlighting

```ts twoslash
function add(a: number, b: number) {
  //     ^^^
  return a + b;
}
```

## Error

```ts twoslash
// @noErrorValidation
const str: string = 1;
```

## Disable twoslash

```ts
const hi = 'Hello';
```

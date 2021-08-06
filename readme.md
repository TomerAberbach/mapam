<h1 align="center">
  mapam
</h1>

<div align="center">
  <a href="https://npmjs.org/package/mapam">
    <img src="https://badgen.now.sh/npm/v/mapam" alt="version" />
  </a>
  <a href="https://github.com/TomerAberbach/mapam/actions">
    <img src="https://github.com/TomerAberbach/mapam/workflows/CI/badge.svg" alt="CI" />
  </a>
  <a href="https://bundlephobia.com/result?p=mapam">
    <img src="https://badgen.net/bundlephobia/minzip/mapam" alt="minzip size" />
  </a>
</div>

<div align="center">
  A bidirectional Map/WeakMap implementation with the same API as an ES6 Map/WeakMap!
</div>

## Features

- **Tiny:** less than 720 bytes minzipped including dependencies!
- **Familiar:** uses the same API as an ES6 Map/WeakMap
- **Compliant:** maintains all the invariants of Map/WeakMap including method
  return values and even iteration order!
- **Correct:** handles [edge cases](#correctness) correctly

## Install

```sh
$ npm i mapam
```

## Huh?

A bidirectional map is like a regular map except it preserves uniqueness of its
values (in addition to its keys) and supports an inverse view, which is another
bidirectional map containing and backed by the same entries, but with reversed
keys and values.

For a weak bidirectional map specifically, its values (in addition to its keys)
must be objects.

## Usage

The API of one side/view of the bidirectional map is identical to the
`Map`/`WeakMap` API. Just use like a normal `Map` or `WeakMap` and call the
`inverse` map to get the other side of the bidirectional map!

```js
import { BiMap, WeakBiMap } from 'mapam'

const biMap = new BiMap()

biMap.set(1, `one`)
biMap.set(2, `two`)
biMap.inverse().set(`three`, 3)

console.log([...biMap])
//=> [ [ 1, 'one' ], [ 2, 'two' ], [ 3, 'three' ] ]

console.log([...biMap.inverse()])
//=> [ [ 'one', 1 ], [ 'two', 2 ], [ 'three', 3 ] ]

console.log(biMap.get(2))
//=> two

console.log(biMap.inverse().get(`two`))
//=> 2

biMap.inverse().delete(`two`)

console.log(biMap.has(2))
//=> false

console.log([...biMap])
//=> [ [ 1, 'one' ], [ 3, 'three' ] ]

try {
  // Throws!
  biMap.set(10, `three`)
} catch (e) {
  console.log(e.message)
  //=> value already bound to another key
}

// Doesn't throw!
// Conveys intention of changing the value associated with the given key
biMap.inverse().set(`three`, 10)

// Also doesn't throw
biMap.set(10, `three`, { force: true })

const weakBiMap = new WeakBiMap()

const a = {}
const b = {}
weakBiMap.set(a, b)

console.log(weakBiMap.get(a) === b)
//=> true

console.log(weakBiMap.inverse().get(b) === a)
//=> true
```

See the
[type definitions](https://github.com/TomerAberbach/mapam/blob/main/src/index.d.ts)
for more documentation.

## Correctness

| Category        | `mapam`            | `bimap@0.0.15` | `bim@1.3.3` | `mnemonist@0.38.3` | `@rimbu/bimap@0.7.2` |
| --------------- | ------------------ | -------------- | ----------- | ------------------ | -------------------- |
| Iteration order | :heavy_check_mark: | :x:            | :x:         | :x:                | :x:                  |
| Negative zero   | :heavy_check_mark: | :x:            | :x:         | :x:                | :x:                  |

### Iteration order

`Map` (and many other "unordered" data structures) allow iteration in insertion
order so it's only logical for a bidirectional map to support iteration in a
logical order like insertion order.

```js
const biMap = new BiMap()

biMap.set(1, `one`)
biMap.set(2, `two`)
biMap.set(3, `three`)
biMap.set(4, `four`)

biMap.inverse().set(`two`, -2)
biMap.delete(3)

console.log([...biMap])

// Correct behavior:
// mapam => [ [ 1, 'one' ], [ -2, 'two' ], [ 4, 'four' ] ]

// Incorrect behaviors:
// bimap@0.0.15 => Doesn't support iteration
// bim@1.3.3 => [ [ 1, 'one' ], [ 4, 'four' ], [ -2, 'two' ] ]
// mnemonist@0.38.3 => [ [ 1, 'one' ], [ 4, 'four' ], [ -2, 'two' ] ]
// @rimbu/bimap@0.7.2 => [ [ 1, 'one' ], [ 4, 'four' ], [ -2, 'two' ] ]
```

### Negative zero

A key in a `Map` can only occur once. But how is the key's uniqueness
determined? JavaScript's `Map` uses the
[`sameValueZero` algorithm](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness#same-value-zero_equality)
when checking if two keys are equal. The algorithm considers +0 and -0 to be
equal, but they are actually two different values due to how
[IEEE floating point numbers](https://www.johndcook.com/blog/2010/06/15/why-computers-have-signed-zero)
work.

This means that `Map` coerces -0 to +0 for its keys, but not for its values. So
if a bidirectional map implementation uses `Map` internally, then it must either
coerce -0 to +0 for its values as well or
[somehow broaden](https://github.com/TomerAberbach/svkc) its keys to support
both -0 and +0.

```js
const biMap = new BiMap()

biMap.set(`negative-zero`, -0)
biMap.set(`zero`, 0)

console.log(
  biMap.get(`negative-zero`),
  biMap.get(`zero`),
  biMap.inverse().get(-0),
  biMap.inverse().get(0),
)

// Correct behavior:
// mapam => -0 0 negative-zero zero

// Incorrect behaviors:
// bimap@0.0.15 => -0 0 negative-zero negative-zero
// bim@1.3.3 => undefined 0 zero zero
// mnemonist@0.38.3 => undefined 0 zero zero
// @rimbu/bimap@0.7.2 => -0 0 negative-zero negative-zero
```

## Contributing

Stars are always welcome!

For bugs and feature requests,
[please create an issue](https://github.com/TomerAberbach/mapam/issues/new).

## License

[Apache 2.0](https://github.com/TomerAberbach/mapam/blob/main/license)

This is not an official Google product.

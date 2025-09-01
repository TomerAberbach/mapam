import { fc, test } from '@fast-check/vitest'
import { SameValueMap, SameValueSet } from 'svkc'
import { expect } from 'vitest'
import { BiMap, WeakBiMap } from './index.js'

const getEntriesArb = <Value>(
  valueArb: fc.Arbitrary<Value>,
): fc.Arbitrary<[Value, Value][]> =>
  fc.array(fc.tuple(valueArb, valueArb), { minLength: 1 })

class SimpleBiMap<Key, Value> extends SameValueMap<Key, Value> {
  public inverse() {
    return new SimpleBiMap(Array.from(this, ([key, value]) => [value, key]))
  }
}

const makeEntriesUnique = <Key, Value>(
  entries: [Key, Value][],
): [Key, Value][] => {
  const keys = new SameValueSet()
  const values = new SameValueSet()
  const uniqueEntries: [Key, Value][] = []

  for (const [key, value] of entries) {
    if (keys.has(key) || values.has(value)) {
      continue
    }

    keys.add(key)
    values.add(value)
    uniqueEntries.push([key, value])
  }

  return uniqueEntries
}

type Ref<Value> = { value: Value }

test.prop([
  getEntriesArb(fc.anything()).chain(entries => {
    const entriesArb = fc.constantFrom(...entries)
    const valuesArb = fc.constantFrom(...entries.flat())

    return fc.tuple(
      fc.oneof(
        fc.constantFrom(null, undefined),
        fc
          .nat({ max: entries.length })
          .map(n => makeEntriesUnique(entries.slice(0, n))),
      ),
      fc.commands(
        [
          fc.constant({
            check: () => true,
            run: (
              model: Ref<SimpleBiMap<unknown, unknown>>,
              real: Ref<BiMap<unknown, unknown>>,
            ) => {
              model.value.clear()
              real.value.clear()
            },
            toString: () => `clear()`,
          }),
          valuesArb.map(key => ({
            check: () => true,
            run: (
              model: Ref<SimpleBiMap<unknown, unknown>>,
              real: Ref<BiMap<unknown, unknown>>,
            ) => expect(real.value.delete(key)).toBe(model.value.delete(key)),
            toString: () => `delete(${fc.stringify(key)})`,
          })),
          valuesArb.map(key => ({
            check: () => true,
            run: (
              model: Ref<SimpleBiMap<unknown, unknown>>,
              real: Ref<BiMap<unknown, unknown>>,
            ) => expect(real.value.get(key)).toBe(model.value.get(key)),
            toString: () => `get(${fc.stringify(key)})`,
          })),
          valuesArb.map(key => ({
            check: () => true,
            run: (
              model: Ref<SimpleBiMap<unknown, unknown>>,
              real: Ref<BiMap<unknown, unknown>>,
            ) => expect(real.value.has(key)).toBe(model.value.has(key)),
            toString: () => `has(${fc.stringify(key)})`,
          })),
          entriesArb.map(([key, value]) => ({
            check: (model: Ref<SimpleBiMap<unknown, unknown>>) => {
              const inverse = model.value.inverse()
              return !inverse.has(value) || Object.is(inverse.get(value), key)
            },
            run: (
              model: Ref<SimpleBiMap<unknown, unknown>>,
              real: Ref<BiMap<unknown, unknown>>,
            ) => {
              model.value.set(key, value)
              expect(real.value.set(key, value)).toBe(real.value)
            },
            toString: () => `set(${fc.stringify(key)}, ${fc.stringify(value)})`,
          })),
          entriesArb.map(([key, value]) => ({
            check: () => true,
            run: (
              model: Ref<SimpleBiMap<unknown, unknown>>,
              real: Ref<BiMap<unknown, unknown>>,
            ) => {
              let entries = [...model.value]
              let filtered = entries.filter(
                ([key1, value1]) =>
                  Object.is(key, key1) || Object.is(value, value1),
              )

              if (filtered.length > 1) {
                entries = entries.filter(entry => !filtered.includes(entry))
                filtered = []
              }

              if (filtered.length > 0) {
                const entry = filtered[0]!
                entry[0] = key
                entry[1] = value
              } else {
                entries.push([key, value])
              }
              model.value = new SimpleBiMap(entries)

              expect(real.value.set(key, value, { force: true })).toBe(
                real.value,
              )
            },
            toString: () =>
              `forceSet(${fc.stringify(key)}, ${fc.stringify(value)})`,
          })),
          fc.constant({
            check: () => true,
            run: (
              model: Ref<SimpleBiMap<unknown, unknown>>,
              real: Ref<BiMap<unknown, unknown>>,
            ) => expect(real.value.size).toBe(model.value.size),
            toString: () => `size()`,
          }),
          fc.constant({
            check: () => true,
            run: (
              model: Ref<SimpleBiMap<unknown, unknown>>,
              real: Ref<BiMap<unknown, unknown>>,
            ) => {
              const modelKeys = model.value.keys()
              const realKeys = real.value.keys()

              expect([...realKeys]).toStrictEqual([...modelKeys])
              expect([...realKeys]).toStrictEqual([...modelKeys])
            },
            toString: () => `keys()`,
          }),
          fc.constant({
            check: () => true,
            run: (
              model: Ref<SimpleBiMap<unknown, unknown>>,
              real: Ref<BiMap<unknown, unknown>>,
            ) => {
              const modelValues = model.value.values()
              const realValues = real.value.values()

              expect([...realValues]).toStrictEqual([...modelValues])
              expect([...realValues]).toStrictEqual([...modelValues])
            },
            toString: () => `values()`,
          }),
          fc.constant({
            check: () => true,
            run: (
              model: Ref<SimpleBiMap<unknown, unknown>>,
              real: Ref<BiMap<unknown, unknown>>,
            ) => {
              const modelEntries = model.value.entries()
              const realEntries = real.value.entries()

              expect([...realEntries]).toStrictEqual([...modelEntries])
              expect([...realEntries]).toStrictEqual([...modelEntries])
            },
            toString: () => `entries()`,
          }),
          fc.constant({
            check: () => true,
            run: (
              model: Ref<SimpleBiMap<unknown, unknown>>,
              real: Ref<BiMap<unknown, unknown>>,
            ) => expect([...real.value]).toStrictEqual([...model.value]),
            toString: () => `iterate()`,
          }),
          fc.constant({
            check: () => true,
            run: (
              model: Ref<SimpleBiMap<unknown, unknown>>,
              real: Ref<BiMap<unknown, unknown>>,
            ) => {
              const modelArgs: unknown[] = []
              // eslint-disable-next-line unicorn/no-array-for-each
              model.value.forEach((value, key) => modelArgs.push([value, key]))

              const realArgs: unknown[] = []
              // eslint-disable-next-line unicorn/no-array-for-each
              real.value.forEach((value, key, map) => {
                realArgs.push([value, key])
                expect(map).toBe(real.value)
              })

              expect(realArgs).toStrictEqual(modelArgs)
            },
            toString: () => `forEach()`,
          }),
          fc.constant({
            check: () => true,
            run: (
              model: Ref<SimpleBiMap<unknown, unknown>>,
              real: Ref<BiMap<unknown, unknown>>,
            ) => {
              model.value = model.value.inverse()
              real.value = real.value.inverse()
            },
            toString: () => `inverse()`,
          }),
        ],
        { maxCommands: 10_000 },
      ),
    )
  }),
])(`BiMap works`, ([entries, commands]) => {
  fc.modelRun(
    () => ({
      model: { value: new SimpleBiMap(entries) },
      real: { value: new BiMap(entries) },
    }),
    commands,
  )
})

test(`BiMap concrete example`, () => {
  const biMap = new BiMap<number, number | string>([
    [1, 2],
    [-0, 3],
    [2, `3`],
  ])

  expect(biMap.has(0)).toBeFalse()
  expect(biMap.get(-0)).toBe(3)
  expect(biMap.inverse().get(3)).toBe(-0)
  expect(biMap.size).toBe(3)
  expect(() => biMap.set(4, 2)).toThrow()

  biMap.set(4, 2, { force: true })

  expect(biMap.size).toBe(3)
  expect([...biMap]).toStrictEqual([
    [4, 2],
    [-0, 3],
    [2, `3`],
  ])

  biMap.set(8, 10)
  biMap.set(2, 2, { force: true })

  expect(biMap.size).toBe(3)
  expect([...biMap]).toStrictEqual([
    [-0, 3],
    [8, 10],
    [2, 2],
  ])
})

test.prop([
  getEntriesArb(fc.object()).chain(entries => {
    const entriesArb = fc.constantFrom(...entries)
    const valuesArb = fc.constantFrom(...entries.flat())

    return fc.tuple(
      fc.oneof(
        fc.constant(null),
        fc.constant(undefined),
        fc
          .nat({ max: entries.length })
          .map(n => makeEntriesUnique(entries.slice(0, n))),
      ),
      fc.commands(
        [
          valuesArb.map(key => ({
            check: () => true,
            run: (
              model: Ref<SimpleBiMap<unknown, unknown>>,
              real: Ref<WeakBiMap<WeakKey, WeakKey>>,
            ) => expect(real.value.delete(key)).toBe(model.value.delete(key)),
            toString: () => `delete(${fc.stringify(key)})`,
          })),
          valuesArb.map(key => ({
            check: () => true,
            run: (
              model: Ref<SimpleBiMap<unknown, unknown>>,
              real: Ref<WeakBiMap<WeakKey, WeakKey>>,
            ) => expect(real.value.get(key)).toBe(model.value.get(key)),
            toString: () => `get(${fc.stringify(key)})`,
          })),
          valuesArb.map(key => ({
            check: () => true,
            run: (
              model: Ref<SimpleBiMap<unknown, unknown>>,
              real: Ref<WeakBiMap<WeakKey, WeakKey>>,
            ) => expect(real.value.has(key)).toBe(model.value.has(key)),
            toString: () => `has(${fc.stringify(key)})`,
          })),
          entriesArb.map(([key, value]) => ({
            check: (model: Ref<SimpleBiMap<unknown, unknown>>) => {
              const inverse = model.value.inverse()
              return !inverse.has(value) || Object.is(inverse.get(value), key)
            },
            run: (
              model: Ref<SimpleBiMap<unknown, unknown>>,
              real: Ref<WeakBiMap<WeakKey, WeakKey>>,
            ) => {
              model.value.set(key, value)
              expect(real.value.set(key, value)).toBe(real.value)
            },
            toString: () => `set(${fc.stringify(key)}, ${fc.stringify(value)})`,
          })),
          entriesArb.map(([key, value]) => ({
            check: () => true,
            run: (
              model: Ref<SimpleBiMap<unknown, unknown>>,
              real: Ref<WeakBiMap<WeakKey, WeakKey>>,
            ) => {
              let entries = [...model.value]
              let filtered = entries.filter(
                ([key1, value1]) =>
                  Object.is(key, key1) || Object.is(value, value1),
              )

              if (filtered.length > 1) {
                entries = entries.filter(entry => !filtered.includes(entry))
                filtered = []
              }

              if (filtered.length > 0) {
                const entry = filtered[0]!
                entry[0] = key
                entry[1] = value
              } else {
                entries.push([key, value])
              }
              model.value = new SimpleBiMap(entries)

              expect(real.value.set(key, value, { force: true })).toBe(
                real.value,
              )
            },
            toString: () =>
              `forceSet(${fc.stringify(key)}, ${fc.stringify(value)})`,
          })),
          fc.constant({
            check: () => true,
            run: (
              model: Ref<SimpleBiMap<unknown, unknown>>,
              real: Ref<WeakBiMap<WeakKey, WeakKey>>,
            ) => {
              model.value = model.value.inverse()
              real.value = real.value.inverse()
            },
            toString: () => `inverse()`,
          }),
        ],
        { maxCommands: 10_000 },
      ),
    )
  }),
])(`WeakBiMap works`, ([entries, commands]) => {
  fc.modelRun(
    () => ({
      model: { value: new SimpleBiMap(entries) },
      real: { value: new WeakBiMap(entries) },
    }),
    commands,
  )
})

test(`WeakBiMap concrete example`, () => {
  const a = {}
  const b = {}
  const c = {}
  const d = {}
  const e = {}
  const f = {}

  const biMap = new WeakBiMap([
    [a, b],
    [c, d],
    [b, e],
  ])

  expect(biMap.get(a)).toBe(b)
  expect(biMap.inverse().get(b)).toBe(a)
  expect(() => biMap.set(f, b)).toThrow()

  biMap.set(f, b, { force: true })

  expect(biMap.get(f)).toBe(b)
  expect(biMap.get(c)).toBe(d)
  expect(biMap.get(b)).toBe(e)

  biMap.set(b, b, { force: true })

  expect(biMap.get(b)).toBe(b)
  expect(biMap.get(c)).toBe(d)
})

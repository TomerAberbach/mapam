/**
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import test from 'ava'
import { fc, testProp } from 'ava-fast-check'
import { SameValueMap, SameValueSet } from 'svkc'
import { BiMap, WeakBiMap } from '../src/index.js'
import toCommands from './helpers/to-commands.js'

const getEntriesArb = valueArb =>
  fc.array(fc.tuple(valueArb, valueArb), { minLength: 1 })

const {
  clearCommand,
  deleteCommand,
  getCommand,
  hasCommand,
  setCommand,
  forceSetCommand,
  sizeCommand,
  keysCommand,
  valuesCommand,
  entriesCommand,
  iterateCommand,
  forEachCommand,
  inverseCommand,
} = toCommands({
  clear(t, model, real) {
    real.value.clear()
    model.value.clear()
  },
  get(t, model, real, key) {
    t.is(real.value.get(key), model.value.get(key))
  },
  has(t, model, real, key) {
    t.is(real.value.has(key), model.value.has(key))
  },
  delete(t, model, real, key) {
    t.is(real.value.delete(key), model.value.delete(key))
  },
  set: {
    check(model, [key, value]) {
      const inverse = model.value.inverse()
      return !inverse.has(value) || Object.is(inverse.get(value), key)
    },
    test(t, model, real, [key, value]) {
      t.is(real.value.set(key, value), real.value)
      model.value.set(key, value)
    },
  },
  forceSet(t, model, real, [key, value]) {
    t.is(real.value.set(key, value, { force: true }), real.value)

    let entries = [...model.value]
    let filtered = entries.filter(
      ([key1, value1]) => Object.is(key, key1) || Object.is(value, value1),
    )

    if (filtered.length > 1) {
      entries = entries.filter(entry => !filtered.includes(entry))
      filtered = []
    }

    if (filtered.length > 0) {
      const entry = filtered[0]
      entry[0] = key
      entry[1] = value
    } else {
      entries.push([key, value])
    }
    model.value = new SimpleBiMap(entries)
  },
  size(t, model, real) {
    t.is(real.size, model.size)
  },
  keys(t, model, real) {
    const realKeys = real.value.keys()
    const modelKeys = model.value.keys()

    t.deepEqual([...realKeys], [...modelKeys])
    t.deepEqual([...realKeys], [...modelKeys])
  },
  values(t, model, real) {
    const realValues = real.value.values()
    const modelValues = model.value.values()

    t.deepEqual([...realValues], [...modelValues])
    t.deepEqual([...realValues], [...modelValues])
  },
  entries(t, model, real) {
    const realEntries = real.value.entries()
    const modelEntries = model.value.entries()

    t.deepEqual([...realEntries], [...modelEntries])
    t.deepEqual([...realEntries], [...modelEntries])
  },
  iterate(t, model, real) {
    t.deepEqual([...real.value], [...model.value])
  },
  forEach(t, model, real) {
    const realArgs = []
    real.value.forEach((value, key, map) => {
      realArgs.push([value, key])
      t.is(map, real.value)
    })

    const modelArgs = []
    model.value.forEach((value, key) => modelArgs.push([value, key]))

    t.deepEqual(realArgs, modelArgs)
  },
  inverse(t, model, real) {
    model.value = model.value.inverse()
    real.value = real.value.inverse()
  },
})

class SimpleBiMap extends SameValueMap {
  inverse() {
    return new SimpleBiMap(Array.from(this, ([key, value]) => [value, key]))
  }
}

const makeEntriesUnique = entries => {
  const keys = new SameValueSet()
  const values = new SameValueSet()
  const uniqueEntries = []

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

testProp(
  `BiMap works`,
  [
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
            fc.constant(clearCommand()),
            valuesArb.map(deleteCommand),
            valuesArb.map(getCommand),
            valuesArb.map(hasCommand),
            entriesArb.map(setCommand),
            entriesArb.map(forceSetCommand),
            fc.constant(sizeCommand()),
            fc.constant(keysCommand()),
            fc.constant(valuesCommand()),
            fc.constant(entriesCommand()),
            fc.constant(iterateCommand()),
            fc.constant(forEachCommand()),
            fc.constant(inverseCommand()),
          ],
          { maxCommands: 10000 },
        ),
      )
    }),
  ],
  (t, [entries, commands]) => {
    fc.modelRun(
      () => ({
        model: { t, model: { value: new SimpleBiMap(entries) } },
        real: { value: new BiMap(entries) },
      }),
      commands,
    )

    t.pass()
  },
)

test(`BiMap concrete example`, t => {
  const biMap = new BiMap([
    [1, 2],
    [-0, 3],
    [2, `3`],
  ])

  t.false(biMap.has(0))
  t.is(biMap.get(-0), 3)
  t.is(biMap.inverse().get(3), -0)
  t.is(biMap.size, 3)
  t.throws(() => biMap.set(4, 2))

  biMap.set(4, 2, { force: true })

  t.is(biMap.size, 3)
  t.deepEqual(
    [...biMap],
    [
      [4, 2],
      [-0, 3],
      [2, `3`],
    ],
  )

  biMap.set(8, 10)
  biMap.set(2, 2, { force: true })

  t.is(biMap.size, 3)
  t.deepEqual(
    [...biMap],
    [
      [-0, 3],
      [8, 10],
      [2, 2],
    ],
  )
})

testProp(
  `WeakBiMap works`,
  [
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
            valuesArb.map(deleteCommand),
            valuesArb.map(getCommand),
            valuesArb.map(hasCommand),
            entriesArb.map(setCommand),
            entriesArb.map(forceSetCommand),
            fc.constant(inverseCommand()),
          ],
          { maxCommands: 10000 },
        ),
      )
    }),
  ],
  (t, [entries, commands]) => {
    fc.modelRun(
      () => ({
        model: {
          t,
          model: { inverse: false, value: new SimpleBiMap(entries) },
        },
        real: { value: new WeakBiMap(entries) },
      }),
      commands,
    )

    t.pass()
  },
)

test(`WeakBiMap concrete example`, t => {
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

  t.is(biMap.get(a), b)
  t.is(biMap.inverse().get(b), a)
  t.throws(() => biMap.set(f, b))

  biMap.set(f, b, { force: true })

  t.is(biMap.get(f), b)
  t.is(biMap.get(c), d)
  t.is(biMap.get(b), e)

  biMap.set(b, b, { force: true })

  t.is(biMap.get(b), b)
  t.is(biMap.get(c), d)
})

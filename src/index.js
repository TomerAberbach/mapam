import { SameValueMap } from 'svkc'

let initializing = false

const mixinCommon = Map =>
  class extends Map {
    constructor(args) {
      super()

      // This map is the inverse of some map that is currently initializing both
      // itself and the inverse map (so no need for this map to initialize
      // itself unless you like infinite recursion)
      if (initializing) {
        return
      }

      initializing = true
      this._initialize()
      initializing = false

      // Map and WeakMap support both undefined and null for not initially
      // populating the map with any entries
      if (args == null) {
        return
      }

      for (const [key, value] of args) {
        this.set(key, value)
      }
    }

    _tryToEnsureCanSet(key, value, { force = false } = {}) {
      // If the given value is not bound to a key or is bound to the given key,
      // then setting this key-value pair will keys and values of the bimap
      // unique, respectively
      if (
        !this._inverse.has(value) ||
        Object.is(this._inverse.get(value), key)
      ) {
        return
      }

      // If we're not willing to force another entry out of the bimap to
      // preserve uniqueness, then we throw
      if (!force) {
        throw new Error(`value already bound to another key`)
      }

      if (this.has(key)) {
        // At this point we know that the map has the given key in its key set
        // and the given value in its value set, but the key and value belong to
        // different entries. There is no logical way to choose one of these
        // entries for preservation (for maintaining insertion order) so we
        // delete both and let the given key and value form a new entry at the
        // end of the map
        this.delete(key)
        this._inverse.delete(value)
      } else {
        // Set the given key-value pair from inverse map's side, turning any
        // subsequent setting operation into a no-op
        this._inverse.set(value, key)
      }
    }

    inverse() {
      return this._inverse
    }
  }

export class BiMap extends mixinCommon(SameValueMap) {
  _initialize() {
    this._inverse = new BiMap()
    this._inverse._inverse = this

    // This set tracks the bimap's insertion order, which can't be deduced from
    // the two maps backing this bimap because setting a key-value pair
    // sometimes requires removing an entry from the inverse map and there isn't
    // a way to insert an entry into a map anywhere but the end of it
    this._entries = new Set()
    this._inverse._entries = this._entries

    this._keyIndex = 0
    this._valueIndex = 1
    this._inverse._keyIndex = 1
    this._inverse._valueIndex = 0
  }

  clear() {
    this._entries.clear()
    super.clear.call(this._inverse)
    super.clear()
  }

  delete(key) {
    const entry = super.get(key)

    if (!entry) {
      return false
    }

    this._entries.delete(entry)
    super.delete.call(this._inverse, entry[this._valueIndex])
    return super.delete(key)
  }

  get(key) {
    const entry = super.get(key)
    return entry && entry[this._valueIndex]
  }

  set(key, value, options) {
    this._tryToEnsureCanSet(key, value, options)

    let entry = super.get(key)

    if (!entry) {
      // The given key isn't bound to any entry. Create the entry and initialize
      // it with the given key
      entry = []
      entry[this._keyIndex] = key

      // Add the new entry to the entries set (which tracks insertion order)
      this._entries.add(entry)

      // Bind the given key to the new entry
      super.set(key, entry)
    } else if (Object.is(entry[this._valueIndex], value)) {
      // The given key and value exactly match the entry already stored
      return this
    } else {
      // The given key is already bound to some value. Remove the binding from
      // that value to the entry in the inverse map
      super.delete.call(this._inverse, entry[this._valueIndex])
    }

    // The entry is defined at this point. Update (or initialize) its value
    entry[this._valueIndex] = value

    // Bind the given value to the entry in the inverse map
    super.set.call(this._inverse, value, entry)

    return this
  }

  *[Symbol.iterator]() {
    yield* this.entries()
  }

  *keys() {
    for (const entry of this._entries) {
      yield entry[this._keyIndex]
    }
  }

  *values() {
    for (const entry of this._entries) {
      yield entry[this._valueIndex]
    }
  }

  *entries() {
    for (const entry of this._entries) {
      yield [entry[this._keyIndex], entry[this._valueIndex]]
    }
  }

  forEach(callbackFn, thisArg) {
    for (const [key, value] of this.entries()) {
      callbackFn.call(thisArg, value, key, this)
    }
  }
}

export class WeakBiMap extends mixinCommon(WeakMap) {
  _initialize() {
    this._inverse = new WeakBiMap()
    this._inverse._inverse = this
  }

  delete(key) {
    if (!this.has(key)) {
      return false
    }

    super.delete.call(this._inverse, this.get(key))
    return super.delete(key)
  }

  set(key, value, options) {
    this._tryToEnsureCanSet(key, value, options)

    super.set.call(this._inverse, value, key)
    return super.set(key, value)
  }
}

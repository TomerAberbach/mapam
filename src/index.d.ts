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

/** Options for setting an entry of a bidirectional map. */
export type BiMapSetOptions = {
  /**
   * Enables setting an entry on the bidirectional map even if its value is
   * already bound to another key. Can result in other entries being removed
   * from the bidirectional map.
   *
   * Defaults to false.
   */
  readonly force?: boolean
}

/**
 * A bidirectional map.
 *
 * It preserves uniqueness of its values (in addition to its keys) and supports
 * an inverse view, which is another bidrectional map containing and backed by
 * the same entries, but with reversed keys and values.
 *
 * The API of one side/view of the bidirectional map is identical to the `Map`
 * API except it exposes a {@link BiMap.inverse} method, which returns the other
 * side/view of the bidirectional map. Operations on either side/view are quick.
 *
 * Unlike `Map`, this class uses the SameValue algorithm instead of the
 * SameValueZero algorithm for determining uniqueness.
 */
export class BiMap<Key, Value> extends Map<Key, Value> {
  /**
   * Sets the given `key`-`value` pair on the bidirectional map.
   *
   * @throws if the given `value` is already bound to another key in the
   * bidirectional map, but {@link BiMapSetOptions.force} is not `true`.
   */
  public set(key: Key, value: Value, options?: BiMapSetOptions): this

  /** Returns the other side/view of the bidirectional map. */
  public inverse(): BiMap<Value, Key>
}

/**
 * A weak bidirectional map.
 *
 * It preserves uniqueness of its values and requires them to be non-primitives
 * (in addition to its keys) and supports an inverse view, which is another weak
 * bidirectional map containing and backed by the same entries, but with
 * reversed keys and values.
 *
 * The API of one side/view of the weak bidirectional map is identical to the
 * `WeakMap` API except it exposes a {@link WeakBiMap.inverse} method, which
 * returns the other side/view of the weak bidirectional map. Operations on
 * either side/view are quick.
 */
export class WeakBiMap<
  Key extends WeakKey,
  Value extends WeakKey,
> extends WeakMap<Key, Value> {
  /**
   * Sets the given `key`-`value` pair on the weak bidirectional map.
   *
   * @throws if the given `value` is already bound to another key in the weak
   * bidirectional map, but {@link BiMapSetOptions.force} is not `true`.
   */
  public set(key: Key, value: Value, options?: BiMapSetOptions): this

  /** Returns the other side/view of the weak bidirectional map. */
  public inverse(): WeakBiMap<Value, Key>
}

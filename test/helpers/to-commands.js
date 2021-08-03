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

import { fc } from 'ava-fast-check'

const toCommands = description =>
  Object.fromEntries(
    Object.entries(description).map(([name, test]) => {
      let check
      ;({ check, test } =
        typeof test === `function` ? { check: () => true, test } : test)

      return [
        `${name}Command`,
        (...args) => ({
          check: ({ model }) => check(model, ...args),
          run: ({ t, model }, real) => test(t, model, real, ...args),
          toString: () => `${name}(${args.map(fc.stringify).join(`, `)})`,
        }),
      ]
    }),
  )

export default toCommands

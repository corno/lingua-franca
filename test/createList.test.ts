// tslint:disable: no-console no-unused-expression

import { assert } from "chai"
import { createList } from "../src/create/createList"

describe("createList", () => {
    it("basic operations", () => {
        const list = createList<number>(x => {
            x.push(42)
        })
        assert.deepEqual(list.map(x => x), [ 42 ] )
    })
})

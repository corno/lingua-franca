// tslint:disable: no-console no-unused-expression

import { assert } from "chai"
import { createList } from "../src/implementation/list"

describe("createList", () => {
    it("basic operations", () => {
        const list = createList<number>(x => {
            x.builder.push({element: 42})
        })
        assert.deepEqual(list.map({ callback: x => x.element }), [42])
    })
})

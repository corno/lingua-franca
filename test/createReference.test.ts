// tslint:disable: no-console no-unused-expression

import { assert } from "chai"
import { createDictionary } from "../src/create/createDirectory"
import { createResolvedReference } from "../src/create/createInstantResolveReference"
import { SimpleResolveReporter } from "../src/SimpleResolveReporter"

describe("createReference", () => {
    it("basic operations", () => {
        const rr = new SimpleResolveReporter(
            (_dependent, _message) => {
                //console.log("message")
            },
            _message => {
                //console.log("message")
            }
        )
        const dict = createDictionary<number>("FUBAR", rr, x => {
            x.add("A", 5)
        })
        const ref = createResolvedReference("X", "A_KEY", dict, rr)
        assert.isNull(ref.value)
        const ref2 = createResolvedReference("X", "A", dict, rr)
        assert.strictEqual(ref2.value, 5)
    })
})

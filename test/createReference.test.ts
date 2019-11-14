// tslint:disable: no-console no-unused-expression

import { assert } from "chai"
import { createDictionary } from "../src/createDirectory"
import { createReference } from "../src/createReference"
import { SimpleResolveReporter } from "../src/SimpleResolveReporter"

describe("createReference", () => {
    it("basic operations", () => {
        const rr = new SimpleResolveReporter((_dependent, _message) => {
            //console.log("message")
        })
        const dict = createDictionary<number>("FUBAR", rr, x => {
            x.add("A", 5)
        })
        const ref = createReference("X", "A_KEY", dict, rr)
        assert.isNull(ref.value)
        const ref2 = createReference("X", "A", dict, rr)
        assert.strictEqual(ref2.value, 5)
    })
})

import { Reference } from "lingua-franca";
import { IUnsure } from "./IUnsure";

export interface IIntermediateReference<ReferencedType>
  extends Reference<ReferencedType>,
    IUnsure<ReferencedType> {}

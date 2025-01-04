import MessageProcessor from "sap/ui/core/message/MessageProcessor";
import PropertyBinding from "sap/ui/model/PropertyBinding";
import SimpleType from "sap/ui/model/SimpleType";

export interface BindingTarget<T> {
  name: string;
  path: string;
  processor?: MessageProcessor;
  bindingType?: SimpleType;
  binding: Nullable<PropertyBinding>;
  data: T;
}

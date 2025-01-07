import type { EdmType } from "sap/ui/export/library";

export interface ExcelColumn {
  label: string;
  property: string;
  type: EdmType;
  delimiter?: boolean;
  scale?: number;
}

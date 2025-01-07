import isString from "lodash.isstring";
import UI5Date from "sap/ui/core/date/UI5Date";
import DateFormat from "sap/ui/core/format/DateFormat";

class Formatter {
  public toDate(value: unknown, pattern: string = "yyyyMMdd") {
    if (!isString(value) || !value) return "";

    return DateFormat.getDateInstance({ pattern }).parse(value);
  }

  public formatDate(value: any, pattern: string = "yyyyMMdd") {
    if (!value) return "";

    return DateFormat.getDateInstance({ pattern }).format(new Date(value));
  }

  public transformDate(value: unknown, source = "yyyyMMddHHmmss", target = "dd/MM/yyyy HH:mm:ss") {
    if (!isString(value) || !value) return "";

    const valueAsDate = DateFormat.getDateInstance({
      pattern: source,
    }).parse(value);

    return this.formatDate(valueAsDate, target);
  }

  public now(pattern: string = "yyyy-MM-dd") {
    return DateFormat.getDateInstance({ pattern }).format(UI5Date.getInstance());
  }
}

export default new Formatter();

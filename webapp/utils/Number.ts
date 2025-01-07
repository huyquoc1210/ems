import toNumber from "lodash.tonumber";
import isFinite from "lodash.isfinite";

class Numeric {
  public toNumber(value: unknown) {
    const valueAsNumber = toNumber(value);

    return isFinite(valueAsNumber) ? valueAsNumber : 0;
  }
}

export default new Numeric();

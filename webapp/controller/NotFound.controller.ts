import BaseController from "./Base.controller";

/**
 * @namespace sphinxjsc.com.ems.controller
 */
export default class NotFound extends BaseController {
  public override onInit(): void {}

  public onPressed() {
    this.getRouter().navTo("RouteMain");
  }
}

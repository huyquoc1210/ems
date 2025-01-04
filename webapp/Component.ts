import BaseComponent from "sap/ui/core/UIComponent";
import { createDeviceModel } from "./model/models";
import JSONModel from "sap/ui/model/json/JSONModel";
import Device from "sap/ui/Device";
import Control from "sap/ui/core/Control";
import View from "sap/ui/core/mvc/View";

/**
 * @namespace sphinxjsc.com.ems
 */
export default class Component extends BaseComponent {
  public static metadata = {
    manifest: "json",
    interfaces: ["sap.ui.core.IAsyncContentCreation"],
  };

  public init(): void {
    // call the base component's init function
    super.init();

    // set the device model
    this.setModel(createDeviceModel(), "device");

    this.setModel(new JSONModel({}), "global");

    // enable routing
    this.getRouter().initialize();
  }

  public override createContent(): Control | Promise<Control | null> | null {
    const appView = View.create({
      viewName: "sphinxjsc.com.ems.view.App",
      type: "XML",
      viewData: { component: this },
    });

    appView
      .then((view) => {
        view.addStyleClass(this.getContentDensityClass());
      })
      .catch((error) => {
        console.log(error);
      });

    return appView;
  }

  public getContentDensityClass(): string {
    return Device.support.touch ? "sapUiSizeCozy" : "sapUiSizeCompact";
  }
}

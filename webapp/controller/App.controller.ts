import type View from "sap/ui/core/mvc/View";
import Base from "./Base.controller";
import JSONModel from "sap/ui/model/json/JSONModel";

/**
 * @namespace sphinxjsc.com.ems.controller
 */
export default class App extends Base {
  private view: View;

  /*eslint-disable @typescript-eslint/no-empty-function*/
  public override onInit(): void {
    this.view = <View>this.getView();

    const busyDelay = this.view.getBusyIndicatorDelay();

    this.setModel(
      new JSONModel({
        busy: true,
        delay: 0,
      }),
      "appView"
    );

    const metadataLoadedHandler = (isFailed: boolean) => {
      const viewModel = this.getModel("appView");

      viewModel.setProperty("/busy", false);
      viewModel.setProperty("/delay", busyDelay);
    };

    // disable busy indication when the metadata is loaded and in case of errors
    this.getComponentModel()
      .metadataLoaded()
      .then(metadataLoadedHandler.bind(this, false))
      .catch((error) => {
        console.log(error);
      });

    this.getComponentModel().attachMetadataFailed(metadataLoadedHandler.bind(this, true));

    // apply content density mode to root view
    this.view.addStyleClass(this.getComponent().getContentDensityClass());
  }
}

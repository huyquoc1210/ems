import Dialog from "sap/m/Dialog";
import InputBase from "sap/m/InputBase";
import type Event from "sap/ui/base/Event";
import JSONModel from "sap/ui/model/json/JSONModel";
import Base from "./Base.controller";
import View from "sap/ui/core/mvc/View";
import Controller from "sap/ui/core/mvc/Controller";
import Control from "sap/ui/core/Control";

/**
 * @namespace sphinxjsc.com.ems.controller
 */
export default class Main extends Controller {
  private view: View;

  // Fragments
  private createRowDialog: Dialog;
  private editRowDialog: Dialog;
  private rowDetailDialog: Dialog;

  public override onInit(): void {
    this.view = <View>this.getView();
    this.getView()?.setModel(new JSONModel({}), "form");

    this.getView()?.setModel(
      new JSONModel({
        busy: true,
        delay: 0,
        displayMode: true,
        currency: "VND",
        headerExpanded: true,
      }),
      "view"
    );

    this.getView()?.setModel(
      new JSONModel({
        Gender: [
          { key: "Nam", text: "Nam" },
          { key: "Nữ", text: "Nữ" },
        ],
      }),
      "master"
    );
  }

  public async onOpenCreateRow() {
    if (!this.createRowDialog) {
      this.createRowDialog = (await this.loadFragment({
        name: "sphinxjsc.com.ems.view.fragments.Create",
      })) as Dialog;
    }

    this.getView()?.addDependent(this.createRowDialog);

    this.createRowDialog.open();
  }

  public onCloseCreateRow() {
    this.createRowDialog?.close();
  }

  public onChangeValue(event: Event) {
    try {
      const source = event.getSource<InputBase>();

      if (source.getVisible()) {
        this.validateControl(source);
      }
    } catch (error) {
      console.log(error);
    }
  }

  public getBindingTarget(source: Control) {}

  private validateControl(source: Control) {
    if (!source.getVisible()) {
      return false;
    }

    let isError = false;
  }
}

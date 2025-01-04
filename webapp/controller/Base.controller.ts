import Control from "sap/ui/core/Control";
import UI5Element from "sap/ui/core/Element";
import Controller from "sap/ui/core/mvc/Controller";
import JSONModel from "sap/ui/model/json/JSONModel";
import Model from "sap/ui/model/Model";
import type Component from "../Component";
import View from "sap/ui/core/mvc/View";
import syncStyleClass from "sap/ui/core/syncStyleClass";

export default class Base extends Controller {
  public getControlById<T = UI5Element>(id: string) {
    return this.getView()?.byId(id) as T;
  }

  public setModel(model: Model, name?: string) {
    this.getView()?.setModel(model, name);
  }

  public getModel<T = JSONModel>(name: string) {
    return this.getView()?.getModel(name) as T;
  }

  public attachControl(control: Control) {
    const view = <View>this.getView();

    const styleClass = this.getComponent().getContentDensityClass();

    syncStyleClass(styleClass, view, control);

    view.addDependent(control);
  }

  protected getComponent() {
    return this.getOwnerComponent() as Component;
  }

  protected async loadView<T extends Control>(viewName: string) {
    const fragment = await (<Promise<T>>this.loadFragment({
      name: `sphinxjsc.com.ems.view.fragments.${viewName}`,
    }));
    this.attachControl(fragment);
    return fragment;
  }
}

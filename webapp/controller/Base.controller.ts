import type ComboBox from "sap/m/ComboBox";
import type Input from "sap/m/Input";
import type InputBase from "sap/m/InputBase";
import type MultiInput from "sap/m/MultiInput";
import type Component from "../Component";
import type Control from "sap/ui/core/Control";
import type UI5Element from "sap/ui/core/Element";
import Controller from "sap/ui/core/mvc/Controller";
import type View from "sap/ui/core/mvc/View";
import syncStyleClass from "sap/ui/core/syncStyleClass";
import JSONModel from "sap/ui/model/json/JSONModel";
import Model from "sap/ui/model/Model";
import type PropertyBinding from "sap/ui/model/PropertyBinding";
import type { Dict } from "sphinxjsc/com/ems/types/utlis";
import type { BindingTarget } from "sphinxjsc/com/ems/types/controls";
import type SimpleType from "sap/ui/model/SimpleType";
import Message from "sap/ui/core/message/Message";
import type ODataModel from "sap/ui/model/odata/v2/ODataModel";
import UIComponent from "sap/ui/core/UIComponent";
import Formatter from "sphinxjsc/com/ems/utils/Formatter";

/**
 * @namespace sphinxjsc.com.ems.controller
 */
export default class Base extends Controller {
  public controlTypes: string[] = [
    "sap.m.Input",
    "sap.m.ComboBox",
    "sap.m.Select",
    "sap.m.MultiComboBox",
    "sap.m.MultiInput",
    "sap.m.DatePicker",
  ];

  public formatter = Formatter;

  protected getRouter() {
    return UIComponent.getRouterFor(this);
  }

  public getControlById<T = UI5Element>(id: string) {
    return this.getView()?.byId(id) as T;
  }

  public getModel<T = JSONModel>(name?: string) {
    return this.getView()?.getModel(name) as T;
  }

  public setModel(model: Model, name?: string) {
    this.getView()?.setModel(model, name);
  }

  public getControlId<T = string>(control: UI5Element): T;
  // eslint-disable-next-line no-dupe-class-members
  public getControlId<T = string | null>(control?: UI5Element): T;
  // eslint-disable-next-line no-dupe-class-members
  public getControlId<T = string | null>(control?: UI5Element) {
    if (!control) return null;
    return this.getView()?.getLocalId(control.getId()) as T;
  }

  protected getBindingTarget<T extends Dict>(source: Control) {
    let binding: PropertyBinding | null = null;

    if (source.isA<Input | MultiInput>("sap.m.Input")) {
      if (source.isA<MultiInput>("sap.m.MultiInput")) {
        binding = <PropertyBinding>source.getBinding("tokens");
      } else {
        binding = <PropertyBinding>source.getBinding("value");
      }
    } else if (source.isA<ComboBox>("sap.m.ComboBox")) {
      binding = <PropertyBinding>source.getBinding("selectedKey");
    } else if (source.isA("sap.m.DatePicker")) {
      binding = <PropertyBinding>source.getBinding("value");
    }

    const context = binding?.getContext();

    const value: BindingTarget<T> = {
      name: binding?.getPath() ?? "",
      path: context?.getPath() ?? "",
      processor: context?.getModel(),
      bindingType: <SimpleType>binding?.getType(),
      data: context?.getObject() as T,
      binding,
      get target() {
        const path = this.path;
        const name = this.name;
        return `${path}${path === "/" ? "" : "/"}${name}`;
      },
    };

    return value;
  }

  protected getMetadataLoaded() {
    return this.getComponentModel().metadataLoaded();
  }

  protected getControlsByFieldGroup<T extends Control>(props: {
    control?: Control;
    groupId: string | string[];
    visibility?: "all" | "visible";
    types?: string[];
  }) {
    const { control, groupId, visibility, types } = props;

    return control?.getControlsByFieldGroupId(groupId).filter((control) => {
      const hasGroup = control.checkFieldGroupIds(groupId);

      const isInput = control.isA<InputBase>(types || this.controlTypes);

      const isVisible = visibility === "visible" ? control.getVisible() : true;

      return hasGroup && isInput && isVisible;
    }) as T[];
  }

  protected getComponent() {
    return this.getOwnerComponent() as Component;
  }

  public attachControl(control: Control) {
    const view = <View>this.getView();

    const styleClass = this.getComponent().getContentDensityClass();

    syncStyleClass(styleClass, view, control);

    view.addDependent(control);
  }

  protected async loadView<T extends Control>(viewName: string) {
    const fragment = <Promise<T>>this.loadFragment({
      name: `sphinxjsc.com.ems.view.fragments.${viewName}`,
    });

    fragment
      .then((control) => {
        this.attachControl(control);
      })
      .catch((error) => {
        console.log(error);
      });

    return fragment;
  }

  protected getMessageManager() {
    return this.getComponent().getMessageManager();
  }

  protected addMessage(message: ConstructorParameters<typeof Message>[0]) {
    this.getMessageManager().addMessages(new Message(message));
  }

  protected getComponentModel<T = ODataModel>(name?: string) {
    return this.getOwnerComponent()?.getModel(name) as T;
  }
}

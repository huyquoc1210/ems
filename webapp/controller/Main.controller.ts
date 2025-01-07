import type Button from "sap/m/Button";
import type { Button$PressEvent } from "sap/m/Button";
import type ComboBox from "sap/m/ComboBox";
import DatePicker from "sap/m/DatePicker";
import Dialog, { type Dialog$AfterCloseEvent } from "sap/m/Dialog";
import type Input from "sap/m/Input";
import type InputBase from "sap/m/InputBase";
import MessageToast from "sap/m/MessageToast";
import type Event from "sap/ui/base/Event";
import type Message from "sap/ui/core/message/Message";
import type Messaging from "sap/ui/core/Messaging";
import View from "sap/ui/core/mvc/View";
import JSONModel from "sap/ui/model/json/JSONModel";
import type ODataModel from "sap/ui/model/odata/v2/ODataModel";
import type { ODataError, ODataResponse } from "sphinxjsc/com/ems/types/odata";
import type { EmployeeItem } from "sphinxjsc/com/ems/types/pages/main";
import Numeric from "sphinxjsc/com/ems/utils/Number";
import Base from "./Base.controller";

/**
 * @namespace sphinxjsc.com.ems.controller
 */
export default class Main extends Base {
  private view: View;

  // Fragments
  private createRowDialog: Dialog;
  private editRowDialog: Dialog;
  private rowDetailDialog: Dialog;

  // Messaging
  private MessageManager: Messaging;

  public override onInit(): void {
    this.view = <View>this.getView();

    this.setModel(new JSONModel({}), "form");

    this.setModel(
      new JSONModel({
        rows: [],
        selectedRow: [],
        selectedIndices: [],
        columns: {},
        busy: false,
      }),
      "table"
    );

    this.setModel(
      new JSONModel({
        busy: true,
        delay: 0,
        displayMode: true,
        currency: "VND",
        headerExpanded: true,
      }),
      "view"
    );

    this.setModel(
      new JSONModel({
        Gender: [
          { key: "Nam", text: "Nam" },
          { key: "Nữ", text: "Nữ" },
        ],
      }),
      "master"
    );
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

  public onCreateRow(event: Button$PressEvent) {
    const control = event.getSource<Button>();

    const dialog = <Dialog>control.getParent();

    const oDataModel = this.getModel<ODataModel>();

    const inputs = this.getControlsByFieldGroup<InputBase>({
      control: this.createRowDialog,
      groupId: "FormField",
      visibility: "visible",
    });

    const isValid = this.validateControls(inputs);

    if (!isValid) {
      return;
    }

    this.clearErrors();

    const value = <EmployeeItem>this.getModel("form").getData();

    dialog.setBusy(true);

    new Promise((resolve, reject) => {
      oDataModel.create(
        "/EmployeeSet",
        {
          Fullname: value.Fullname,
          Gender: value.Gender,
          StartDate: value.StartDate,
          Contracttype: value.Contracttype,
          Birthdate: value.Birthdate,
          Address: value.Address,
          Phone: value.Phone,
          Plans: value.Plans,
          Salary: Numeric.toNumber(value.Salary),
        },
        { success: resolve, error: reject }
      );
    })
      .then(() => {
        MessageToast.show("Row was successfully created");
        this.onGetData();
      })
      .catch(() => {
        MessageToast.show("An error occurred, please try again later");
      })
      .finally(() => {
        dialog.setBusy(false);

        this.onCloseCreateRow();
      });
  }

  public onAfterCloseCreate(event: Dialog$AfterCloseEvent) {
    const control = event.getSource();

    control.unbindElement("form");

    this.clearErrors();
    this.getModel("form").setData({});
  }

  public async onOpenCreateRow() {
    if (!this.createRowDialog) {
      this.createRowDialog = await this.loadView("Create");
    }

    this.createRowDialog.bindElement({
      path: "/",
      model: "form",
    });

    this.createRowDialog.open();
  }

  private validateControls(controls: InputBase[]) {
    let isValid = false;
    let isError = false;

    controls.forEach((control) => {
      isError = this.validateControl(control);
      isValid = isValid || isError;
    });

    return !isValid;
  }

  private validateControl(source: InputBase): boolean {
    if (!source.getVisible()) {
      return false;
    }

    let isError = false;

    const { target, bindingType, processor } = this.getBindingTarget(source);

    if (!target) {
      return false;
    }

    const isRequired = source.getRequired();
    const label = source.getTooltip_Text() || "";

    this.removeMessage(target);
    source.setValueState("None");
    source.setValueStateText("");

    let requiredError = false;
    let outOfRangeError = false;
    let value: string = "";

    if (source.isA<Input>("sap.m.Input")) {
      value = source.getValue();
      if (!value && isRequired) {
        requiredError = true;
      }
    } else if (source.isA<ComboBox>("sap.m.ComboBox")) {
      value = source.getSelectedKey();
      const input = source.getValue();

      if (!value && input) {
        outOfRangeError = true;
      } else if ((!value || !input) && isRequired) {
        requiredError = true;
      }
    } else if (source.isA<DatePicker>("sap.m.DatePicker")) {
      value = source.getValue();

      if (!value && isRequired) {
        requiredError = true;
      } else if (value && !source.isValidValue()) {
        outOfRangeError = true;
      }
    }

    if (requiredError) {
      this.addMessage({
        message: "Required",
        type: "Error",
        additionalText: label,
        target,
        processor,
      });

      isError = true;
    } else if (outOfRangeError) {
      this.addMessage({
        message: "Required",
        type: "Error",
        additionalText: label,
        target,
        processor,
      });

      isError = true;
    } else if (bindingType) {
      try {
        void bindingType.validateValue(value);
      } catch (error) {
        const { message } = <Error>error;
        this.addMessage({
          message,
          type: "Error",
          additionalText: label,
          target,
          processor,
        });

        isError = true;
      }
    }

    return isError;
  }

  // #region Busy state
  private setTableBusy(isBusy: boolean) {
    this.getModel("table").setProperty("/busy", isBusy);
  }

  // #endregion

  // console.log(this.getOwnerComponent()?.getModel().read('/EmployeeSet',{success:(data) =>{
  //   console.log(data);
  // }}));

  private onGetData() {
    const oDataModel = this.getComponentModel();

    const tableModel = this.getModel("table");

    this.setTableBusy(true);

    oDataModel.read("/EmployeeSet", {
      success: (data: ODataResponse<EmployeeItem[]>) => {
        tableModel.setProperty("/rows", data.results);
        this.setTableBusy(false);
      },
      error: (error: ODataError) => {
        console.log(error);
        this.setTableBusy(false);
      },
    });
  }

  // #region Messaging
  private getMessages() {
    return <Message[]>this.MessageManager.getMessageModel().getData();
  }

  private removeMessage(target: string) {
    const message = this.getMessages();

    message.forEach((message) => {
      if (message.getTargets().includes(target)) {
        this.MessageManager.removeMessages(message);
      }
    });
  }

  private clearErrors() {
    this.MessageManager.removeAllMessages();
  }
  // #endregion
}

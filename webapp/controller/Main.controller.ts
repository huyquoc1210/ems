import xorBy from "lodash.xorby";
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
import type View from "sap/ui/core/mvc/View";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import type { ODataError, ODataResponse } from "sphinxjsc/com/ems/types/odata";
import type { EmployeeItem } from "sphinxjsc/com/ems/types/pages/main";
import Numeric from "sphinxjsc/com/ems/utils/Number";
import Base from "./Base.controller";
import type { Route$MatchedEvent } from "sap/ui/core/routing/Route";
import type { Table$RowSelectionChangeEvent } from "sap/ui/table/Table";
import type Table from "sap/ui/table/Table";
import type Label from "sap/m/Label";
import { EdmType } from "sap/ui/export/library";
import type { ExcelColumn } from "sphinxjsc/com/ems/types/export";
import type { Dict } from "sphinxjsc/com/ems/types/utlis";
import Spreadsheet from "sap/ui/export/Spreadsheet";
import type Router from "sap/ui/core/routing/Router";
import type { ObjectIdentifier$TitlePressEvent } from "sap/m/ObjectIdentifier";
import type Context from "sap/ui/model/Context";
import type { RowActionItem$PressEvent } from "sap/ui/table/RowActionItem";
import type Row from "sap/ui/table/Row";

/**
 * @namespace sphinxjsc.com.ems.controller
 */
export default class Main extends Base {
  private view: View;
  private router: Router;
  private table: Table;

  // Fragments
  private createRowDialog: Dialog;
  private editRowDialog: Dialog;
  private rowDetailDialog: Dialog;

  // Messaging
  private MessageManager: Messaging;

  public override onInit(): void {
    this.view = <View>this.getView();
    this.router = this.getRouter();

    this.table = this.getControlById("table");

    // Messaging
    this.MessageManager = this.getMessageManager();

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

    this.router.getRoute("RouteMain")?.attachMatched(this.onObjectMatched, this);
  }

  private onObjectMatched = (event: Route$MatchedEvent) => {
    this.getMetadataLoaded()
      .then(() => {
        this.onGetData();
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        this.setViewBusy(false);
      });
  };

  public async onExportExcel() {
    const binding = <EmployeeItem[]>this.getModel("table").getProperty("/rows");

    if (!binding.length) {
      MessageToast.show("No data to export.");
      return;
    }

    const dataSource = binding.map((item) => {
      return Object.keys(item).reduce<Dict>((acc, key) => {
        const value = item[key as keyof EmployeeItem];

        switch (key) {
          case "__metadata": {
            break;
          }
          case "StartDate":
          case "Birthdate": {
            acc[key] = this.formatter.toDate(value, "dd.MM.yyyy");
            break;
          }
          case "Salary": {
            acc[key] = Numeric.toNumber(value);
            break;
          }
          default: {
            acc[key] = value;
            break;
          }
        }

        return acc;
      }, {});
    });

    const columns = this.table.getColumns().map<ExcelColumn>((column) => {
      const columnId = this.getControlId(column);
      const label = (<Label>column.getLabel()).getText();
      const width = column.getWidth();

      switch (columnId) {
        case "StartDate":
        case "Birthdate": {
          return {
            label,
            property: columnId,
            type: EdmType.Date,
            width,
          };
        }
        case "Salary": {
          return {
            label,
            property: columnId,
            type: EdmType.Number,
            delimiter: true,
            scale: 0,
            width,
          };
        }
        default: {
          return {
            label,
            property: columnId,
            type: EdmType.String,
            width,
          };
        }
      }
    });

    const sheet = new Spreadsheet({
      workbook: {
        columns,
        hierarchyLevel: "Level",
        context: {
          sheetName: "Employee",
        },
      },
      dataSource,
      fileName: `Employee_Export_${this.formatter.now()}`,
      worker: true,
    });

    try {
      await sheet.build();
    } catch (error) {
      MessageToast.show("An error occurred, please try again later");
    } finally {
      sheet.destroy();
    }
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

  private setViewBusy(isBusy: boolean) {
    this.getModel("table").setProperty("/busy", isBusy);
  }

  public onRowSelectionChange(event: Table$RowSelectionChangeEvent) {
    const tableModel = this.getModel("table");
    const rows = <EmployeeItem[]>tableModel.getProperty("/rows");

    const prevSelectedRows = <EmployeeItem[]>tableModel.getProperty("/selectedRows");
    const selectedRow = <EmployeeItem>event.getParameter("rowContext")?.getObject();
    const selectAll = event.getParameter("selectAll");
    const indices = this.table.getSelectedIndices();

    tableModel.setProperty("/selectedIndices", [...indices]);

    if (selectAll) {
      tableModel.setProperty("/selectedRows", rows);
    } else if (!selectedRow || !indices.length) {
      tableModel.setProperty("/selectedRows", []);
    } else {
      // const nextRows = xorBy(prevSelectedRows, [selectedRow], (item) => item.Employeeid); // MultiToggle
      const nextRows = xorBy(prevSelectedRows, [selectedRow], (item) => item.Employeeid).slice(-1); // Single

      tableModel.setProperty("/selectedRows", nextRows);
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

  public async onOpenRowDetail(event: ObjectIdentifier$TitlePressEvent) {
    const control = event.getSource();

    if (!this.rowDetailDialog) {
      this.rowDetailDialog = await this.loadView("Detail");
    }

    const context = <Context>control.getBindingContext("table");
    const path = context.getPath();

    this.rowDetailDialog.bindElement({
      path: path,
      model: "table",
    });

    this.rowDetailDialog.open();
  }

  public onCloseRowDetail() {
    this.rowDetailDialog?.close();
  }

  public onAfterCloseRowDetail(event: Dialog$AfterCloseEvent) {
    const control = event.getSource();

    control.unbindElement("table");
  }

  // Edit
  public async onOpenEditRow(event: RowActionItem$PressEvent) {
    const formModel = this.getModel("form");

    const row = <Row>event.getParameter("row");
    const rowValue = <EmployeeItem>row.getBindingContext("table")?.getObject();

    formModel.setData(rowValue);

    if (!this.editRowDialog) {
      this.editRowDialog = await this.loadView("Edit");
    }

    this.editRowDialog.bindElement({
      path: "/",
      model: "form",
    });

    this.editRowDialog.open();
  }

  public onCloseRowEdit() {
    this.editRowDialog?.close();
  }

  public onAfterCloseRowEdit(event: Dialog$AfterCloseEvent) {
    const control = event.getSource();

    control.unbindElement("form");

    this.clearErrors();
    this.getModel("form").setData({});
  }

  public onEditRow(event: Button$PressEvent) {
    const control = event.getSource();
    const dialog = <Dialog>control.getParent();

    const oDataModel = this.getModel<ODataModel>();

    const inputs = this.getControlsByFieldGroup<InputBase>({
      control: this.editRowDialog,
      groupId: "FormField",
      visibility: "visible",
    });

    const isValid = this.validateControls(inputs);

    if (!isValid) {
      return;
    }

    this.clearErrors();

    const value = <EmployeeItem>this.getModel("form").getData();

    const key = oDataModel.createKey("/EmployeeSet", value);

    dialog.setBusy(true);

    new Promise((resolve, reject) => {
      oDataModel.update(
        key,
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
        MessageToast.show("Row was successfully Edit");
        this.onGetData();
      })
      .catch(() => {
        MessageToast.show("An error occurred, please try again later");
      })
      .finally(() => {
        dialog.setBusy(false);

        this.onCloseRowEdit();
      });
  }

  // public onDeleteRow(event: Button$PressEvent) {
  //   const oDataModel = this.getModel<ODataModel>();

  //   const row =

  // }

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

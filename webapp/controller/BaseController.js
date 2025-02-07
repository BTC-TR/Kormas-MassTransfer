sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sap/ui/core/mvc/Controller",
    "com/kormas/uretimdentoplutransfer/model/models",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (
    ManagedObject,
    Controller,
    models,
    Filter,
    FilterOperator
) {
    "use strict";

    return Controller.extend("com.kormas.uretimdentoplutransfer.controller.BaseController", {
        getRouter: function () {
            return sap.ui.core.UIComponent.getRouterFor(this);
        },

        /**
         * Convenience method for getting the view model by name.
         * @public
         * @param {string} [sName] the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel: function (sName) {
            return this.getView().getModel(sName);
        },

        /**
         * Convenience method for setting the view model.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        /**
         * Getter for the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        _callFunction: async function (
            sEntity,
            sMethod,
            oDataModel,
            oURLParameters
        ) {
            return new Promise((fnResolve, fnReject) => {
                sap.ui.core.BusyIndicator.show();
                const mParameters = {
                    method: sMethod,
                    urlParameters: oURLParameters,
                    success: fnResolve,
                    error: fnReject,
                };
                oDataModel.callFunction(sEntity, mParameters);
            });
        },

        _readMultiData: async function (entitySet, filters, oDataModel) {
            return new Promise(function (resolve, reject) {
                sap.ui.core.BusyIndicator.show();
                const options = {
                    filters: filters,
                    success: resolve,
                    error: reject,
                };
                oDataModel.read(entitySet, options);
            });
        },

        _readData: async function (sPath, oDataModel) {
            return new Promise(function (resolve, reject) {
                sap.ui.core.BusyIndicator.show();
                const options = {
                    success: resolve,
                    error: reject,
                };
                oDataModel.read(sPath, options);
            });
        },

        _createData: async function (sEntitySet, oEntry, oDataModel) {
            sap.ui.core.BusyIndicator.show(0);
            return new Promise(function (resolve, reject) {
                const options = {
                    success: resolve,
                    error: reject
                };
                oDataModel.create(sEntitySet, oEntry, options);
            });
        },

        _focusInput: function (inputId, timeout) {
            setTimeout(() => {
                this.getView().byId(inputId).focus();
            }, timeout);
        },
        _clearHeader: function () {
            this._jsonModel.setProperty("/Detail", models.createJSONModel().getData().Detail);
            this._focusInput("idBarkodInput", 300)
        },

        _clearMain: function () {
            this._jsonModel.setProperty("/Main", models.createJSONModel().getData().Main);
        },

        _clearEditable: function () {
            this._jsonModel.setProperty("/Editable", models.createJSONModel().getData().Editable);
        },

        _getDepoList: function () {
            let that = this;
            this._readMultiData("/KaynakDepoSHSet", [new Filter("IvUname", FilterOperator.EQ, this._userId)], this.getModel()).then((oData) => {
                that.getModel("jsonModel").setProperty("/KaynakDepoSH", oData.results);
                that._readMultiData("/HedefDepoSHSet", [new Filter("IvUname", FilterOperator.EQ, that._userId)], that.getModel()).then((oData) => {
                    that.getModel("jsonModel").setProperty("/HedefDepoSH", oData.results);
                    that._readMultiData("/DepoAdresiSHSet", [], that.getModel()).then((oData) => {
                        that.getModel("jsonModel").setProperty("/DepoAdresiSH", oData.results);
                    }).finally(() => {
                        sap.ui.core.BusyIndicator.hide()
                    })
                })
            }).finally(() => {
                sap.ui.core.BusyIndicator.hide();
            })
        },

        _getAdresses: function () {
            this._valueHelpInput = this.getView().byId("idDepoAdresiInput")
            if (!this._adresSorguDialog) {
                this._adresSorguDialog = sap.ui.xmlfragment(this.getView().getId(), "com.kormas.uretimdentoplutransfer.view.fragments.valueHelp.AdresSorguSH", this);
                this.getView().addDependent(this._adresSorguDialog);
            }
            this._getDepoAdresi()
            setTimeout(() => {
                this._adresSorguDialog.open();
                this._afterFocus(this._adresSorguDialog);
            }, 300);
        },

        _checkHedefDepo: function (sHedefDepo) {
            let that = this,
                sPath = this.getModel().createKey("/HedefDepoKontrolSet", {
                    IvLgort: that._jsonModel.getData().Main.KaynakDepo,
                    IvHlgort: that._jsonModel.getData().Main.HedefDepo,
                    IvWerks: that._jsonModel.getData().Werks
                });

            this._readData(sPath, this.getModel()).then((oData) => {
                that.getModel("jsonModel").setProperty("/DepoTipi", oData.EvDepoTipi);
                that.getModel("jsonModel").setProperty("/Lgnum", oData.EvLgnum);

                oData.EvDepoTipi === "EWM" ? that.getModel("jsonModel").setProperty("/HareketTuru", true) : that.getModel("jsonModel").setProperty("/HareketTuru", false);

                oData.Type !== "E" ? that.getRouter().navTo("Detail", {
                    KDepo: that.getModel("jsonModel").getProperty("/Main/KaynakDepo"),
                    HDepo: that.getModel("jsonModel").getProperty("/Main/HedefDepo")
                }) : sap.m.MessageBox.error(oData.Message, {
                    onClose: function () {
                        that._clearMain();
                        that._focusInput("idKaynakDepoInput", 200);
                    }
                });
            }).catch((oError) => {
                if (oError) {
                    sap.m.MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                }
            }).finally(() => {
                sap.ui.core.BusyIndicator.hide();
            });
        },

        _checkBarcode: function (oEvent) {
            let that = this,
                sBarcode = oEvent.getParameter("value"),
                oInput = oEvent.oSource,
                sPath = this.getModel().createKey("/BarkodOkutSet", {
                    IvBarcode: sBarcode,
                    IvWerks: that._jsonModel.getData().Werks,
                    IvLgort: that._jsonModel.getData().Main.KaynakDepo
                });


            if (sBarcode.length < 13) {
                return sap.m.MessageBox.error(this.getResourceBundle().getText("MALZEME_BULUNAMADI"), {
                    onClose: function () {
                        that._clearEditable()
                        that._clearHeader()
                        oInput.focus();
                    }
                })
            }

            this._readData(sPath, this.getModel()).then((oData) => {
                if (oData) {
                    that._jsonModel.setProperty("/Detail/Matnr", oData.Matnr);
                    that._jsonModel.setProperty("/Detail/Maktx", oData.Maktx);
                    that._jsonModel.setProperty("/Detail/Meins", oData.Meins);
                    that._jsonModel.setProperty("/Detail/DepoStok", oData.Clabs);

                    that.getModel("jsonModel").getData().HareketTuru ? [that._jsonModel.setProperty("/Editable/DepoAdresi", true), that._focusInput("idDepoAdresiInput", 200)] : [that._focusInput("idMiktarInput", 200), that._jsonModel.setProperty("/Editable/Miktar", true)]

                    let iTotal = 0;
                    that._jsonModel.getData().TransferTable.forEach(element => {
                        iTotal = + element.Quan;
                    });

                    that._jsonModel.setProperty("/TotalMenge", iTotal);
                }
            }).catch((oError) => {
                if (oError) {
                    sap.m.MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                }
                this._clearHeader()
                this._clearEditable()
            }).finally(() => {
                sap.ui.core.BusyIndicator.hide();
            });
        },

        _getDefaultAddress: function () {
            let that = this,
                sPath = this.getModel().createKey("/VarsayilanAdresSet", {
                    IvLgort: this._jsonModel.getData().Main.HedefDepo,
                    IvUname: this._userId
                });

            this._readData(sPath, this.getModel()).then((oData) => {
                oData.EvLgpla ? [that._jsonModel.setProperty("/Detail/Lgpla", oData.EvLgpla)] : null
                that._jsonModel.setProperty("/Editable/DepoAdresi", true)
                that._jsonModel.setProperty("/Editable/Miktar", true)
            }).catch((oError) => {
                if (oError) {
                    sap.m.MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                }
            }).finally(() => {
                sap.ui.core.BusyIndicator.hide();
            });
        },

        _addBarcode: function (oBarcodeData) {
            let that = this,
                sPath = this.getModel().createKey("/BarkodEkleSet", {
                    Matnr: oBarcodeData.Matnr,
                    Quan:  oBarcodeData.Menge.replace(",","."),
                    Lgpla: oBarcodeData.Lgpla ? oBarcodeData.Lgpla : "",
                    Klgort: this._jsonModel.getData().Main.KaynakDepo,
                    Hlgort: this._jsonModel.getData().Main.HedefDepo
                });

            this._readData(sPath, this.getModel()).then((oData) => {

                oData.Type === "S" ? [sap.m.MessageToast.show(oData.Message), that._clearHeader(), that._getDetail(), that._clearEditable(), 
                    that._getDefaultAddress()] : sap.m.MessageBox.error(oData.Message);

            }).catch((oError) => {
                if (oError) {
                    sap.m.MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                }
            }).finally(() => {
                sap.ui.core.BusyIndicator.hide();
            });
        },

        _getDetail: function () {
            let that = this,
                aFilters = [new Filter("IvUname", FilterOperator.EQ, this._userId)];

            this._readMultiData("/DetayGetirSet", aFilters, this.getModel()).then((oData) => {
                that.getModel("jsonModel").setProperty("/TransferTable", oData.results);
            }).catch((oError) => {
                if (oError) {
                    sap.m.MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                }
            }).finally(() => {
                sap.ui.core.BusyIndicator.hide();
            });
        },

        _deleteRow: function (oEvent) {
            let oTable = oEvent.getSource().getParent().getParent(),
                aSelectedItem = oTable.getSelectedItem(),
                that = this;

            if (!aSelectedItem) {
                return sap.m.MessageBox.error(this.getResourceBundle().getText("SILINECEK_SATIR_SECINIZ"));
            }

            let sPath = this.getModel().createKey("/ItemSilSet", {
                IvGuid: aSelectedItem.getBindingContext("jsonModel").getObject().Guid
            });

            this._readData(sPath, this.getModel()).then((oData) => {
                oData.Type === "S" ? [sap.m.MessageToast.show(oData.Message), that._getDetail(), oTable.removeSelections()] : sap.m.MessageToast.show(oData.Message);
            }).catch((oError) => {
                if (oError) {
                    sap.m.MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                }
            }).finally(() => {
                sap.ui.core.BusyIndicator.hide();
            });
        },

        _saveTransfer: function () {
            let that = this,
                oEntry = {
                    Type: "",
                    Message: "",
                    EvMblnr: "",
                    NavToKaydetBaslik: [],
                    NavToKaydetItem: {}
                };

            this._jsonModel.setProperty("/Messages", [])

            this._createData("/KaydetBaslikSet", oEntry, this.getModel()).then((oData) => {
                oData.NavToKaydetBaslik.results.length > 0 ? [that._jsonModel.setProperty("/Messages", oData.NavToKaydetBaslik.results), that._openMessageDialog()] : [sap.m.MessageBox.success(that.getResourceBundle().getText("MALZEME_BELGEESI", oData.NavToKaydetItem.EvMblnr), {
                    onClose: function () {
                        that._clearHeader()
                    }
                })];
            }).catch((oError) => {
                if (oError) {
                    sap.m.MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                }
            }).finally(() => {
                sap.ui.core.BusyIndicator.hide();
                this._getDetail()
                this._getDefaultAddress()
            });
        },

        _getDepoAdresi: function () {
            let that = this,
                aFilters = [
                    new Filter("IvLgnum", FilterOperator.EQ, this._jsonModel.getData().Lgnum),
                    new Filter("IvMatnr", FilterOperator.EQ, this._jsonModel.getData().Detail.Matnr)
                ];

            this._readMultiData("/AdresSorguSet", aFilters, this.getModel()).then((oData) => {
                that._jsonModel.setProperty("/AdresSorguSH", [])
                oData.results.length > 0 ? that._jsonModel.setProperty("/AdresSorguSH", oData.results) : sap.m.MessageToast.show(that.getResourceBundle().getText("DEPO_ADRESI_BULUNAMADI"));

            }).catch((oError) => {
                if (oError) {
                    sap.m.MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                }
            }).finally(() => {
                sap.ui.core.BusyIndicator.hide();
            });
        },

        _openMessageDialog: function () {
            this._errorMessagesDialog = sap.ui.xmlfragment(this.getView().getId(), "com.kormas.uretimdentoplutransfer.view.fragments.dialog.MessagePopover", this);
            this.getView().addDependent(this._errorMessagesDialog);
            this._errorMessagesDialog.open();
        },

        _closeMessageDialog: function (oEvent) {
            oEvent.getSource().getParent().close();
        },

        _prepareValueHelpDialog: function (oEvent, fragmentName) {
            this._valueHelpInput = oEvent.getSource();
            this._valueHelpDialog = sap.ui.xmlfragment(this.getView().getId(), "com.kormas.uretimdentoplutransfer.view.fragments.valueHelp." + fragmentName, this);
            this.getView().addDependent(this._valueHelpDialog);
            this._valueHelpDialog.open();
            this._afterFocus(this._valueHelpDialog);
        },

        _afterFocus: function (valueHelp) {
            setTimeout(function () {
                var oSearchField = valueHelp._oSearchField;
                if (oSearchField) {
                    oSearchField.focus();
                }
            }, 500);
        },

        onSelectDialogSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new Filter([
                new Filter("Lgpla", FilterOperator.Contains, sValue),
                new Filter("Lgort", FilterOperator.Contains, sValue),
                new Filter("Lgobe", FilterOperator.Contains, sValue),
                new Filter("Charg", FilterOperator.Contains, sValue),
            ], false);
            var oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter([oFilter]);
        },

        onSelectDialogConfirm: function (oEvent) {
            var sDescription,
                sTitle,
                sType,
                oSelectedItem = oEvent.getParameter("selectedItem"),
                sInputId = this._valueHelpInput.getId();
            if (!oSelectedItem) {
                return;
            }
            sTitle = oSelectedItem.getTitle();
            sDescription = oSelectedItem.getDescription();
            sType = oSelectedItem.getInfo();

            sInputId.includes("idHedefDepo") ? [this._valueHelpInput.setValue(sTitle), this._valueHelpInput.setDescription(sDescription), this._checkHedefDepo(sTitle)] : sInputId.includes("idKaynakDepo") ? [this._valueHelpInput.setValue(sTitle), this._valueHelpInput.setDescription(sDescription), this._focusInput("idHedefDepoInput", 200)] : sInputId.includes("idDepoAdresiInput") ? [this._valueHelpInput.setValue(sTitle), this._jsonModel.setProperty("/Editable/Miktar", true), this._focusInput("idMiktarInput", 200)] : null;

            oEvent.getSource().getBinding("items").filter([]);

        },

        onSelectDialogCancel: function (oEvent) {
            oEvent.getSource()._dialog.close();
        }
    });
});
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "com/kormas/uretimdentoplutransfer/model/models",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "com/kormas/uretimdentoplutransfer/controller/BaseController",
    "com/kormas/uretimdentoplutransfer/model/formatter"
],
    function (Controller,
        models,
        Filter,
        FilterOperator,
        BaseController,
        formatter) {
        "use strict";

        return BaseController.extend("com.kormas.uretimdentoplutransfer.controller.Detail", {
            formatter: formatter,
            onInit: function () {
                this.getOwnerComponent().getRouter().getRoute("Detail").attachPatternMatched(this._onRouteMatched, this);
            },

            _onRouteMatched: function () {
                this._jsonModel = this.getModel("jsonModel");
                this._oDataModel = this.getModel();
                this._userId = sap.ushell.Container.getService("UserInfo").getId();
                this._focusInput("idBarkodInput", 400);
                this._getDetail();
                this._clearDetail();
            },

            onBarkodInputSubmit: function (oEvent) {
                this._checkBarcode(oEvent.getParameter("value"));
            },

            onDepoAdresiInputSubmit: function (oEvent) {
                let that = this,
                    sValue = oEvent.getParameter("value").toUpperCase(),
                    aDepoAdresleri = this.getModel("jsonModel").getProperty("/DepoAdresiSH"),
                    sDepoAdresi = aDepoAdresleri.find((oDepo) => oDepo.Lgpla === sValue);

                if (sDepoAdresi) {
                    oEvent.getSource().setValue(sDepoAdresi.Lgpla);
                    this._focusInput("idMiktarInput", 200)
                } else {
                    oEvent.getSource().setValue("");
                    oEvent.getSource().setDescription("");
                    oEvent.getSource().focus();
                }
            },

            onMiktarInputSubmit: function () {
                let oBarcodeData = this._jsonModel.getData().Detail,
                    sHareketTuru = this._jsonModel.getData().HareketTuru,
                    validate = true;

                Object.entries(oBarcodeData).forEach(([key, value]) => {
                    if (!sHareketTuru) {
                        if (key !== "Lgpla") {
                            if (key === "DepoStok") {
                                //
                            } else {
                                if (!value) {
                                    return validate = false;
                                }
                            }
                        }
                    } else {
                        if (key === "DepoStok") {

                        } else {
                            if (!value) {
                                return validate = false;
                            }
                        }
                    }
                });

                if (!validate) {
                    return sap.m.MessageBox.error(this.getResourceBundle().getText("ZORUNLU_ALANLARI_DOLDURUNUZ"));
                }

                this._checkStock(oBarcodeData);
            },

            onEkleButtonPress: function () {
                this.onMiktarInputSubmit();
            },

            onDetayButtonPress: function () {
                this._getDetail();
            },

            onAdresSorguButtonPress: function () {
                if (!this._jsonModel.getData().Detail.Matnr) {
                    return sap.m.MessageBox.error(this.getResourceBundle().getText("MALZEME_SECINIZ"));
                }
                this._getDepoAdresi();
            },

            onSaveButtonPress(oEvent) {
                let oTable = this.getView().byId("idTransferTable");

                if (oTable.getItems().length === 0) {
                    return sap.m.MessageBox.error(this.getResourceBundle().getText("TRANSFER_TABLOSU_BOS"));
                }

                this._saveTransfer();
            }
        });
    });

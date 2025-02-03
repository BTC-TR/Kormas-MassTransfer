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
                this._clearHeader();
                this._getDetail();
                this._focusInput("idBarkodInput", 400);

                this._jsonModel.getData().HareketTuru ? this._getDefaultAddress() : null
            },

            onDepoAdresiInputSubmit: function (oEvent) {
                let that = this,
                    sValue = oEvent.getParameter("value").toUpperCase(),
                    aDepoAdresleri = this.getModel("jsonModel").getProperty("/DepoAdresiSH"),
                    sDepoAdresi = aDepoAdresleri.find((oDepo) => oDepo.Lgpla === sValue);

                if (sDepoAdresi) {
                    oEvent.getSource().setValue(sDepoAdresi.Lgpla);
                    this._jsonModel.setProperty("/Editable/Miktar", true)
                    this._focusInput("idMiktarInput", 200)
                } else {
                    oEvent.getSource().setValue("");
                    sap.m.MessageToast.show(this.getResourceBundle().getText("DEPO_ADRESI_BULUNAMADI"));
                    this._jsonModel.setProperty("/Editable/Miktar", false)
                    oEvent.oSource.focus();
                }
            },

            onMengeInputLiveChange: function (oEvent) {
                let sValue = oEvent.getParameter("value"),
                    sFilteredValue;

                sFilteredValue = sValue.replace(/[^0-9,]/g, "");
                sFilteredValue = sFilteredValue.replace(/(,.*),/g, "$1");

                if (sValue !== sFilteredValue) {
                    oEvent.getSource().setValue(sFilteredValue);
                }
            },

            onMiktarInputSubmit: function () {
                let oBarcodeData = this._jsonModel.getData().Detail,
                    sHareketTuru = this._jsonModel.getData().HareketTuru,
                    validate = true,
                    that = this;

                if (!oBarcodeData.Matnr) {
                    return sap.m.MessageBox.error(this.getResourceBundle().getText("MALZEME_EKSIK"))
                }

                if (sHareketTuru && !oBarcodeData.Lgpla) {
                    return sap.m.MessageBox.error(this.getResourceBundle().getText("DEPO_ADRESI_GIRIN"))
                }

                if (!oBarcodeData.Menge) {
                    return sap.m.MessageBox.error(this.getResourceBundle().getText("MIKTAR_GIRINIZ"))
                }

                if (parseInt(oBarcodeData.Menge) > parseInt(oBarcodeData.DepoStok)) {
                    return sap.m.MessageBox.error(that.getResourceBundle().getText("MIKTAR_STOKTAN_FAZLA", [that._jsonModel.getData().Main.KaynakDepo, that._jsonModel.getData().Detail.Menge]))
                }

                let toplam = (parseInt(oBarcodeData.Menge) + parseInt(this._jsonModel.getData().TotalMenge));
                if (toplam > parseInt(oBarcodeData.DepoStok)) {
                    return sap.m.MessageBox.error(that.getResourceBundle().getText("GIRILENLER_TOPLAMI_STOKTAN_FAZLA", [toplam, oBarcodeData.DepoStok, (parseInt(oBarcodeData.DepoStok) - that._jsonModel.getData().TotalMenge)]))
                }

                !validate ? sap.m.MessageBox.error(this.getResourceBundle().getText("ZORUNLU_ALANLARI_DOLDURUNUZ")) : this._addBarcode(oBarcodeData);
            },

            onAdresSorguButtonPress: function () {
                !this._jsonModel.getData().Detail.Matnr ? sap.m.MessageBox.error(this.getResourceBundle().getText("MALZEME_SECINIZ")) : this._getAdresses();
            },

            onSaveButtonPress: function () {
                this.getView().byId("idTransferTable").getItems().length === 0 ? sap.m.MessageBox.error(this.getResourceBundle().getText("TRANSFER_TABLOSU_BOS")) : this._saveTransfer();
            }
        });
    });

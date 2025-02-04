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

        return BaseController.extend("com.kormas.uretimdentoplutransfer.controller.Main", {
            formatter: formatter,
            onInit: function () {
                this.getOwnerComponent().getRouter().getRoute("RouteMain").attachPatternMatched(this._onRouteMatched, this);
            },

            _onRouteMatched: function () {
                this._jsonModel = this.getModel("jsonModel");
                this._oDataModel = this.getModel();
                this._userId = sap.ushell.Container.getService("UserInfo").getId();
                this._getDepoList();
                this._clearMain();
                this._focusInput("idKaynakDepoInput", 200);
            },

            onKaynakDepoInputSubmit: function (oEvent) {
                let that = this,
                    sValue = oEvent.getParameter("value"),
                    aKaynakDepolar = this.getModel("jsonModel").getProperty("/KaynakDepoSH"),
                    sKaynakDepo = aKaynakDepolar.find((oDepo) => oDepo.Lgort === sValue),
                    oInput = oEvent.getSource();

                if (sKaynakDepo) {
                    oEvent.getSource().setValue(sKaynakDepo.Lgort);
                    oEvent.getSource().setDescription(sKaynakDepo.Lgobe);
                    this._focusInput("idHedefDepoInput", 200)
                } else {
                    oInput.setValue("");
                    oInput.setDescription("");
                    oInput.focus();
                    sap.m.MessageBox.error(this.getResourceBundle().getText("DEPO_YETKINIZ_YOKTUR", sValue), {
                        onClose: function () {
                        }
                    })
                }
            },

            onHedefDepoInputSubmit: function (oEvent) {
                let that = this,
                    sValue = oEvent.getParameter("value"),
                    aHedefDepolar = this.getModel("jsonModel").getProperty("/HedefDepoSH"),
                    sHedefDepo = aHedefDepolar.find((oDepo) => oDepo.Lgort === sValue),
                    oInput = oEvent.getSource();

                if (sHedefDepo) {
                    oEvent.getSource().setValue(sHedefDepo.Lgort);
                    oEvent.getSource().setDescription(sHedefDepo.Lgobe);
                    this._checkHedefDepo(sHedefDepo.Lgort)
                } else {
                    oInput.setValue("");
                    oInput.setDescription("");
                    oInput.focus();
                    sap.m.MessageBox.error(this.getResourceBundle().getText("DEPO_YETKINIZ_YOKTUR", sValue), {
                        onClose: function () {
                        }
                    })
                }
            },

            onIlerleButtonPress: function () {
                !this.getView().getModel("jsonModel").getProperty("/Main/KaynakDepo") || !this.getView().getModel("jsonModel").getProperty("/Main/HedefDepo") ? sap.m.MessageToast.show(this.getResourceBundle().getText("DEPO_BILGILERI_EKSIK")) : this._checkHedefDepo(this.getView().getModel("jsonModel").getProperty("/Main/HedefDepo"))
            }
        });
    });


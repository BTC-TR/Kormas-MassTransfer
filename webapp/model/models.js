sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], 
function (JSONModel, Device) {
    "use strict";

    return {
        /**
         * Provides runtime info for the device the UI5 app is running on as JSONModel
         */
        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

        createJSONModel: function () {
            return new JSONModel({
                Werks: "1000",
                HareketTuru: false,
                Main: {
                    KaynakDepo: "",
                    HedefDepo: "",
                    KaynakDepoDesc: "",
                    HedefDepoDesc: ""
                },
                Detail: {
                    Barkod: "",
                    Matnr: "",
                    Maktx: "",
                    Menge: "",
                    Meins: "",
                    DepoStok: "",
                    Lgpla: "",
                },
                TransferTable: []
            })
        }
    };

});
sap.ui.define([
    "sap/ui/base/ManagedObject",
    "com/kormas/uretimdentoplutransfer/controller/BaseController"
], function (
    ManagedObject,
    BaseController
) {
    "use strict";

    return {
        numberUnit: function (sValue) {
            if (!sValue) {
                return "";
            }

            var isFloat = sValue.split(".");
            if (isFloat[1] === "00000000000000") {
                return parseInt(sValue);
            } else {
                return parseFloat(sValue).toFixed(3);
            }
        },

        highlightStock: function (sValue) {
            if (!sValue) {
                return "";
            }

            let state = "None";

            if (sValue.includes("F")) {
                state = "Success"
            } else if (sValue.includes("Q")) {
                state = "Warning"
            } else if (sValue.includes("B")) {
                state = "Error"
            }

            return state;
        }
    }
});
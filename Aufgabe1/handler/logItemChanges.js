"use strict";

function printItem(item) {
    console.log("Trigger of LOGGER PULLED as an User was added or changed: ");
    console.log(item);
}

module.exports.logItemChanges = async (event) => {
    printItem(event);
};

"use strict";

module.exports.logItemChanges = async (event) => {
    console.log("Trigger of LOGGER PULLED as an User was added or changed: ");
    console.log(event);
};

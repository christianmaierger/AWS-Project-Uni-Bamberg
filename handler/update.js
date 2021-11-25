"use strict";

// get shared functions and variables
const {
    docClient,
    lambda,
    validateEmail,
    wrapResponse,
    wrapParams,
    GetFunction,
} = require("../shared");

module.exports.update = async (event) => {
    if (!validateEmail(event.email)) {
        return wrapResponse(400, {
            message: "Bad Request: Not a valid email-adress",
        });
    }
    // check if an item can be found under given id
    try {
        const response = await lambda
            .invoke({
                FunctionName: GetFunction,
                InvocationType: "RequestResponse", // is default
                Payload: JSON.stringify(event, null, 2), // pass params
            })
            .promise();
        let payload = JSON.parse(response.Payload);
        if (payload.statusCode === 404) {
            //No Item found -> cant update it
            return wrapResponse(404, {
                message: "There is no entry to be updated",
            });
        }
    } catch (error) {
        return wrapResponse(400, {
            message: "There was a Problem checking the Database",
        });
    }

    let params = wrapParams("Item", event);
    try {
        await docClient.put(params).promise();
        return wrapResponse(200, { message: "Entry updated successfully" });
    } catch (error) {
        return wrapResponse(error.statusCode, { message: error.message });
    }
};

"use strict";

// get shared functions and variables
const {
    docClient,
    validateEmail,
    wrapResponse,
    wrapParams,
    GetFunction,
    lambda,
} = require("../shared");

module.exports.delete = async (event) => {
    if (!validateEmail(event.email)) {
        return wrapResponse(400, {
            message: "Bad Request: Not a valid email-adress",
        });
    }

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
            //No Item found -> cant delete it
            return wrapResponse(404, {
                message: "There is no entry to be deleted",
            });
        }
    } catch (error) {
        return wrapResponse(400, {
            message: "There was a Problem checking the Database",
        });
    }

    let params = wrapParams("Key", event);
    try {
        await docClient.delete(params).promise();
        return wrapResponse(200, { message: "Entry deleted successfully" });
    } catch (error) {
        return wrapResponse(error.statusCode, { message: error.message });
    }
};

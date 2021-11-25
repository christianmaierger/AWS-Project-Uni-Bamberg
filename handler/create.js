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

module.exports.create = async (event) => {
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
        const payload = JSON.parse(response.Payload);
        if (payload.statusCode === 200) {
            return wrapResponse(405, {
                message:
                    "Entry with given ID already exists, please use update to overide an existing entry",
            });
        }
    } catch (error) {
        return wrapResponse(400, {
            message: "There was a Problem checking the Database",
        });
    }

    const params = wrapParams("Item", event);
    try {
        await docClient.put(params).promise();
        return wrapResponse(200, { message: "Creation of entry successful" });
    } catch (error) {
        return wrapResponse(error.statusCode, { message: error.message });
    }
};

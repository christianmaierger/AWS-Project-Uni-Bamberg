/*
 * Copyright 2015-2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
 *
 *     http://aws.amazon.com/apache2.0/
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
const crypto = require("crypto");

const {
    wrapParams,
    isEmpty,
    docClient,
    errorType,
    wrapUpdateParams,
    hashPassword,
} = require("../shared");

function generateToken(length) {
    return crypto.randomBytes(length).toString("hex");
}

const {AuthPolicy} = require("./AuthPolicy");

console.log("Loading function");

async function saveToken(email, birthday, token) {
    const item = { email, birthday, loginToken: token };
    const params = wrapUpdateParams(item);
    try {
        await docClient.update(params).promise();
    } catch (error) {
        console.log(error);
        throw errorType.dberror;
    }
}

module.exports.authorizer = async (event, context, callback) => {
    // Do not print the auth token unless absolutely necessary
    // console.log('Client token: ' + event.authorizationToken);
    console.log("Method ARN: " + event.methodArn);

    const email = event.headers.email;
    const password = event.headers.password;
    const birthday = event.headers.birthday;

    const principalId = "user|a1b2c3d4";

    const apiOptions = {};
    const tmp = event.methodArn.split(":");
    const apiGatewayArnTmp = tmp[5].split("/");
    const awsAccountId = tmp[4];
    apiOptions.region = tmp[3];
    apiOptions.restApiId = apiGatewayArnTmp[0];
    apiOptions.stage = apiGatewayArnTmp[1];

    const policy = new AuthPolicy(principalId, awsAccountId, apiOptions);
    let token;

    const params = wrapParams("Key", { email: email, birthday: birthday });
    try {
        const response = await docClient.get(params).promise();

        if (isEmpty(response)) {
            console.log("Empty response :(");
            policy.denyAllMethods();
        } else {
            const hashedPassword = hashPassword(password);

            const dbPasswordHash = response.Item.password;

            if (
                dbPasswordHash === undefined ||
                dbPasswordHash !== hashedPassword
            ) {
                console.log("dbPasswordHash is different", dbPasswordHash, hashedPassword);
                policy.denyAllMethods();
            } else {
                policy.allowMethod(AuthPolicy.HttpVerb.GET, "/user/*");
                token = generateToken(256);
                await saveToken(email, birthday, token);
            }
        }
    } catch (error) {
        console.log(error);
        throw errorType.dberror;
    }

    // finally, build the policy
    const authResponse = policy.build();

    authResponse.context = {
        key: "value", // $context.authorizer.key -> value
        number: 1,
        token: token,
        bool: true,
    };

    callback(null, authResponse);
};
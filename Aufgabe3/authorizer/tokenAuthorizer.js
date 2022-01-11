/*
 * Copyright 2015-2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
 *
 *     http://aws.amazon.com/apache2.0/
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

const {
    docClient,
    TableName,
    TokenIndexName,
} = require("../shared");
const {AuthPolicy} = require("./AuthPolicy");

module.exports.authorizer = async (event, context, callback) => {
    // Do not print the auth token unless absolutely necessary
    // console.log('Client token: ' + event.authorizationToken);
    console.log("Method ARN: " + event.methodArn);
    console.log(event);

    const token = event.authorizationToken;

    const principalId = "user|a1b2c3d4";

    const apiOptions = {};
    const tmp = event.methodArn.split(":");
    const apiGatewayArnTmp = tmp[5].split("/");
    const awsAccountId = tmp[4];
    apiOptions.region = tmp[3];
    apiOptions.restApiId = apiGatewayArnTmp[0];
    apiOptions.stage = apiGatewayArnTmp[1];

    // this function must generate a policy that is associated with the recognized principal user identifier.
    // depending on your use case, you might store policies in a DB, or generate them on the fly

    // keep in mind, the policy is cached for 5 minutes by default (TTL is configurable in the authorizer)
    // and will apply to subsequent calls to any method/resource in the RestApi
    // made with the same token
    const policy = new AuthPolicy(principalId, awsAccountId, apiOptions);

    let item;

    if (token === undefined) {
        console.log("Token undefined");
        policy.denyAllMethods();
    } else {
        let response;
        try {
            response = await docClient
                .query({
                    TableName: TableName,
                    IndexName: TokenIndexName,
                    KeyConditionExpression: "loginToken = :loginToken", // KeyConditionExpression using indexed attributes
                    ExpressionAttributeValues: {
                        ":loginToken": token,
                    },
                    ScanIndexForward: true, // this detirmines if sorted ascending or descending by range key
                })
                .promise();

            const resultList = response.Items;
            console.log(resultList);
            if (resultList.length > 0) {
                item = resultList[0];
                console.log(item);
                policy.allowMethod(AuthPolicy.HttpVerb.GET, "/user/*");
                policy.allowMethod(AuthPolicy.HttpVerb.GET, "/user");
            } else {
                policy.denyAllMethods();
            }
        } catch (error) {
            console.log(error);
            policy.denyAllMethods();
        }
    }

    // finally, build the policy
    const authResponse = policy.build();

    if (item !== undefined) {
        delete item.password;
        delete item.loginToken;

        authResponse.context = {
            token,
            item: JSON.stringify(item),
            loginSuccessful: true,
        };
    }

    // authResponse.context.arr = ['foo']; <- this is invalid, APIGW will not accept it
    // authResponse.context.obj = {'foo':'bar'}; <- also invalid

    callback(null, authResponse);
};
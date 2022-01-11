const AWS = require("aws-sdk");
const cognito = new AWS.CognitoIdentityServiceProvider();

const validateInput = (data) => {
    const body = JSON.parse(data);
    const {email, password} = body;
    return !(!email || !password || password.length < 6);

};

const sendResponse = (statusCode, body) => {
    return {
        statusCode: statusCode,
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        },
    };
};

module.exports.login = async (event) => {
    try {
        //const isValid = validateInput(event.body);
        //if (!isValid) return sendResponse(400, {message: "Invalid input"});

        const {email, password} = event.headers;

        const {user_pool_id, client_id} = process.env;
        console.log(process.env);
        const params = {
            AuthFlow: "ADMIN_NO_SRP_AUTH",
            UserPoolId: user_pool_id,
            ClientId: client_id,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password,
            },
        };
        const response = await cognito.adminInitiateAuth(params).promise();
        return sendResponse(200, {
            message: "Success",
            token: response.AuthenticationResult.IdToken,
        });
    } catch (error) {
        const message = error.message ? error.message : "Internal server error";
        return sendResponse(500, {message});
    }
};
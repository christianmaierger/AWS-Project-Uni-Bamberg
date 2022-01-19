const {wrapResponse, handleError} = require("../../shared");
const AWS = require("aws-sdk");
const {validateAttributesNotUndefined} = require("../../validator");
const cognito = new AWS.CognitoIdentityServiceProvider();


module.exports.register = async (event) => {
    try {
        const item = JSON.parse(event.body).item;
        validateAttributesNotUndefined(item, "email", "password");
        const {email, password} = item;
        const {user_pool_id} = process.env;
        const params = {
            UserPoolId: user_pool_id,
            Username: email,
            UserAttributes: [
                {
                    Name: "email",
                    Value: email,
                },
                {
                    Name: "email_verified",
                    Value: "true",
                },
            ],
            MessageAction: "SUPPRESS",
        };

        const response = await cognito.adminCreateUser(params).promise();
        if (response.User) {
            const paramsForSetPass = {
                Password: password,
                UserPoolId: user_pool_id,
                Username: email,
                Permanent: true,
            };
            await cognito.adminSetUserPassword(paramsForSetPass).promise();
        }
        return wrapResponse(200, {message: "User registration successful."});
    } catch (error) {
        return handleError(error);
    }
};
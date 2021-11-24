'use strict';

var AWS = require('aws-sdk');
module.exports.hello = async (event) => {
  var ddb = AWS.DynamoDB();
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Go Serverless v2.0! Your function executed successfully!',
        input: event,
      },
      null,
      2
    ),
  };
};

'use strict';

var AWS = require('aws-sdk');
var docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

module.exports.hello = async (event) => {
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

function wrapResponse(statusCode, data) {
  return {
    statusCode: statusCode,
    body: data
  }
}

function wrapParams(key, data, tableName = process.env.TABLE_NAME) {
  let params = {TableName: tableName};
  params[key] = data;
  return params;
}

function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}


module.exports.echo = async (event) => {
  return wrapResponse(200, event);
}

//TODO Autoincremtent: Get highest id from table and write new one (Threadsafety?)
//OR just hash an id from name etc
//Better way to get new id? extra function that can only run one instance at a time that gives new ids?
//TODO Would it make sense to not have to adjust the adjust the data in event to "N" "S" etc before sending it to this function
module.exports.put = async (event) => {

  var params = wrapParams("Item", event);

  //Check if item already exists in db since the .put fx will not report an error even if an element with the 
  //same id already exists

  try{
    var lambda = new AWS.Lambda();
    var response = await lambda.invoke({
      FunctionName: process.env.FUNC_GET,
      Payload: JSON.stringify({user_id: event.user_id},null,2)
    }).promise();
    let payload = JSON.parse(response.Payload);
    if(payload.statusCode == 200) {
      return wrapResponse(400, { message: "Entry with given ID already exists"});
    }
  } catch (error) {
    return wrapResponse(400, { message: "There was a Problem checking the Database"});
  }

  try {
    await docClient.put(params).promise();
    return wrapResponse(200, { message:"Creation of entry successful"});
  } catch (error) {
    return wrapResponse(error.statusCode, { message: error.message});
  }
}

module.exports.change = async (event) => {

}

module.exports.get = async (event) => {

  var params = wrapParams("Key", event);
  
  try {
    let response = await docClient.get(params).promise();
    if(response && isEmpty(response)) {
      return wrapResponse(404, { message: "No entry matched the given parameters."});
    }
    return wrapResponse(200, response);
  } catch (error) {
    return wrapResponse(error.statusCode, { message: error.message});
  }
}

module.exports.remove = async (event) => {

}


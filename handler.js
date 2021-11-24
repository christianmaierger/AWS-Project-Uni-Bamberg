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

  var params = {
    TableName: process.env.TABLE_NAME,
    Item: event
  }

  //TODO Query after item with given id, throw error if it exists -> race condition! (normal in dbs?)
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
  var params = {
    TableName: process.env.TABLE_NAME,
    Key: event
  }
  
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


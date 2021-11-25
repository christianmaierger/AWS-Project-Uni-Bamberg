"use strict";

function printItem(item) {
    
    if(item.Records) {
        console.log("LOG:"+item.Records[0].eventSource+":"+item.Records[0].eventName);
    }
    console.log(JSON.stringify(item.Records[0].dynamodb.NewImage));
}

module.exports.logItemChanges = async (event) => {
    printItem(event);
};
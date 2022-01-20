'use strict';

module.exports.addVaccinationDates = async (event) => {
    //const item = JSON.parse(event.body).item;
    try {
        //let res =  await createItem(item);
        console.log(res)
        return wrapResponse(201, {message: 'Hello bisch'});
    } catch (err) {
        console.log(err)
        return handleError(err);
    }
};
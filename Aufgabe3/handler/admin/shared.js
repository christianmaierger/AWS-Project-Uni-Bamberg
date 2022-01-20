const {
    ses,
    handleError,
} = require('../../shared');

async function sendMail(user, date) {
    try {
        let adress = user.email
        var params = {
            Destination: {
                ToAddresses: [adress],
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data:
                            "<html><body><h3>Guten Tag " + user.surname + " " + user.lastname + "  ,</h3>" +
                            "<p> wir freuen uns Ihnen hiermit einen Termin anbieten zu können am: </p>" +
                            "<div style='color:darkblue'>" + date + "</div> " +
                            "<br> <p>Bleiben Sie gesund und beste Grüße </p> <p>Ihr Impfteam Bayern</p>  " +
                            "</body></html>"
                    },
                },

                Subject: {Data: "Ihr Impftermim am " + date},
            },
            Source: adress,
        };
        return ses.sendEmail(params).promise()
    } catch (err) {
        console.log(err)
        handleError(err)
    }
}

module.exports = {
    sendMail
};
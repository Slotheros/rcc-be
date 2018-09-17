const express = require('express');
const router = express.Router();

//test account
// const accountSid = 'AC54371bd8095f177b5524f49ef0a7f4f1';
// const authToken = '80740e1b96cc744294de85cff8882ecd';

//LIVE
const accountSid = 'AC99f5a1cf95c40049f94f58d9b12856a5';
const authToken = '5320f6abff74555ebdb46f3f09964e45';
const client = require('twilio')(accountSid, authToken);

router.post('/sms', function(req, res) {
    var smsMessage = req.body.message;
    client.messages
    .create({
        body: smsMessage,
        from: '+15853022896',
        to: '+15855067179'
    })
    .then(message => console.log(message.sid))
    .done(res.send());
});

module.exports = router; 

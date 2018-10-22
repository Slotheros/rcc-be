const express = require('express');
const router = express.Router();

'use strict';
const nodemailer = require('nodemailer');
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

// client id - 130825136877-4liulsnpqe55ku7jqldcmvhf8fhjtj64.apps.googleusercontent.com
// client secret - nORPDE6M-D0SvqZAScZtOm_A
// refresh token - 1/LPNp0BaoRiGksk7v8r84Ne7b0AK1iDfRYkPMw2U83-Y




router.post('/send', function(req, res) {
  const message = req.body.message;
  const email = req.body.email;


  const oauth2Client = new OAuth2(
    "130825136877-4liulsnpqe55ku7jqldcmvhf8fhjtj64.apps.googleusercontent.com", // ClientID
    "nORPDE6M-D0SvqZAScZtOm_A", // Client Secret
    "https://developers.google.com/oauthplayground" // Redirect URL
  );
    
  oauth2Client.setCredentials({
    refresh_token: "1/LPNp0BaoRiGksk7v8r84Ne7b0AK1iDfRYkPMw2U83-Y"
  });
        
  const accessToken = oauth2Client.refreshAccessToken()
    .then(res => res.credentials.access_token);

  const smtpTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
			type: "OAuth2",
			user: "teamgarnetgroup@gmail.com", 
			clientId: "130825136877-4liulsnpqe55ku7jqldcmvhf8fhjtj64.apps.googleusercontent.com",
			clientSecret: "nORPDE6M-D0SvqZAScZtOm_A",
			refreshToken: "1/LPNp0BaoRiGksk7v8r84Ne7b0AK1iDfRYkPMw2U83-Y",
			accessToken: accessToken
    }
  });

	const mailOptions = {
	from: req.body.email,
	to: "teamgarnetgroup@gmail.com",
	subject: "Message from " + email + " via the HR Portal",
	generateTextFromHTML: true,
	text: message + "\n\nDO NOT REPLY TO THIS EMAIL"
	// html: "<p>" + message + "</p>"
	};

	smtpTransport.sendMail(mailOptions, (error, response) => {
		if(error){
			error.errMsg = "Error occurred sending an email to HR"; 
			return res.status(500).send(error); 
		}
		return res.send(response); 
		smtpTransport.close(); 
	});
});

module.exports = router; 
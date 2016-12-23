var nodemailer = require('nodemailer');

var mailTransport = nodemailer.createTransport('SMTP', {
	service: ''
})
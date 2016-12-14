var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();
var handlebars = require('express3-handlebars')
	.create({
		defaultLayout: 'main'
	});

var tours = [{
	id: 0,
	name: 'Hood River',
	price: 99.99
}, {
	id: 1,
	name: 'Oregon Coast',
	price: 149.95
}];

app.disable('x-powered-by'); //非常重视安全的 服务器经常忽略此信息，甚至提供虚假信息
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/contact', function(req, res) {
	res.render('contact')
});

app.get('/thank-you', function(req, res) {
	res.render('thank-you')
});

app.get('/database-error', function(req, res) {
	res.render('database-error')
});

app.get('/headers', function(req, res) {
	res.set('Content-Type', 'text/plain');
	var s = '';
	for (var name in req.headers) s += name + ': ' + req.headers[name] + '\n';
	res.send(s);
});

app.get('/file', function(req, res) {
	res.download(__dirname + '/public/img/logo.jpg')
		// res.sendFile(__dirname + '/public/img/logo.jpg')
});

// 表单处理
// 必须引入中间件 body-parser
app.post('/process-contact', function(req, res) {
	console.log('Received contact from ' +
		' <' + req.body.email + '>');
	try {
		// 保存到数据库...

		return req.xhr ?
			res.json({
				success: true
			}) :
			res.redirect(303, '/thank-you');
	} catch (ex) {
		return req.xhr ?
			res.json({
				error: 'Database error'
			}) :
			res.redirect(303, '/database-error');
	}
});

// 根据请求头Accept类型不同返回不同格式信息
app.get('/api/tours', function(req, res) {
	var toursXml = '<?xml version="1.0"?><tours>' +
		tours.map(function(p) {
			return '<tour price="' + p.price +
				'" id="' + p.id + '">' + p.name + '</tour>';
		}).join('') + '</tours>';

	var toursText = tours.map(function(p) {
		return p.id + ': ' + p.name + ' (' + p.price + ')';
	}).join('\n');

	res.format({
		'application/json': function() {
			res.json(tours);
		},

		'application/xml': function() {
			res.type('application/xml');
			res.send(toursXml);
		},

		'text/plain': function() {
			res.type('text/plain');
			res.send(toursText);
		},

		'default': function() {
			// log the request and respond with 406
			res.status(406).send('Not Acceptable');
		}
	});
});

// 更新方法
app.put('/api/tour/:id', function(req, res) {
	var p = tours.some(function(p) {
		return p.id == req.params.id;
	});
	if (p) {
		if (req.query.name) {
			p.name = req.query.name;
		}
		if (req.query.price) {
			p.price = req.query.price;
		}
		res.json({ success: true });
	} else {
		res.json({ error: 'No such tour exists.' });
	}
});

// 删除方法
app.del('/api/tour/:id', function(req, res) {
	var i;
	for (i = tours.length - 1; i >= 0; i--) {
		if (tours[i].id == req.params.id) break;
	}
	if (i >= 0) {
		tours.splice(i, 1);
		res.json({ success: true });
	} else {
		res.json({ error: 'No such tour exists.'});
	}
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') !== 'production' ? err : {};
	res.locals.status = err.status;
	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
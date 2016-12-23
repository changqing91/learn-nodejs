var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();
var formidable = require('formidable');
var jqupload = require('jquery-file-upload-middleware');
var credentials = require('./credentials');
var handlebars = require('express3-handlebars')
	.create({
		defaultLayout: 'main',
		helpers: {
			section: function(name, options) {
				if (!this._sections) this._sections = {};
				this._sections[name] = options.fn(this);
				return null;
			}
		}
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
app.use(cookieParser(credentials.cookieSecret));
app.use(require('express-session')());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/set_cookie', function(req, res) {
	res.cookie('monster', 'nom nom');
	res.cookie('singed_monster', 'nom nom', { signed: true });
	res.send('success')
});

app.get('/cookie', function(req, res) {
	var monster = req.cookies.monster;
	var signedMonster = req.signedCookies.singed_monster;
	console.log(monster, signedMonster);
	res.send('success')
});

app.use('/upload', function(req, res, next) {
	var now = Date.now();
	jqupload.fileHandler({
		uploadDir: function() {
			return __dirname + '/public/uploads/' + now;
		},
		uploadUrl: function() {
			return '/uploads/' + now;
		},
	})(req, res, next);
});

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

app.get('/newsletter', function(req, res) {
	// 我们会在后面学到 CSRF… … 目前， 只提供一个虚拟值
	res.render('newsletter', {
		csrf: 'CSRF token goes here'
	});
});

app.get('/contest/vacation-photo', function(req, res) {
	var now = new Date();
	res.render('contest/vacation-photo', {
		year: now.getFullYear(),
		month: now.getMonth()
	});
});

app.post('/contest/vacation-photo/:year/:month', function(req, res) {
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files) {
		if (err) return res.redirect(303, '/error');
		console.log('received fields:');
		console.log(fields);
		console.log('received files:');
		console.log(files);
		res.redirect(303, '/thank-you');
	});
});

// 在这种情况下使用 303（ 或 302） 重定向， 而不是 301 重定向， 这一点非常
// 重要。 301 重定向是“ 永久” 的， 意味着浏览器会缓存重定向目标。 如果使
// 用 301 重定向并且试图第二次提交表单， 浏览器会绕过整个 /process 处理程
// 序直接进入 /thank you 页面， 因为它正确地认为重定向是永久性的。 另一方
// 面， 303 重定向告诉浏览器“ 是的， 你的请求有效， 可以在这里找到响应”，
// 并且不会缓存重定向目标。
app.post('/process', function(req, res) {
	console.log('Form (from querystring): ' + req.query.form);
	console.log('CSRF token (from hidden form field): ' + req.body._csrf);
	console.log('Name (from visible form field): ' + req.body.name);
	console.log('Email (from visible form field): ' + req.body.email);
	if(req.xhr || req.accepts('json,html')==='json'){
		// 如果发生错误， 应该发送 { error: 'error description' }
		res.send({ success: true });
	} else {
		// 如果发生错误， 应该重定向到错误页面
		res.redirect(303, '/thank-you');
	}
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
app.delete('/api/tour/:id', function(req, res) {
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
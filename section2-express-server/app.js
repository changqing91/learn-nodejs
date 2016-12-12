// express 中间件是按照顺序执行的
var express = require('express');
var app = express();
var handlebars = require('express3-handlebars')
	.create({ defaultLayout: 'main'});
var fortune = require('./lib/fortune.js');

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', process.env.PORT || 3000);
// 在项目目录下创建名为 public 的子目录(因为这个目录中的所有文件都会直接对外开放， 所以我们称这个目录为 public)
// static 中间件相当于给你想要发送的所有静态文件创建了一个路由，渲染文件并发送给客户端
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
	// res.type('text/plain');
	// res.send('Meadowlark Travle');
	res.render('home');
});

app.get('/about', function(req, res) {
	// res.type('text/plain');
	// res.send('Abount Meadowlark Travle');
	res.render('about', { fortune: fortune.getFortune() });
});

// 404 catch-all处理器(中间件)
app.use(function(req, res) {
	// res.type('text/plain');
	res.status(404);
	// res.send('404 - Not Found');
	res.render('404');
});

// 500错误处理器(中间件)
app.use(function(err, req, res, next) {
	console.error(err.stack);
	// res.type('text/plain');
	res.status(500);
	// res.send('500 - Server Error');
	res.render('500');
});

app.listen(app.get('port'), function() {
	console.log('Express stared on http://localhost:' + app.get('port') + ';press Ctrl-C to terminate');
});
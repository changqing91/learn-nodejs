// express 中间件是按照顺序执行的
var express = require('express');
var app = express();
var handlebars = require('express3-handlebars')
	.create({
		defaultLayout: 'main'
	});
var fortune = require('./lib/fortune.js');

app.disable('x-powered-by'); //非常重视安全的 服务器经常忽略此信息，甚至提供虚假信息
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', process.env.PORT || 3000);

// 在项目目录下创建名为 public 的子目录(因为这个目录中的所有文件都会直接对外开放， 所以我们称这个目录为 public)
// static 中间件相当于给你想要发送的所有静态文件创建了一个路由，渲染文件并发送给客户端
app.use(express.static(__dirname + '/public'));

// res.locals 对象是要传给视图的上下文的一部分
// 这个标识在main.handlebars里使用
app.use(function(req, res, next) {
	res.locals.showTests = app.get('env') !== 'production' &&
		req.query.test === '1';
	next();
});

app.get('/', function(req, res) {
	// res.type('text/plain');
	// res.send('Meadowlark Travle');
	res.render('home', {
		layout: 'custom' // 默认值是custom，null代表不适用layouts里面的模板
	});
});

app.get('/about', function(req, res) {
	// res.type('text/plain');
	// res.send('Abount Meadowlark Travle');
	res.render('about', {
		fortune: fortune.getFortune(),
		pageTestScript: '/qa/tests-about.js'
	});
});

app.get('/tours/hood-river', function(req, res) {
	res.render('tours/hood-river');
});

app.get('/tours/request-group-rate', function(req, res) {
	res.render('tours/request-group-rate');
});

app.use(function(req, res, next) {
	console.log('\n\nALLWAYS');
	next();
});
app.get('/a', function(req, res) {
	console.log('/a: 路由终止 ');
	res.send('a');
});
app.get('/a', function(req, res) {
	console.log('/a: 永远不会调用 ');
});
app.get('/b', function(req, res, next) {
	console.log('/b: 路由未终止 ');
	next();
});
app.use(function(req, res, next) {
	console.log('SOMETIMES');
	next();
});
app.get('/b', function(req, res, next) {
	console.log('/b (part 2): 抛出错误 ');
	throw new Error('b 失败 ');
});
app.use('/b', function(err, req, res, next) {
	console.log('/b 检测到错误并传递 ');
	next(err);
});
app.get('/c', function(err, req) {
	console.log('/c: 抛出错误 ');
	throw new Error('c 失败 ');
});
app.use('/c', function(err, req, res, next) {
	console.log('/c: 检测到错误但不传递 ');
	next();
});
app.use(function(err, req, res, next) {
	console.log(' 检测到未处理的错误 : ' + err.message);
	res.send('500 - 服务器错误 ');
});
app.use(function(req, res) {
	console.log(' 未处理的路由 ');
	res.send('404 - 未找到 ');
});

// // 404 catch-all处理器(中间件)
// // 放在路由方法结尾
// app.use(function(req, res) {
// 	// res.type('text/plain');
// 	res.status(404);
// 	// res.send('404 - Not Found');
// 	res.render('404');
// });

// // 500错误处理器(中间件)
// // 这应该出现在所有路由方法的结尾
// // 需要注意的是，即使你不需要一个 " 下一步 " 方法
// // 它也必须包含，以便 Express 将它识别为一个错误处理程序 app.use(function(err, req, res, next){
// app.use(function(err, req, res, next) {
// 	console.error(err.stack);
// 	// res.type('text/plain');
// 	res.status(500).render('500');
// 	// res.send('500 - Server Error');
// });

app.listen(app.get('port'), function() {
	console.log('Express stared on http://localhost:' + app.get('port') + ';press Ctrl-C to terminate');
});
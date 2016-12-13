##Project Install
```
npm i
npm i -g mocha
```

##QA Tools

测试套件

###page test: 
```
npm install --save-dev mocha
mkdir public/vendor
cp node_modules/mocha/mocha.js public/vendor
cp node_modules/mocha/mocha.css public/vendor
npm install --save-dev chai
cp node_modules/chai/chai.js public/vendor
```
visit url with parameter 'test=1'

###crosspage test:
```
npm install --save-dev zombie
mocha -u tdd -R spec qa/tests-crosspage.js 2>/dev/null
```

###unitest:
```
mocha -u tdd -R spec qa/tests-unit.js
```

去毛机 jshint 检查js文件
```
npm i -g jshit
jshint app.js
```

链接检查，检查死链接看起来没什么吸引力，但它对搜索引擎如何给你的网站评级却有巨大的影响
LinkChecker(http://wummel.github.io/linkchecker/)
```
linkchecker http://localhost:3000
```
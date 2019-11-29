var express = require('express');
var app = express();
var qs = require('querystring');
var https = require('https');

/**
 * Description: To get the current price and the change of a certain stock
 */
app.get('/stock/v1/current', function(req, res){
    if(req.query.symbol == null)
    {
        console.log("Parameter Error! Missing 'symbol'!");
        res.send("Parameter Error! Missing 'symbol'!");
        return;
    }
    var data = {
        'symbol': req.query.symbol,
        'sort_order': 'asc',
        'api_token': 'elXrkfeeorHtaT6TYpDTBi84mT1B6b3abFVOBLQnsXVtkKseN5yyoPTmUjzd'
    };
    var content = qs.stringify(data);
    console.log('---------new request: /stock/v1/current----------');
    console.log('symbol: ', req.query.symbol);
    var options = {
        hostname: 'api.worldtradingdata.com',
        port: 443,
        path: '/api/v1/stock?' + content,
        method: 'GET'
    };
    let result = '';
    https.get(options, function(request, response){
        console.log('send request');
        console.log(content);
        request.on('data', function(data){
            result += data;
        })
        request.on('end', function(){
            console.log('----------result------------');
            console.log(result);
            let obj = JSON.parse(result);
            var back = {
                'symbol': obj.data[0].symbol,
                'price': obj.data[0].price,
                'day_change': obj.data[0].day_change,
                'change_pct': obj.data[0].change_pct
            }
            console.log('----------response------------');
            console.log(JSON.stringify(back));
            res.json(back);
        })
    });
})

/**
 * Description: To get the stock price of intraday
 */
app.get('/stock/v1/intraday', function(req, res){
    if(req.query.symbol == null || req.query.interval == null)
    {
        let str = ' Missing';
        if(req.query.symbol == null)
        {
            str += " 'symbol'";
        }
        if(req.query.interval == null)
        {
            str += " 'interval'";
        }
        console.log("Parameter Error!" + str);
        res.send("Parameter Error!" + str);
        return;
    }
    else if(req.query.interval != '1' && req.query.interval != '2' && req.query.interval != '5'
    && req.query.interval != '60')
    {
        console.log("Parameter Error! 'interval' should be in (1, 2, 5, 60)");
        res.send("Parameter Error! 'interval' should be in (1, 2, 5, 60)");
        return;
    }
    var data = {
        'symbol': req.query.symbol,
        'interval': req.query.interval,
        'sort': 'asc',
        'range': '1',
        'api_token': 'elXrkfeeorHtaT6TYpDTBi84mT1B6b3abFVOBLQnsXVtkKseN5yyoPTmUjzd'
    };
    var content = qs.stringify(data);
    console.log('---------new request: /stock/v1/intraday----------');
    console.log('symbol: ', req.query.symbol, '| interval: ', req.query.interval);
    var options = {
        hostname: 'intraday.worldtradingdata.com',
        port: 443,
        path: '/api/v1/intraday?' + content,
        method: 'GET'
    };
    let result = '';
    https.get(options, function(request, response){
        console.log('send request');
        console.log(content);
        request.on('data', function(data){
            result += data;
        })
        request.on('end', function(){
            console.log('----------result------------');
            console.log(result);
            let obj = JSON.parse(result);
            var back = {
                'symbol': obj.symbol,
                'intraday': obj.intraday
            }
            console.log('----------response------------');
            console.log(JSON.stringify(back));
            res.json(back);
        })
    });
})

/**
 * Description: To get the stock price of each day in a period
 */
app.get('/stock/v1/period', function(req, res){
    // check parameters
    if(req.query.symbol == null || req.query.date_from == null || req.query.date_to == null)
    {
        let str = ' Missing';
        if(req.query.symbol)
        {
            str += " 'symbol'";
        }
        if(req.query.date_from == null)
        {
            str += " 'date_from'";
        }
        if(req.query.date_to == null)
        {
            str += " 'date_to'";
        }
        console.log("Parameter Error!" + str);
        res.send("Parameter Error!" + str);
        return;
    }

    //check date format
    var dateFormat =/^(\d{4})-(\d{2})-(\d{2})$/;
    if(!dateFormat.test(req.query.date_from) || !dateFormat.test(req.query.date_to))
    {
        console.log("Parameter Error! Date should be YYYY-MM-DD");
        res.send("Parameter Error! Date should be YYYY-MM-DD");
        return;
    }

    //compare date_from and date_to
    var arr = req.query.date_from.split('-');
    var startTime = new Date(arr[0], arr[1], arr[2]);
    var startTimes = startTime.getTime();
    var arrs = req.query.date_to.split("-");
    var endTime = new Date(arrs[0], arrs[1], arrs[2]);
    var endTimes = endTime.getTime();
    if(endTimes < startTimes)
    {
        console.log("Parameter Error! 'date_from' should be smaller than 'date_to'");
        res.send("Parameter Error! 'date_from' should be smaller than 'date_to'");
        return;
    }

    var data = {
        'symbol': req.query.symbol,
        'date_from': req.query.date_from,
        'date_to': req.query.date_to,
        'sort': 'asc',
        'api_token': 'elXrkfeeorHtaT6TYpDTBi84mT1B6b3abFVOBLQnsXVtkKseN5yyoPTmUjzd'
    };
    var content = qs.stringify(data);
    console.log('---------new request: /stock/v1/period----------');
    console.log('symbol: ', req.query.symbol, '| date_from: ', req.query.date_from, '| date_to: ', req.query.date_to);
    var options = {
        hostname: 'api.worldtradingdata.com',
        port: 443,
        path: '/api/v1/history?' + content,
        method: 'GET'
    };
    let result = '';
    https.get(options, function(request, response){
        console.log('send request');
        console.log(content);
        request.on('data', function(data){
            result += data;
        })
        request.on('end', function(){
            console.log('----------result------------');
            console.log(result);
            let obj = JSON.parse(result);
            var back = {
                'symbol': obj.name,
                'history': obj.history
            }
            console.log('----------response------------');
            console.log(JSON.stringify(back));
            res.json(back);
        })
    });
})

var server = app.listen(8081, function(){
    var host = server.address().address;
    var port = server.address().port;
    console.log("address is http://%s:%s", host, port);
})
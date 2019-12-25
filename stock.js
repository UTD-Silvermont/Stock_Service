var express = require('express');
var app = express();
var qs = require('querystring');
var https = require('https');
var http = require('http');
var cors = require('cors');

app.use(cors());
var enableLog = 0;

var bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '1mb'}));  
app.use(bodyParser.urlencoded({           
  extended: true
}));

function getCDT() {
    var timelagging = 6; // 5 or 6
    var utc = new Date();
    var cdt = new Date(utc.getTime()-((1 * 60 * 60 * 1000) * timelagging));
    return cdt;
}

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

function generateDate(date) {
    dateTran = date.replace(/-/g,"/");
    dateObj = new Date(dateTran);
    return dateObj;
}

function getFirstInMonth()
{
    now = getCDT();
    year = now.getFullYear();
    month = now.getMonth() + 1;
    if(month < 10)
    {
        monthStr = '0' + String(month);
    }
    else
    {
        monthStr = month;
    }
    dateStr = [year, monthStr, '01'].join('-');
    return dateStr;
}

function getFirstInYear()
{
    now = getCDT();
    year = now.getFullYear();
    dateStr = [year, '01', '01'].join('-');
    return dateStr;
}

function getPast5Years()
{
    now = getCDT();
    year = now.getFullYear() - 4;
    month = now.getMonth() + 1;
    date = now.getDate();
    if(month < 10)
    {
        monthStr = '0' + String(month);
    }
    else
    {
        monthStr = month;
    }
    if(date < 10)
    {
        dateStr = '0' + String(date);
    }
    else
    {
        dateStr = date;
    }
    dateStr = [year, monthStr, dateStr].join('-');
    return dateStr;
}

function getCDTStr()
{
    date = getCDT();
    var y = date.getFullYear();  
    var m = date.getMonth() + 1;  
    m = m < 10 ? ('0' + m) : m;  
    var d = date.getDate();  
    d = d < 10 ? ('0' + d) : d;  
    return y + '-' + m + '-' + d; 
}

function addNewest(symbol, res, obj)
{
    var data = {
        'symbol': symbol,
        'sort_order': 'asc',
        'api_token': 'elXrkfeeorHtaT6TYpDTBi84mT1B6b3abFVOBLQnsXVtkKseN5yyoPTmUjzd'
    };
    var content = qs.stringify(data);
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
            let obj2 = JSON.parse(result);
            var temp = {
                'open': obj2.data[0].price_open,
                'close': obj2.data[0].price,
                'high': obj2.data[0].day_high,
                'low': obj2.data[0].day_low,
                'volume': obj2.data[0].volume
            }
            obj.history[getCDTStr()] = temp;
            var back = {
                'symbol': obj.name,
                'history': obj.history
            }
            if(enableLog == 1)
            {
                console.log('----------result------------');
                console.log(result2);
                console.log('----------response------------');
                console.log(JSON.stringify(back));
            }          
            res.json(back);
        })
    })
}

app.post('/stock/v1/current-list', function(req, res){
    var jsonStr;
    if(req.body.data)
    {
        console.log(req.body.data);
        jsonStr = req.body.data;
    }
    else
    {
        res.send("Please set Content-Type=application/json");
        return;
    }
    if(jsonStr.length == 0)
    {
        console.log("Parameter Error! Missing 'symbol'!");
        res.send("Parameter Error! Missing 'symbol'!");
        return;
    }
    var data = {
        'sort_order': 'asc',
        'api_token': 'elXrkfeeorHtaT6TYpDTBi84mT1B6b3abFVOBLQnsXVtkKseN5yyoPTmUjzd'
    };
    var symbol = "symbol=";
    for(var t in jsonStr)
    {
        if(t == 0)
        {
            symbol = symbol + (jsonStr[t].symbol);
        }
        else
        {
            symbol = symbol + "," + (jsonStr[t].symbol);
        }
       
    }
    console.log(symbol);
    var content = qs.stringify(data);
    console.log('---------new post request: /stock/v1/current----------');
    console.log('time: ', getCDT());
    //console.log('symbol: ', data.symbol);
    var options = {
        hostname: 'api.worldtradingdata.com',
        port: 443,
        path: '/api/v1/stock?' + symbol + "&" + content,
        method: 'GET'
    };
    let result = '';
    https.get(options, function(request, response){
        console.log('send request');
        console.log(options.path);
        request.on('data', function(data){
            result += data;
        })
        request.on('end', function(){
            let obj = JSON.parse(result);
            var back = [];
            for(var t in obj.data)
            {
                var temp = {};
                temp.key = t;
                temp.symbol = obj.data[t].symbol;
                temp.price = obj.data[t].price;
                temp.day_change = obj.data[t].day_change;
                temp.change_pct = obj.data[t].change_pct;
                temp.name = obj.data[t].name;
                back.push(temp);
            }
            var backJSON = {'data': back};
            if(enableLog == 1)
            {
                console.log('----------result------------');
                //console.log(result);
                console.log('----------response------------');
                //console.log(JSON.stringify(back));
            }          
            res.json(backJSON);
        })
    });
})

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
    console.log('time: ', getCDT());
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
            
            let obj = JSON.parse(result);
            var back = {
                'symbol': obj.data[0].symbol,
                'price': obj.data[0].price,
                'day_change': obj.data[0].day_change,
                'change_pct': obj.data[0].change_pct,
                'name': obj.data[0].name
            }
            if(enableLog == 1)
            {
                console.log('----------result------------');
                console.log(result);
                console.log('----------response------------');
                console.log(JSON.stringify(back));
            }          
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
    console.log('time: ', getCDT());
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
            let obj = JSON.parse(result);
            var back = {
                'symbol': obj.symbol,
                'history': obj.intraday
            }
            if(enableLog == 1)
            {
                console.log('----------result------------');
                console.log(result);
                console.log('----------response------------');
                console.log(JSON.stringify(back));
            }    
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
    console.log('time: ', getCDT());
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
            let obj = JSON.parse(result);
            var back = {
                'symbol': obj.name,
                'history': obj.history
            }
            if(enableLog == 1)
            {
                console.log('----------result------------');
                console.log(result);
                console.log('----------response------------');
                console.log(JSON.stringify(back));
            }    
            res.json(back);
        })
    });
})

/**
 * Description: To get the stock price of current week
 */
app.get('/stock/v1/current-week', function(req, res){
    // check parameters
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
    var now = getCDT();
    var day = now.getDay();
    if(day == 0)day = 7;
    var data = {
        'symbol': req.query.symbol,
        'interval': req.query.interval,
        'sort': 'asc',
        'range': day,
        'api_token': 'elXrkfeeorHtaT6TYpDTBi84mT1B6b3abFVOBLQnsXVtkKseN5yyoPTmUjzd'
    };
    var content = qs.stringify(data);
    console.log('---------new request: /stock/v1/current-week----------');
    console.log('time: ', getCDT());
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
            let obj = JSON.parse(result);
            var back = {
                'symbol': obj.symbol
            }
            for(var t in obj.intraday)
            {
                time = generateDate(t);
                now = getCDT();
                interval = now.getDay();
                if(interval == 0)interval = 7;
                diff = now.getDate() - time.getDate();
                if(diff < 0)
                {
                    maxDate = new Date(time.getFullYear(), time.getMonth()+1, 0).getDate();
                    diff = maxDate - time.getDate() + now.getDate();
                }
                if(diff >= interval)
                {
                    delete obj.intraday[t];
                }
            }
            back.history = obj.intraday;
            if(enableLog == 1)
            {
                console.log('----------result------------');
                console.log(result);
                console.log('----------response------------');
                console.log(JSON.stringify(back));
            }    
            res.json(back);
        })
    });
})

/**
 * Description: To get the stock price of past week
 */
app.get('/stock/v1/past-week', function(req, res){
    // check parameters
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
    var now = getCDT();
    var day = now.getDay();
    if(day == 0)day = 7;
    var data = {
        'symbol': req.query.symbol,
        'interval': req.query.interval,
        'sort': 'asc',
        'range': day + 5,
        'api_token': 'elXrkfeeorHtaT6TYpDTBi84mT1B6b3abFVOBLQnsXVtkKseN5yyoPTmUjzd'
    };
    var content = qs.stringify(data);
    console.log('---------new request: /stock/v1/past-week----------');
    console.log('time: ', getCDT());
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
            let obj = JSON.parse(result);
            var back = {
                'symbol': obj.symbol
            }

            for (var t in obj.intraday)
            {
                time = generateDate(t);
                now = getCDT();
                interval = now.getDay();
                if(interval == 0)interval = 7;
                diff = now.getDate() - time.getDate();
                if(diff < 0)
                {
                    maxDate = new Date(time.getFullYear(), time.getMonth()+1, 0).getDate();
                    diff = maxDate - time.getDate() + now.getDate();
                }
                if(diff >= interval + 7)
                {
                    delete obj.intraday[t];
                    continue;
                }
                if(diff < interval)
                {
                    delete obj.intraday[t];
                }
            }
            back.history = obj.intraday;
            if(enableLog == 1)
            {
                console.log('----------result------------');
                console.log(result);
                console.log('----------response------------');
                console.log(JSON.stringify(back));
            }    
            res.json(back);
        })
    });
})


/**
 * Description: To get the month-to-date stock price
 */
app.get('/stock/v1/month-to-date', function(req, res){
    // check parameters
    if(req.query.symbol == null)
    {
        console.log("Parameter Error! Missing 'symbol'!");
        res.send("Parameter Error! Missing 'symbol'!");
        return;
    }
    var data = {
        'symbol': req.query.symbol,
        'date_from': getFirstInMonth(),
        'date_to': getCDTStr(),
        'sort': 'asc',
        'api_token': 'elXrkfeeorHtaT6TYpDTBi84mT1B6b3abFVOBLQnsXVtkKseN5yyoPTmUjzd'
    };
    var content = qs.stringify(data);
    console.log('---------new request: /stock/v1/past-week----------');
    console.log('time: ', getCDT());
    console.log('symbol: ', req.query.symbol);
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
            let obj = JSON.parse(result);
            if(enableLog == 1)
            {
                console.log('----------result------------');
                console.log(result);
            }   
            addNewest(req.query.symbol, res, obj);
        })
    });
})

/**
 * Description: To get the year-to-date stock price
 */
app.get('/stock/v1/year-to-date', function(req, res){
    // check parameters
    if(req.query.symbol == null)
    {
        console.log("Parameter Error! Missing 'symbol'!");
        res.send("Parameter Error! Missing 'symbol'!");
        return;
    }
    var data = {
        'symbol': req.query.symbol,
        'date_from': getFirstInYear(),
        'date_to': getCDTStr(),
        'sort': 'asc',
        'api_token': 'elXrkfeeorHtaT6TYpDTBi84mT1B6b3abFVOBLQnsXVtkKseN5yyoPTmUjzd'
    };
    var content = qs.stringify(data);
    console.log('---------new request: /stock/v1/past-week----------');
    console.log('time: ', getCDT());
    console.log('symbol: ', req.query.symbol);
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
            let obj = JSON.parse(result);
            if(enableLog == 1)
            {
                console.log('----------result------------');
                console.log(result);
            }    
            addNewest(req.query.symbol, res, obj);
        })
    });
})

/**
 * Description: To get the stock price of past 5 years
 */
app.get('/stock/v1/past-5-years', function(req, res){
    // check parameters
    if(req.query.symbol == null)
    {
        console.log("Parameter Error! Missing 'symbol'!");
        res.send("Parameter Error! Missing 'symbol'!");
        return;
    }
    var data = {
        'symbol': req.query.symbol,
        'date_from': getPast5Years(),
        'date_to': getCDTStr(),
        'sort': 'asc',
        'api_token': 'elXrkfeeorHtaT6TYpDTBi84mT1B6b3abFVOBLQnsXVtkKseN5yyoPTmUjzd'
    };
    var content = qs.stringify(data);
    console.log('---------new request: /stock/v1/past-week----------');
    console.log('time: ', getCDT());
    console.log('symbol: ', req.query.symbol);
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
            let obj = JSON.parse(result);
            if(enableLog == 1)
            {
                console.log('----------result------------');
                console.log(result);
            }    
            addNewest(req.query.symbol, res, obj);
        })
    });
})

const PORT = process.env.PORT || 81;
var server = app.listen(PORT, function(){
    var host = server.address().address;
    var port = server.address().port;
    console.log("address is http://%s:%s", host, port);
})
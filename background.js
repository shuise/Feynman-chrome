//API list
const domain = 'https://notes.bluetech.top1/api';
const APIs = {
    User: {
    	login: 'post@/user/login'
    },
    Topic: {
    	list: 'get@/tag'
    },
    Article: {
        add: 'post@/article',
        detail: 'get@/article/{id}',
        notes: 'get@/article/item',
        publish: 'post@/article/{id}/published'
    },
    weRead: {
        books: 'get@https://i.weread.qq.com/user/notebooks',
        notes: 'get@https://i.weread.qq.com/book/bookmarklist?bookId={bookId}',
        summarys: 'get@https://weread.qq.com/web/review/list?bookId={bookId}&listType=11&maxIdx=0&count=0&listMode=2&synckey=0&userVid=387886832&mine=1',
    }
};

const feynmanRequestServer = function(params, callback) {
    let key = params.api || '';
    if(!key){
        return;
    }

    let keys = key.split('.');
    let url = APIs[keys[0]][keys[1]];
    let urls = url.split('@');
    let method = urls[0].toUpperCase();
    let api = urls[1];
    // console.log(api, urls[1].indexOf('http'));
    if(urls[1].indexOf('http') != 0){
        api = domain + urls[1];   
    }
    let data = params.data || {};

    if(data.constructor.name == 'Object'){
        api = subs(api, data);
    };

    let r = new Date().getTime();
    if(method == 'GET'){
        if(api.indexOf('?') == -1){
            api += '?t=' + r;
        }else{
            api += '&t=' + r;
        }
        for(var prop in data){
            api = api + '&' + prop + '=' + data[prop];
        }
    }

    let requestParams = {
        headers: new Headers({
            'Content-Type': 'application/json',
            'token': params.token || ''
        }),
        method: method,
        credentials: 'include'
    };

    if(method != 'GET'){
        data.r = r;
        requestParams.body = JSON.stringify(data);
    }

    console.log(api, requestParams);

    fetch(api, requestParams).then(function(response) {
        //打印返回的json数据
        console.log(api, response);
        response.json().then(function(result) {
            resultCheck(result, callback);
        })
    }).catch(function(e) {
        resultCheck({
            code: 'fail',
            msg: e
        }, callback);
    });

    function resultCheck(result, callback) {
        // console.log('11111111111',result, callback);
        if (result.code == '0') {
            callback(null, result);
        } else if (result.code == -1006) {
            console.log('账号过期，请重新登录');
            // localStorage.clear();
            location.href = './index.html?t=' + Math.random();
        } else {
            callback(null, result);
        }
    }

    function subs(temp, data, regexp){
        if(!(Object.prototype.toString.call(data) === "[object Array]")) data = [data];
        var ret = [];
        for (var i = 0, j = data.length; i < j; i++) {
            ret.push(replaceAction(data[i]));
        }
        return ret.join("");
        function replaceAction(object){
            return temp.replace(regexp || (/\\?\{([^}]+)\}/g), function(match, name){
                if (match.charAt(0) == '\\') return match.slice(1);
                return (object[name] != undefined) ? object[name] : '';
            });
        }
    }
}

//异步通讯，接受创建请求、数据缓存
chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        if(request.type == 'request'){
            feynmanRequestServer(request, function(err, res){
                res = res || {};
                console.log('back', res, request, sender);
                sendResponse(res);
            });      
        }
        if(request.type == 'setCookie'){
            let expirationDate = new Date().getTime()/1000 + 30*24*60*60;
            let value = JSON.stringify(request.value);
            let key = request.name;
            chrome.cookies.set({
                url: domain,
                name: key,
                value: value,
                path: '/',
                expirationDate: expirationDate
            }, function(cookie){
                console.log('set', cookie, request)
                sendResponse(request);
            });
        }
        if(request.type == 'getCookie'){
            let key = request.name;
            chrome.cookies.get({
                url: domain,
                name: key
            }, function(cookie){
                console.log('get', cookie, request);
                sendResponse(cookie || {});
            });
        }
    }
);

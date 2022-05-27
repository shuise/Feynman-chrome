window.CRS = {};

CRS.debugger = true;

CRS.log = function(info){
    if(CRS.debugger){
        console.log(info);
    }
}

CRS.removeHTML = function removeHTMLTag(str) {
    str = str.replace(/<\/?[^>]*>/g,''); //去除HTML tag
    // str = str.replace(/[ | ]*\n/g,'\n'); //去除行尾空白
    //str = str.replace(/\n[\s| | ]*\r/g,'\n'); //去除多余空行
    str=str.replace(/&nbsp;/ig,'');//去掉&nbsp;
    return str;
}

CRS.loadJS = function(links,callback){
    var total = links.length;
    var steps = 0;

    for(var i=0;i<links.length;i++){
        load(links[i]);
    }

    function load(url){
        var node = document.createElement("script");
        node.src = url;
        document.getElementsByTagName('head')[0].appendChild(node);
        node.onload = function(){
            steps += 1;
            if( steps >= total ){
                callback && callback();
            }
        };
    }
}

CRS.jsonMerge = function(a, b, isWrite, filter){
    for (var prop in b)
        if (isWrite || typeof a[prop] === 'undefined' || a[prop] === null)
            a[prop] = filter ? filter(b[prop]) : b[prop];
    return a;
}

CRS.guid = function(){
    return 'mf-' + (Math.random() * (1 << 30)).toString(16).replace('.', '');
}

CRS.trim = {
    left : function(str){
        return str.replace( /^\s*/, '');
    },
    right : function(str){
        return str.replace(/(\s*$)/g, "");
    },
    both : function(str){
        return str.replace(/^\s+|\s+$/g,"");
    },
    all : function(str){
        return str.replace(/\s+/g,"");
    }
}

//cache
CRS.cache = (function() {
    /*
    说明：
    1: JSON.stringfy --> set --> get --> JSON.parse
    2: data format well return as set`s
    3: undefined in array will be null after stringfy+parse
    4: NS --> namespace 缩写
    */
    var keyNS = 'shuise-default-';

    function get(key) {
        /*
        legal data: "" [] {} null flase true

        illegal: undefined
            1: key not set
            2: key is cleared
            3: key removed
            4: wrong data format
        */
        var tempKey = keyNS + key;
        if (!isKeyExist(tempKey)) {
            return null;
        }
        // maybe keyNS could avoid conflict
        var val = localStorage.getItem(tempKey) || sessionStorage.getItem(tempKey);
        val = JSON.parse(val);
        // val format check
        if (val !== null
            && Object.prototype.hasOwnProperty.call(val, 'type')
            && Object.prototype.hasOwnProperty.call(val, 'data')) {
            return val.data;
        }
        return null;
    }
    // isPersistent
    function set(key, val, isTemp) {
        var store;
        if (isTemp) {
            store = sessionStorage;
        } else {
            store = localStorage;
        }
        store.setItem(keyNS + key, JSON.stringify({
            data: val,
            type: (typeof val)
        }));
    }

    function remove(key) {
        var tempKey = keyNS + key;
        localStorage.removeItem(tempKey);
        sessionStorage.removeItem(tempKey);
    }

    function isKeyExist(key) {
        // do not depend on value cause of ""和0
        return Object.prototype.hasOwnProperty.call(localStorage, key)
            || Object.prototype.hasOwnProperty.call(sessionStorage, key);
    }

    function setKeyNS(NS) {
        var isString = typeof NS === 'string';
        if (isString && NS !== '') {
            keyNS = NS;
        }
    }

    return {
        setKeyNS: setKeyNS,
        get: get,
        set: set,
        remove: remove
    };
})();


CRS.subs = function(temp, data, regexp){
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

CRS.getPara = function(url,name){
    // url = url.split("&apm;").join("&");
    if(url == ''){
        return '';
    }

    var v = '', _p = name + '=';

    if(url.indexOf("&" + _p)>-1){
        v = url.split("&" + _p)[1] || '';
    }

    if(url.indexOf("?" + _p)>-1){
        v = url.split("?" + _p)[1] || '';
    }
    v = v.split("&")[0] || '';
    return v;
}

CRS.dateFormat = function(date, fmt) {
    fmt = fmt || 'yyyy-MM-dd hh:mm:ss';
    var dateObj;
    if(date){
        dateObj = new Date(date);
    }else{
        return '';
    }

    var o = {
        "M+" : dateObj.getMonth()+1,                 //月份
        "d+" : dateObj.getDate(),                    //日
        "h+" : dateObj.getHours(),                   //小时
        "m+" : dateObj.getMinutes(),                 //分
        "s+" : dateObj.getSeconds(),                 //秒
        "q+" : Math.floor((dateObj.getMonth()+3)/3), //季度
        "S"  : dateObj.getMilliseconds()             //毫秒
    };
    if(/(y+)/.test(fmt)) {
        fmt=fmt.replace(RegExp.$1, (dateObj.getFullYear()+"").substr(4 - RegExp.$1.length));
    }
    for(var k in o) {
        if(new RegExp("("+ k +")").test(fmt)){
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
        }
    }
    return fmt;
}

CRS.qrcode = function(data, callback){
    var size = 480;
    var url = data.url;

    var logo = data.logo;
    var canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    var context = canvas.getContext("2d");

    var node = document.createElement("div");
    new QRCode(node, url.toString());
    setTimeout(draw, 0);

    function draw(){
        var qcodeOrg = node.getElementsByTagName("img")[0].src;
        var img = new Image();
        img.src  = qcodeOrg;
        context.drawImage(img, 0, 0, size, size);
        // var newImageData = canvas.toDataURL("image/png");
        // callback(newImageData);
        if(!logo){
            let newImageData = canvas.toDataURL("image/png");
            callback(newImageData);
            return;
        }
        var img2 = new Image();
        img2.src  = logo;
        
        img2.onload = function(){
            context.drawImage(img2, 200, 200, 80, 80);
            let newImageData = canvas.toDataURL("image/png");
            callback(newImageData);
        }
    }
}

CRS.print = function(obj){
    var newWindow = window.open("打印窗口","_blank");
    var docStr = obj.innerHTML;
    newWindow.document.write('<lin' + 'k hr' + 'ef="./ui/print.css?print" re' + 'l="stylesheet" med' + 'ia="pri' + 'nt">');
    newWindow.document.write(docStr);
    newWindow.document.close();
    newWindow.print();
    newWindow.close();
}

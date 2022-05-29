(function() {
    let url = location.href;
    let host = location.host;
    let pageId = md5(url);

    // let currentPage = {
    //     data: {
    //         pageId: pageId,
    //         title: '',
    //         url: url,
    //         banner: ''
    //     },
    //     getTitle: function() {},
    //     init: function(){}
    // };

    function currentPage(){
        let data = {
            pageId: pageId,
            title: '',
            url: url,
            banner: ''
        };


        function init(){
            let title = getTitle();
            data.title = title;
        }

        function getTitle() {
            /*
            rules 服务器端
            */

            let rules = {
                '.dedao.cn': {
                    title: '.audio-title',
                    content: ''
                },
                '.feishu.cn': {
                    title: '.op-symbol',
                    content: ''
                },
                '.github.com': {
                    title: '',
                    content: '#readme'
                },
            };

            if (.indexOf('.dedao.cn') > -1) {
                let obj = document.querySelector('.audio-title');
                return obj.innerText;
            }
            if (location.host.indexOf('.feishu.cn') > -1) {
                let obj = document.querySelector('.op-symbol');
                return obj.innerText;
            }

            let h1 = document.querySelector('h1') || {};
            let h2 = document.querySelector('h2') || {};
            let h3 = document.querySelector('h3') || {};
            let title = h1.innerText || h2.innerText || h3.innerText;
            title = document.title || title || '';

            //title 需要不变，才能提供唯一的连续识别依赖。
            let _title = document.body.innerText;
            return title || _title;
        }

        return {
            data: data,
            init: init
        }
    }

    let Article = {
        data: {
            id: '',
            title: '',
            topicIds: [],
            banner: '',
            originUrl: '',
            qrcode: '',
            public: 0
        },
        saveTags: function() {
            let tags = this.article.tags;
            tags = Article.getTags(tags);
        },
        loadTplRules: function(){},
        cache: function(){},
        loadFromCloud: function(){},
        merge: function(){},
        export: function(){
            var documentClone = document.cloneNode(true);
            var article = new Readability(documentClone).parse();
            let html = article.content;
            let md = html2md(html);
            md += '\n\n 来源：' + location.href + '\n\n'

            let zkCard = CRS.dateFormat(new Date(), 'yyyyMMddhhmm');
            let fileName = this.article.title || zkCard;
            fileName = fileName + '-原文.md';
            let file = new File([md], fileName, {
                "type": "text\/plain"
            });
            let objectUrl = URL.createObjectURL(file);
            this.download(objectUrl, fileName);
        },
        setBanner: function(refresh) {
            //从页面中选择一个有效的且高宽 > 200 的图片
            let bannerKey = this.pageId + '-banner';
            let banner = CRS.cache.get(bannerKey) || '';
            if (banner && !refresh) {
                this.article.banner = banner;
                return;
            }

            let imgs = document.querySelectorAll('img');
            let banners = [];
            for (var i = 0; i < imgs.length; i++) {
                if (imgs[i].src && imgs[i].clientHeight >= 120 && imgs[i].clientWidth >= 120) {
                    banners.push(imgs[i].src);
                }
            }
            //填充 1 张，后续可以考虑 AI 生成。
            if (banners.length == 0) {
                // let index = encodeURIComponent(location.href).length%10 + 1;
                let index = Math.ceil(Math.random() * 99999) % 10 + 1;
                let bannerSystem = 'https://notes.bluetech.top/libs/covers/' + index + '.png';
                banners.push(bannerSystem);
            }
            this.banners.data = banners;

            let index = this.banners.index;
            let next = (index + 1) % banners.length;
            this.article.banner = banners[next];
            this.banners.index = next;

            CRS.cache.set(bannerKey, banners[next]);
        },
        setPasteBanner: function(){
            let count = 0;
            let t = setInterval(function() {
                if (_this.article.banner.indexOf('http') == 0 || count >= 100) {
                    clearInterval(t);
                }
                count += 1;
                _this.setArticleInfo();
            }, 50);
            this.setPasteImage();

            setPasteImage: function() {
                let _this = this;

                document.addEventListener("paste", getClipboardData);
                document.addEventListener("copy", getClipboardData);

                function getClipboardData(e) {
                    var clipboardData = e.clipboardData;
                    var types = clipboardData.types;

                    //复制图片地址贴入
                    let str = clipboardData.getData('text/plain');

                    if (isUrl(str)) {
                        showResult({
                            file: str
                        });
                        return;
                    }

                    console.log(clipboardData, types, str);

                    var isFile = types.indexOf("Files") > -1;
                    var isCaptrue = types.indexOf("text/plain") == -1;

                    //粘贴截图
                    if (isFile && isCaptrue) {
                        var item = clipboardData.items[0];
                        item = item.getAsFile();
                        console.log('paste shot', item);
                        getBase64File(item, showResult);
                    }

                    //对复制图片的处理，非截图 
                    if (isFile && !isCaptrue) {
                        var item = clipboardData.items[1];
                        item = item.getAsFile();
                        console.log('paste file', item);
                        getBase64File(item, showResult);
                    }
                }

                function showResult(data) {
                    if (!data.file) {
                        return;
                    }
                    _this.article.banner = data.file;
                    let bannerKey = _this.pageId + '-banner';
                    CRS.cache.set(bannerKey, data.file);
                }

                function getBase64File(file, callback) {
                    if (!file) {
                        callback({});
                        return;
                    }
                    var reader = new FileReader();
                    reader.readAsDataURL(file);

                    reader.onload = function(event) {
                        var base64Code = event.target.result;

                        callback({
                            file: base64Code,
                            type: file.type
                        });
                    }
                }

                function isUrl(str) {
                    let flag = '';
                    try {
                        let url = new URL(str);
                        if (url.host) {
                            flag = 'ok'
                        }
                    } catch (e) {
                        flag = 'no';
                    }
                    return flag == 'ok';
                }
            }
        },
        setArticleInfo: function() {
            let _this = this;
            let title = _this.getTitle();
            let originUrl = location.href;
            this.setBanner(false);
            this.article.title = title;
            this.article.originUrl = originUrl;
            this.article.tags = CRS.cache.get('article-tags');
        },
        save2cloud: function(callback) {
            let _this = this;
            let data = this.article;
            let notes = this.notes;

            if (notes.length == 0) {
                alert('无笔记');
                return;
            }

            let paragraphs = [];
            _.each(notes, function(item) {
                paragraphs.push({
                    note: item.text,
                    summary: item.tip || '',
                    markTime: item.time,
                    sort: item.y
                });
            });
            data.paragraphs = paragraphs;

            let host = location.host;
            let uniqueId = md5(data.title + host);
            data.uniqueId = uniqueId;
            data.tagIds = data.topicIds;

            data.labels = _this.getTags(data.tags);


            let pageId = this.pageId;
            let extra = CRS.cache.get(pageId);
            data.extra = JSON.stringify(extra);

            //防止标题过长
            data.title = data.title.substring(0, 200);

            feynmanRequest({
                api: 'Article.add',
                type: 'request',
                token: _this.token,
                data: data
            }, function(res) {
                console.log('Article.add', data, res, _this.article);
                callback(res.data);
                _this.article.id = res.data.id;
                CRS.cache.set('article', _this.article);
            });
        },
        publish: function(data, callback) {
            let _this = this;
            feynmanRequest({
                api: 'Article.publish',
                token: _this.token,
                type: 'request',
                data: data
            }, function(res) {
                console.log('Article.publish', data, res);
                let params = {
                    account: _this.userInfo.account,
                    uniqueId: data.uniqueId
                };
                let link = 'https://notes.bluetech.top/published/{account}/{uniqueId}.html';
                link = CRS.subs(link, params);
                callback(link);
            });
        },
    }
                
    let Notes = {
        data: {
            list: [],
            articleId: '',
            pageId: ''
        },
        export: function(){}
    };

    let Note = {
        data: {
            name: '',
            image: '',
            styleType: '',
            status: '',
            prog: '生成中…'
        },
        createCard: function(){},
        downloadCard: function(){},
    };

    //weread books
    let Articles = {
        data: [],
        loadBooks: function(callback) {
            let _this = this;
            feynmanRequest({
                api: 'weRead.books',
                type: 'request'
            }, function(res) {
                console.log('weRead.books', res.books);
                _this.books = res.books;
            });
        },
        loadBookNotes: function(book, callback) {
            let _this = this;
            let count = 0;
            let notes = null,
                summarys = null;
            feynmanRequest({
                api: 'weRead.notes',
                type: 'request',
                data: book
            }, function(res) {
                console.log('weRead.notes', res);
                count += 1;
                notes = res;
                callbacks();
                // callback(res.books);
            });

            feynmanRequest({
                api: 'weRead.summarys',
                type: 'request',
                data: book
            }, function(res) {
                console.log('weRead.summarys', res);
                count += 1;
                summarys = res;
                callbacks();
                // callback(res.books);
            });

            function callbacks() {
                if (count < 2) {
                    return;
                }
                let reviews = {};
                _.each(summarys.reviews, function(item) {
                    reviews[item.review.range] = item.review;
                });
                notes.reviews = reviews;
                callback(notes);
            }
        },
    };

    let User = {
        data: {
            homepage: '', 
            account: '',
            password: '',
            token: '',
            isLogin: false
        },
        cache: function(){},
        login: function(callback) {
            let _this = this;
            let userInfo = _this.userInfo;
            console.log(userInfo);
            if (!userInfo.account || !userInfo.password) {
                alert('请输入用户名和密码')
                return;
            };
            // userInfo.password = md5(userInfo.password);

            //用户名正则，4到16位（字母，数字，下划线，减号）
            var accountPattern = /^[a-zA-Z0-9_-]{6,50}$/;
            if (!accountPattern.test(userInfo.account)) {
                alert('用户名只允许使用字母、数字、下划线和减号，长度为 6~50');
                return;
            }

            var pswPattern = /^[a-zA-Z0-9_-]{10,50}$/;
            if (!pswPattern.test(userInfo.password)) {
                alert('密码只允许使用字母、数字、下划线和减号，长度为 10~50');
                return;
            }

            feynmanRequest({
                api: 'User.login',
                type: 'request',
                data: userInfo
            }, function(res) {
                console.log('User.login', res);
                if (res.code != '0') {
                    alert(res.msg);
                    return;
                }

                feynmanRequest({
                    type: 'setCookie',
                    name: 'userInfo',
                    value: res.data
                }, function() {
                    _this.isLogin = false;
                    _this.token = res.data.token;
                    _this.account = res.data.account;
                    callback();
                });
            });
        },
        logout: function() {
            this.token = '';
            let userInfo = this.userInfo;
            userInfo.token = '';

            feynmanRequest({
                type: 'setCookie',
                name: 'userInfo',
                value: userInfo
            }, function() {});
        }
    };

    let Topics = {
        data: [],
        load: function(userInfo, callback) {
            let _this = this;
            console.log('Topic.list token', userInfo, _this.token);
            feynmanRequest({
                api: 'Topic.list',
                type: 'request',
                token: _this.token,
                data: {
                    tagStatus: 'ENABLE'
                }
            }, function(res) {
                console.log('Topic.list', res, res.code);
                console.log('token', _this.token);
                res = res || {};
                if (res.code == '40101') {
                    _this.logout();
                    return;
                };
                _this.topics = res.data || [];
                callback && callback(_this.topics);
            });
        }
    };

    let FeynmanNote = {
        data: {
            //homepage, management
        },
        initFormCloud: function() {
            let _this = this;
            let title = this.getTitle();
            let host = location.host;
            let uniqueId = md5(title + host);

            feynmanRequest({
                api: 'Article.notes',
                type: 'request',
                token: _this.token,
                data: {
                    uniqueId: uniqueId
                }
            }, function(res) {
                console.log('Article.notes', uniqueId, res);
                let data = res.data || {};
                let extra = data.extra || '[]';
                let steps = JSON.parse(extra);
                _this.initPagenote(steps);
            });
        },
        init: function(steps) {
            let _this = this;
            let pageId = _this.pageId;
            // 如何使用 就看这里就好了，使用前，记得先引入 SDK
            window.pagenote = new window.PageNote('Feynman', {
                functionColors: [ // 支持扩展的功能按钮区，
                ],
                categories: [],
                brushes: [ // 画笔
                    {
                        bg: '#FF6900', // rgb 颜色值
                        shortcut: 'p', // 快捷键，可选
                        label: '一级画笔', // 说明
                        level: 1, // 暂不支持
                    }
                ],
                showBarTimeout: 0, // 延迟功能时间 单位毫秒
                renderAnnotation: function(data, light) {
                    // 自定义笔记渲染逻辑，这里可以处理为从服务器端根据 lightId 查询数据来渲染，包括点赞量等数据
                    const element = document.createElement('div');
                    const {
                        tip,
                        lightId,
                        time
                    } = data;
                    const aside = document.createElement('div');
                    aside.innerHTML = `<pagenote-block aria-controls="aside-info">
                    ${new Date(time).toLocaleDateString()}
                    </pagenote-block>`;
                    element.appendChild(aside);

                    element.ondblclick = function() {
                        console.log(light);
                        light.openEditor();
                    };

                    const asides = [];
                    return [null, asides]
                },
                debug: false,
                enableMarkImg: true,
            });

            // 这里可以从服务器端拉取数据，用于 init
            console.log('recovery', steps)
            let data = CRS.cache.get(pageId) || {};
            if (steps.length > 0) {
                data = {
                    steps: steps
                };
            }
            console.log('recovery notes:', data);
            pagenote.init(data); // 初始化开始工作
            _this.notesRefresh(data);

            pagenote.addListener(function(status) {
                console.log(status)
                    // if(status == 10 || status == 3){
                    //  let editor = document.querySelector('pagenote-block[data-role="annotation-editor"]');
                    //  if(editor){
                    //      editor.innerHTML = CRS.removeHTML(editor.innerHTML);    
                    //         var range = window.getSelection();//创建range
                    //         range.selectAllChildren(editor);//range 选择obj下所有子内容
                    //         range.collapseToEnd();//光标移至最后   
                    //  }
                    // }
                let steps = pagenote.plainData.steps || [];
                let isSameCount = steps.length == _this.notes.length;

                if (status === pagenote.CONSTANT.SYNCED) {
                    // localStorage.setItem('shiuse-notes',JSON.stringify(pagenote.plainData))
                    console.log('note update', pagenote.plainData);

                    let notes = [];
                    _.each(steps, function(item) {
                        item.text = CRS.removeHTML(item.text);
                        item.tip = CRS.removeHTML(item.tip);
                        notes.push(item);
                    });

                    pagenote.plainData.steps = notes;
                    // pagenote.init(pagenote.plainData);

                    CRS.cache.set(pageId, pagenote.plainData);
                    _this.notesRefresh(pagenote.plainData);
                    // 数据变化回调，将数据发送到服务器端，在这里处理
                }

                //不强制登录，但只有登录时才能做数据同步。
                //笔记数量有变化时同步，还需要加上定制同步，需要判断笔记内容是否有变更
                console.log(isSameCount, 'isSameCount');
                if (!isSameCount && status == 10) {
                    if (!_this.token) {
                        return;
                    }
                    _this.noteSaveToServer(function() {
                        console.log('保存成功')
                    });
                }
            })
        }
    };

    //回行处理
    function plainFormat(str) {
        str = str.split('\n\n').join('\n');
        str = str.split('\n').join('<br />');
        console.log(str);
        return str;
    }

    //发送创建请求
    function feynmanRequest(data, callback) {
        chrome.extension.sendRequest(data, function(response) {
            callback(response);
        });
    }
})();
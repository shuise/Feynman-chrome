(function() {
    let url = location.href;
    let host = location.host;
    let pageId = md5(url);

    function currentPage(){
        let data = {
            pageId: pageId,
            title: '',
            url: url,
            banner: '',
            banners: []
        };


        function init(){
            let title = getTitle();
            data.title = title;
            data.banners = setBanners();
            data.banner = data.banners[0];
            // console.log('page', data);
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

            if (host.indexOf('.dedao.cn') > -1) {
                let obj = document.querySelector('.audio-title');
                return obj.innerText;
            }
            if (host.indexOf('.feishu.cn') > -1) {
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

        function setBanners() {
            //从页面中选择一个有效的且高宽 > 200 的图片
            let imgs = document.querySelectorAll('img');
            let banners = [];
            for (var i = 0; i < imgs.length; i++) {
                if (imgs[i].src && imgs[i].clientHeight >= 120 && imgs[i].clientWidth >= 120) {
                    banners.push(imgs[i].src);
                }
            }
            return banners;
        }

        return {
            data: data,
            setBanners: setBanners,
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
        init: function() {
            let pageInfo = new currentPage(); 
                pageInfo.init();
            Article.data = pageInfo.data;
            console.log('Article', Article.data);
        }
    }

    let FeynmanNote = {
        data: {},
        init: function(){
            let data = CRS.cache.get(pageId) || {};
            FeynmanNote.data = data;
        },
        start: function() {
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
            pagenote.init('FeynmanNote' ,FeynmanNote.data); // 初始化开始工作

            pagenote.addListener(function(status) {
                let steps = pagenote.plainData.steps || [];
                if (status === pagenote.CONSTANT.SYNCED) {
                    console.log('FeynmanNote', pagenote.plainData);
                    CRS.cache.set(pageId, pagenote.plainData);
                    FeynmanNote.update();
                }
            })
        },
        callbackList: [],
        watch: function(callback){
            FeynmanNote.callbackList.push(callback);
        },
        update: function(){
            let cbs = FeynmanNote.callbackList;
            let data = FeynmanNote.data;
            _.each(cbs, function(cb){
                cb && cb(data);
            });
        }
    };

    window.Article = Article;
    window.FeynmanNote = FeynmanNote;

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
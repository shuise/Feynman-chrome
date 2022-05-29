(function(){
    //https://docs.angularjs.org/tutorial/step_02

    let appTpl = `<div class="feynotes-wrapper" ng-app="phonecatApp">
        <div class="feynotes" ng-controller="infoController">
            <div class="feynote-banner" @click="setBanner(true)">
                <img src="{{ article.banner }}" alt="">
            </div>
            <div class="feynote-header">
                <h2>{{ article.title || 'Feynman 笔记'}}</h2>
            </div>
            <div class="feynote-main">
                <div class="feynote-item" ng-repeat="note in notes">
                    <div class="feynote-item-content">
                        <span>{{ note.text }}</span>
                    </div>
                    <div class="feynote-item-remark">
                        {{ note.tip }}
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    let app = document.createElement('div');
        // app.style.cssText = "position:fixed;right:5px;bottom:5px;background:#333;color:#fff;"
    app.innerHTML = appTpl;
    document.body.appendChild(app);

    
    Article.init();
    setInterval(function(){
        Article.init();
    },10*1000);
    
    FeynmanNote.init();
    FeynmanNote.start();

    var phonecatApp = angular.module('phonecatApp', []);
    phonecatApp.controller('infoController', function PhoneListController($scope) {
        console.log('angular start', Article.data, FeynmanNote.data);
        $scope.article = Article.data;
        $scope.notes = FeynmanNote.data.steps;
        FeynmanNote.watch(function(data){
            console.log('update', data);
            $scope.notes = data.steps;
        });
    });
})();
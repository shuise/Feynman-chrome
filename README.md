# Feynman-extensition

Feynman 笔记的 chrome 扩展源码。

libs/ 里为使用到的一些公共库，特别使用了 pagenote。

代码完全开源，可任意使用。


## 重构思路

1. 抽象业务对象，把所有业务对象及方法分离纯粹
2. 抽象固定主流程
3. 定义适配逻辑，提供适配注入标准
4. 部分适配逻辑移植到服务器端管理

## 现状

1. 使用 vue 在 chrome 扩展 v2 下可以使用，https://notes.bluetech.top
2. v3 版本多了一些限制，为了发布到正式商店，使用 angular 重构（即使测试验证通过了，个人还是有些不喜欢 angular）
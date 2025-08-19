## Bugs
- [x] 修复第一次能够被鼠标拖动，不能选择字幕的问题，使用修饰按键拖动后一点路径就能够选择字幕中的词组。过一段时间又出现能被鼠标直接拖动的问题
- [x] 另外一个问题是当鼠标移动到字幕的时候有可能触发不了暂停播放
- [x] 另外就是还有一个bug 就是添加单词的弹框，我希望我鼠标 hover 在上面的时候希望暂停视频
- [x] 修复但是对于弹框的按钮点击，点击完成之后视频还是一个暂停的状态
- [ ] 一个单词在个显示中被加入生词本 然后 我这边又点击删除了， 这个时候再双击，无效!
- [ ] 如果一个短语跨行了 选择后也不会有浮窗
- [ ] 另外就是如果一个字幕上面已经有单词被标注了，双击其他单词没有显示弹窗。


## Features
- [ ] 双击词组弹窗删除
- [ ] 支持 Netflix
- [ ] 支持不同语言之间的翻译




## Refactor
- [x] 我希望将 content.js 文件进行拆分 openai 的部分拆出单独文件
- [x] 添加单元测试 https://developer.chrome.com/docs/extensions/how-to/test/unit-testing

## 参考
- [ ] https://forum.lingq.com/t/web-browser-extensions-software-for-lingq/72498 

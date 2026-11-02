# 渡鸦管家小程序 V1.5-r39

本目录是独立小程序构建树，不读取 `admin/`、r38、r37 或 r4 中的任何文件。

- 成品：`dist/渡鸦管家-小程序.html`
- 构建：`node tools/build.js`
- 验证：`node tests/verify.js`
- 数据键：`duya-local-r39-data`
- 兼容迁移：r38 → r37 → r26 → 内置初始数据

后台与小程序仅在浏览器运行期共享 `duya-local-r39-data`，文件、源码、资源和构建过程互不依赖。

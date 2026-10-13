# 塔罗图片生成器（GitHub Pages 版）

1. 将你的 `tarot.json` 放到项目根目录；将 156 张 PNG 放到 `images/`；将 `chinese.otf` 放到 `fonts/`。
2. 创建 GitHub 公共仓库，上传项目文件。Settings → Pages → Deploy from a branch → main / (root) → Save。
3. 访问 `https://用户名.github.io/仓库名/`。

注意：目前是在线静态网页第一版，尚未加入 PWA 离线缓存；不要把 API token 或其他密钥上传到公开仓库。牌义读取兼容 `牌名释义: [正位,逆位]`、`牌名释义: 字符串`、`牌名: {正位,逆位}` 等结构；若实际 JSON 不同，需修改 `getMeaning`。

测试：先确认手机能打开网页、牌面预览正常、正逆位对应图片、生成结果显示完整中文释义。GitHub Pages 发布可能需要几分钟。

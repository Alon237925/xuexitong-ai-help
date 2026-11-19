# 超星学习通 AI 助手（V7 浏览器扩展版）

> [!CAUTION]
> **本项目仅限个人学习使用，禁止任何商业用途，商用需获得作者书面许可。**
>
> 本项目采用 **CC BY-NC 4.0**（知识共享署名-非商业性使用 4.0 国际许可协议）开源，严禁任何个人或商家将本项目用于倒卖、收费分发、引流变现或其他任何形式的商业行为。详见 [LICENSE](./LICENSE)。

---

## 功能简介

- **浏览器原生扩展（Manifest V3）**：支持 Chrome / Edge 直接加载，无需油猴或手动粘贴控制台代码
- **可视化配置面板**：点击插件图标即可填写 `API_KEY`、`API_URL`、`MODEL`（默认 `deepseek-flash`），支持一键测试接口连通性
- **页面实时悬浮日志**：右下角悬浮窗展示实时运行状态与作答日志，支持随时暂停/恢复
- **顺序防抢跑巡检**：
  - 自动播放章节视频与处理视频内随堂测验
  - AI 自动完成章节测验（单选 / 多选 / 判断 / 填空），支持抗字体加密乱码语义还原
  - 强制校验每道题的 DOM 勾选状态后再自动提交交卷
  - 智能处理“当前章节还有任务点未完成”弹窗（未作答时点【去学习】，AI 完成一轮作答后自动点【继续下一节】）
  - 后台 Service Worker 代理 AI 请求，规避页面跨域与 CSP 限制

## 安装与使用

1. 下载或克隆本仓库到本地文件夹：
   ```bash
   git clone https://github.com/Alon237925/xuexitong-ai-help.git
   ```
2. 打开浏览器扩展管理页：
   - **Chrome**：地址栏访问 `chrome://extensions/`
   - **Edge**：地址栏访问 `edge://extensions/`
3. 开启右上角 **开发者模式（Developer mode）**。
4. 点击 **加载已解压的扩展程序（Load unpacked）**，选择本项目文件夹。
5. 点击浏览器右上角的插件图标，填入你的 `API_KEY`，点击 **🧪 测试 Key** 确认连通后，点击 **💾 保存并立即运行** 即可。

## 开源协议

本项目基于 [Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/) 许可发布。

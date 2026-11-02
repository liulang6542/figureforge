<div align="center">

# 超级AI绘图

**论文主图（Figure 1）生成工作台**

输入论文内容 → 上传 1–10 张自己的参考图 → 生成主图初稿 → 反解为可编辑图形

![License](https://img.shields.io/badge/license-MIT-4f46e5)
![Runtime](https://img.shields.io/badge/runtime-纯浏览器·无后端-0ea5e9)
![Formats](https://img.shields.io/badge/export-SVG·PPTX·VSDX·draw.io-10b981)

</div>

---

## 这是什么

通用文生图给你的是一张"看起来像论文插图"的图，改不动、文字常错。超级AI绘图换了一条路：

1. 让模型先**读懂你的论文**，明确这张图要讲的事；
2. 让模型**读你上传的参考图**，归纳它们的版式、元素、层级和配色；
3. 按这套版式**生成主图位图**；
4. 再把位图**逐元素反解成可编辑场景**，导出成你能在 Figma、Illustrator、PPT、Visio、draw.io 里继续改的文件。

全流程在浏览器里跑，没有后端、没有构建步骤、不用注册。你的论文内容和 API Key 不经过任何中转服务器，Key 只发给你自己选定的模型厂商。

## 快速开始

**Windows 便携版**

```
双击 启动.bat
浏览器会自动打开 http://127.0.0.1:8123/forge/
```

`启动.bat` 用自带的便携 Python 起一个静态服务器（`python -m http.server`）。如果提示端口被占用，把脚本里的 `set PORT=8123` 改成别的端口即可。

**其他系统**

```bash
cd 超级画廊工厂            # 仓库根目录
python -m http.server 8123 --bind 127.0.0.1
# 打开 http://127.0.0.1:8123/forge/
```

> 必须用 HTTP 打开，直接双击 `forge/index.html`（`file://`）会因浏览器安全策略无法下载与调用接口。

**第一次使用：填一次 Key**

点右上角齿轮进「设置」，或在 `/forge/settings.html` 打开设置页：

| 页签 | 要填什么 |
|---|---|
| 服务商与接口 | 选内置服务商（自动带出接口地址），或新建一条自定义 OpenAI 兼容接口，填 API Key |
| 模型 | 拉取或手填模型清单，分**文本 / 视觉 / 图像**三类 |
| 角色 | 给 5 个职责分别指定用哪个模型：解析、归纳、生成、出图、重建 |
| 通用 / 数据 | 默认图型、界面偏好；配置导出与导入（换机器时带走） |

配置存在浏览器 `localStorage`，换浏览器或清缓存需要重填。

## 四步工作流

| 步骤 | 你做什么 | 系统做什么 |
|---|---|---|
| **1 · 输入论文内容** | 粘贴标题摘要，或上传 PDF，或写一句话讲清「输入 → 方法 → 输出」；选图型（总览 / 架构 / 流程 / 概念等） | 由「解析」角色模型读完内容，抽取这张图该表达的要点；PDF 只在你点击解析时才发给你配置的模型 |
| **2 · 上传参考图** | 传 1–10 张你想模仿版式的图（自己画的、别人的、草稿截图都行） | 「归纳」角色模型读参考图，提取布局、元素清单、层级关系与配色 |
| **3 · 生成主图初稿** | 点生成 | 「出图」角色模型产出位图主图；失败或超时会自动重试，并保留上一张可用结果 |
| **4 · 编辑并导出** | 选字体、选格式、确认导出 | 「重建」角色模型把位图切成约 900 px 的小块逐块反解，合成带文字、形状、箭头、图表的可编辑场景，再渲染成目标格式 |

### 两种生成方式

- **直接出图**：挑 2–4 张参考图，一步出图。快，适合版式简单的概念图。
- **两阶段（推荐）**：挑 4 张以上，先归纳再生成。模型先把参考图的共性总结成一份版式说明，再据此出图，版式更稳、更像顶会主图。

## 可编辑导出

第 4 步把位图反解成一份场景 JSON（文字 / 容器 / 连线 / 箭头 / 图标 / 图表 / 照片区域各自成节点），再渲染成四种格式：

| 格式 | 适合 | 特点 |
|---|---|---|
| **SVG** | Figma / Illustrator / 浏览器 | 文字是真文字，可逐元素改；最轻 |
| **PPTX** | 汇报、答辩 | DrawingML 原生形状与文字，可直接在 PowerPoint 里改 |
| **VSDX** | Visio | 原生几何、文字，照片作为独立对象 |
| **draw.io** | 在线协作绘制 | 每个对象一个 `mxCell`，自由轮廓用 stencil |

同一份场景复用，切换格式不会再调用一次模型。重建失败时第 4 步保持锁定并显示原因，不会把原位图冒充"可编辑导出"糊过去。

## 支持的服务商

内置以下档案，填 Key 即可用；点「拉取模型」可从接口实时取回模型清单。

| 类别 | 服务商 |
|---|---|
| 国内 | 火山方舟 Ark、硅基流动 SiliconFlow、智谱 GLM、DeepSeek、Kimi 月之暗面、通义千问 Qwen、腾讯混元 Hunyuan |
| 海外 | OpenAI、Anthropic Claude |
| 其他 | 任意 OpenAI 兼容接口（自建中转、公司网关、Infistar / Nonelinear 等通道） |

不同步骤可以用不同厂商：出图用擅长生图的一家，重建用擅长看图的一家，互不将就。

## 目录结构

```
仓库根目录/
├─ 启动.bat                # 便携启动脚本（Windows）
├─ index.html              # 入口，跳转 /forge/
├─ forge/                  # 工作台本体
│  ├─ index.html           # 四步工作流主界面
│  ├─ settings.html        # 设置页
│  ├─ settings-store.mjs   # 服务商/模型/角色配置的唯一来源
│  ├─ chat-api.mjs         # 文本与视觉模型调用
│  ├─ image-api.mjs        # 生图接口
│  ├─ reconstruction-*.mjs # 位图 → 可编辑场景的重建管线
│  ├─ editable-*.mjs       # 场景 → SVG / PPTX / VSDX / draw.io
│  ├─ data/                # 检索索引与嵌入文件
│  └─ test-*.mjs / *.cjs   # 各环节的自动化测试
├─ data/figures.json       # 顶会主图数据集（3,449 条元数据）
├─ images/                 # 数据集配图，按会议分目录
├─ docs/                   # 技术说明与发布记录
└─ runtime/                # 便携 Python 运行时（本机环境，不入库）
```

## 关于内置的顶会主图数据集

仓库里保留了 2023–2026 年六大会议的主图数据集（3,449 条，NeurIPS 965 / ICML 746 / ICLR 745 / ACL 384 / CVPR 308 / AAAI 301），标注了会议、年份、论文、作者和视觉模式（teaser、architecture、conceptual、pipeline、framework、taxonomy 等），以及 CLIP 与 BM25 索引文件。

它是版式研究的素材库，可以拿来做检索实验或训练自己的版式模型。**当前工作台不依赖它**——参考图由你自己上传，线上画廊站点已下线。

## 密钥与隐私

- API Key 只写在你浏览器的 `localStorage`，随请求直接发往你选定的服务商。
- 仓库里没有任何内置 Key，也不会转存、上报你的请求内容。
- 上传的 PDF 和参考图只在你点击对应步骤时发送给你配置的模型。
- 换机器时用设置页的「数据」导出配置文件，手动搬过去。

## 能力边界

- 它产出的是**高质量初稿**，不是终稿。学术图的文字、公式、数字、箭头指向，提交前必须人工核对。
- 位图生成模型对长文本和小字号天生不可靠，图里文字建议短、少、粗。
- 位图反解依赖视觉模型，复杂的密集图表可能出现漏节点或错位，导出后要过一眼。
- 数据图（曲线、柱状）不适合让模型画，请在导出后用真实数据重绘。

## 常见问题

**端口被占用？** 改 `启动.bat` 里的 `PORT`，或换 `--bind` 的端口。

**拉不到模型清单？** 有些服务商不允许浏览器跨域查 `/models`。手填模型 ID 即可，不影响调用；或改用支持跨域的中转接口。

**生图报 CORS / 跨域错误？** 换一个允许浏览器直连的接口，或走自己的中转。Anthropic、混元等对浏览器跨域限制较严。

**页面打开是空白？** 确认是通过 `http://` 访问，而不是双击 HTML 文件。

**想改文案 / 加服务商？** 界面文案在 `forge/i18n_forge.js`，服务商档案在 `forge/settings-store.mjs` 的 `FALLBACK.providers`。

## 许可与版权

- 代码基于 MIT 许可发布，详见 [LICENSE](LICENSE)。
- 数据集中的图片版权归原作者与出版方所有，仅作版式研究与学习用途，收录与下架规则见 [IMAGES_POLICY.md](IMAGES_POLICY.md)。
- 模型调用费用由你的账号直接结算给厂商，本项目不收取任何费用。

---

## English

**Super AI Drawing** (超级AI绘图) is a browser-only workbench that turns a paper's content plus a handful of your own reference figures into a Figure 1 draft, then reconstructs that bitmap into an editable scene you can export as SVG, PPTX, VSDX or draw.io.

Four steps: describe the paper → upload 1–10 reference figures → generate the bitmap → reconstruct and export. Bring your own API key (Ark, SiliconFlow, Zhipu, DeepSeek, OpenAI, Moonshot, Qwen, Hunyuan, Anthropic, or any OpenAI-compatible endpoint); keys stay in your browser and go only to the provider you pick. No backend, no build step, MIT licensed.

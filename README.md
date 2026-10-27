# FI307 布线查询 / FI307 Cabling

现场手机查询机柜接线关系的网页工具。数据已加密，打开后需回答验证问题。
Field lookup for rack cabling. Data is encrypted; answer the question to open.

访问 / Open: https://liduwake.github.io/fi307-cabling/ （按套餐查 / by package: https://liduwake.github.io/fi307-cabling/#pkg ）

## 套餐通用接线图 / Generic rack wiring maps

网页查看（中/英/芬切换）/ View online (CN/EN/FI): https://liduwake.github.io/fi307-cabling/maps/

| 套餐 Package | 中文 | English |
|---|---|---|
| 44U-2-2.48-HY-NEW | [NEW-zh](maps/NEW-zh.png) | [NEW-en](maps/NEW-en.png) |
| 44U-3-TOR-Gen-100G-48-F-STD | [TOR-zh](maps/TOR-zh.png) | [TOR-en](maps/TOR-en.png) |
| 44U-1-MOR-EBS-100G-24-F-STD（手搓套餐） | [MOR-zh](maps/MOR-zh.png) | [MOR-en](maps/MOR-en.png) |
| 44U-2-TOR-Gen-100G-48-F-STD（ASW-POP：A0-3 E08/E09、F08/F09） | [POP-zh](maps/POP-zh.png) | [POP-en](maps/POP-en.png) |
| 44U-2-2.24-HY（A0-2 G07–G12） | [HY-zh](maps/HY-zh.png) | [HY-en](maps/HY-en.png) |



## 语言 / Languages

中文 · English · Suomi（右上角切换 / switch top-right）。接线图图片只有中/英版，芬兰语界面显示英文图。

## 布线进度 / Cabling progress

- 第一次进入（答对“我是谁”后）必须填写自己的名字，本机记住；页面底部“我是 …✎”可改名。名字自动登记到表格的“人员”页。
- 每个机柜可分别标记 **垂直布线完成** / **水平布线完成**，需确认；记录完成人、时间，垂直布线同时记录套餐（一个柜只有一个套餐时自动带出，多个时让人选）。
- 完成人 10 分钟内可撤销自己的标记；之后只有管理员（PIN）能清除。
- 顶部“进度”页：各机房进度、按套餐统计、按人员统计、完成记录。
- 数据由管理员的 Google Apps Script 保存（`apps-script/status.gs`）；脚本未部署时进度功能自动隐藏。

- On first entry everyone must enter their name (remembered on the phone; change it via “Me: …✎” in the footer). Names are listed automatically in the sheet's “人员” tab.
- Each rack can be marked **vertical done** / **horizontal done** with a confirmation; the mark records who and when, and the package for vertical cabling (auto-filled, or chosen if a rack has several).
- The person who marked can undo within 10 minutes; after that only the administrator (PIN) can clear it.
- “Progress” tab: per hall, per package, per person, and a completion log.
- Stored by the owner's Google Apps Script (`apps-script/status.gs`); hidden until deployed.

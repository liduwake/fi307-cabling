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

44U-2-2.24-HY：待确认，暂不发布 / pending confirmation, not published.

## 语言 / Languages

中文 · English · Suomi（右上角切换 / switch top-right）。接线图图片只有中/英版，芬兰语界面显示英文图。

## 布线进度 / Cabling progress

每个机柜可标记 **垂直布线完成** / **水平布线完成**（只显示该柜实际有的类别），点击后需确认。机柜列表显示完成情况和本机房进度。只有管理员（PIN）可以清除标记。
进度存在管理员的 Google Apps Script 里（`apps-script/status.gs`）；脚本未部署时，进度功能自动隐藏。

Each rack can be marked **vertical done** / **horizontal done** (only the types that rack has), with a confirmation step. The rack list shows progress per hall. Only the administrator (PIN) can clear a mark. Progress is stored by the owner's Google Apps Script (`apps-script/status.gs`); the feature stays hidden until that script is deployed.

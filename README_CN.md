# SC2 AI Workbench + MCP

[English](README.md) | 中文

StarCraft II AI 驱动的 Mod/地图开发 MCP 服务器 - SC2 AI 工作台。

## 概述

SC2MCP 是一个 MCP（模型上下文协议）服务器，让 AI 能够辅助 StarCraft II Mod 和地图开发。它提供了一个完整的 AI 优先开发工作台，用于创建 Mod、种族、单位、技能、图标、音乐、UI、脚本和测试报告。

**核心理念**：AI 负责 Mod、种族、单位、技能、图标、音乐、UI、脚本、测试和报告。  
人类负责最终地形美术、复杂地形编辑和 Battle.net 发布。

## 功能特性

### 项目管理（9 个工具）
- `project.scan` - 扫描 SC2Components 项目文件夹
- `project.create_mod` - 创建新的 SC2Mod 项目结构
- `project.create_test_map` - 创建带 Mod 依赖的测试地图
- `project.backup` - 修改前创建项目备份
- `project.diff` - 显示与上次备份的差异
- `project.rollback` - 回滚到上一个备份
- `project.list_dependencies` - 列出 Mod 依赖
- `project.add_dependency` - 添加 Mod 依赖
- `project.validate_structure` - 验证项目结构

### 模板系统（5 个工具）
- `template.create_unit` - 从模板创建单位（工人、近战、远程、施法者、飞行、英雄）
- `template.create_button` - 创建命令卡按钮
- `template.create_ability` - 创建技能（含按钮、效果、行为）
- `template.create_upgrade` - 创建升级（支持多等级成本）
- `template.create_localization` - 添加本地化条目

### 种族生成器（2 个工具）
- `faction.create` - 创建完整种族（单位、建筑、升级）
- `faction.generate_from_schema` - 从 JSON Schema 生成种族

### Galaxy 代码（4 个工具）
- `galaxy_generate_code` - 从描述生成 Galaxy 脚本
- `galaxy_validate_code` - 验证 Galaxy 脚本语法
- `galaxy_explain_code` - 解释 Galaxy 代码功能
- `galaxy_lookup_api` - 查找 Galaxy 原生函数

### 数据编辑器（5 个工具）
- `galaxy_generate_data_xml` - 生成 SC2 数据 XML
- `data_list_components` - 列出归档中的组件
- `data_batch_modify` - 批量修改多个组件
- `data_validate_catalog` - 验证数据目录
- `data_generate_upgrade` - 生成带等级的升级

### SC2Map 文件（7 个工具）
- `sc2map_list` - 列出归档中的文件
- `sc2map_read` - 从归档读取特定文件
- `sc2map_read_all_galaxy` - 读取所有 Galaxy 脚本
- `sc2map_read_all_xml` - 读取所有 XML 数据
- `sc2map_write` - 写入文件到归档
- `sc2map_create` - 创建新的 SC2Map
- `sc2mod_create` - 创建新的 SC2Mod

### 单位操作（4 个工具）
- `unit_create_full` - 创建完整单位（含武器）
- `unit_modify` - 生成单位 XML 覆盖
- `unit_generate_ability` - 生成技能 XML
- `unit_generate_behavior` - 生成行为/增益 XML

### 资源管理（6 个工具）
- `asset_import_file` - 导入文件到归档
- `asset_import_directory` - 导入目录到归档
- `asset_generate_model_actor` - 生成模型 Actor XML
- `asset_generate_sound_entry` - 生成声音 XML
- `asset_generate_icon_entry` - 生成图标 XML
- `asset_list` - 列出归档中的资源

### 地图蓝图（3 个工具）
- `map.generate_blueprint` - 生成地图布局蓝图
- `map.save_blueprint` - 保存蓝图到文件
- `map.validate_blueprint` - 验证蓝图问题

### 运行测试（5 个工具）
- `run.launch_map` - 通过 SC2Switcher 启动地图
- `run.capture_screenshot` - 截取 SC2 窗口截图
- `run.check_sc2_status` - 检查 SC2 是否运行
- `run.close_sc2` - 关闭 SC2 进程
- `run.collect_logs` - 收集 SC2 游戏日志
- `run.detect_sc2` - 检测 SC2 安装路径

### 报告系统（3 个工具）
- `report.generate` - 生成测试报告（Markdown/HTML）
- `report.create_from_data` - 从自定义数据创建报告
- `report.list_reports` - 列出已生成的报告

### 编辑器自动化（7 个工具）
- `editor_activate` - 将编辑器窗口置于前台
- `editor_open_map` - 在编辑器中打开地图
- `editor_send_keys` - 发送键盘输入
- `editor_click` - 在坐标处点击
- `editor_save` - 保存当前地图
- `editor_new_map` - 打开新建地图对话框
- `editor_screenshot` - 截取编辑器截图

### 地形编辑（4 个工具）
- `terrain_generate_heightmap` - 生成地形高度数据
- `terrain_set_texture` - 绘制地形纹理
- `terrain_create_cliff` - 创建悬崖边缘
- `terrain_create_ramp` - 创建斜坡

### 对象放置（5 个工具）
- `object_place_units` - 在地图上放置单位
- `object_place_doodads` - 放置装饰物
- `object_create_camera` - 设置相机
- `object_create_region` - 定义区域
- `object_create_patrol_route` - 创建巡逻路线

### 触发器（2 个工具）
- `trigger_generate_full` - 生成完整触发器
- `trigger_generate_chain` - 生成触发器链

### UI（3 个工具）
- `ui_generate_dialog` - 生成对话框 UI
- `ui_generate_scoreboard` - 生成计分板
- `ui_generate_tooltip` - 生成工具提示

**总计：69 个工具**

### 资源（7 个）
- Galaxy 原生函数参考（50+ 函数）
- Galaxy 类型和关键字参考
- 数据编辑器 XML Schema 文档
- 触发器系统参考
- 常用 Galaxy 模式（8 种模式）
- 地图格式文档
- 资源格式参考

### 提示模板（9 个）
- create-unit, create-map, create-mod, import-asset
- create-ability, create-trigger, debug-galaxy-script
- create-faction, generate-blueprint

## 安装

```bash
npm install
npm run build
```

## 使用方法

### 作为 MCP 服务器（stdio）

```bash
npm start
```

### 配合 Claude Desktop / OpenCode

添加到 MCP 客户端配置：

```json
{
  "mcpServers": {
    "sc2mcp": {
      "command": "node",
      "args": ["D:\\path\\to\\sc2mcp\\dist\\index.js"]
    }
  }
}
```

### 开发模式

```bash
npm run dev    # 使用 tsx 运行（无需编译）
npm run build  # 编译 TypeScript
npm run inspect # 使用 MCP Inspector 调试
```

## 配置

在项目根目录创建 `sc2-workbench.json`：

```json
{
  "sc2": {
    "installPath": "C:\\Program Files (x86)\\StarCraft II",
    "region": "US",
    "language": "zhCN"
  },
  "workspace": {
    "projectsRoot": "D:\\SC2Projects",
    "backupRoot": "D:\\SC2Projects\\.backups",
    "reportsRoot": "D:\\SC2Projects\\.reports"
  }
}
```

## SC2Components 项目结构

工作台支持基于 `.SC2Components` 文件夹的项目：

```
MyRace.SC2Mod.SC2Components/
├── ComponentList.SC2Components
├── Base.SC2Data/
│   ├── GameData.xml
│   ├── GameData/
│   │   ├── Units.xml
│   │   ├── Weapons.xml
│   │   ├── Abilities.xml
│   │   ├── Buttons.xml
│   │   └── Actors.xml
│   ├── UI/Layout/
│   └── Assets/
│       ├── Icons/
│       ├── Sounds/
│       └── Music/
├── enUS.SC2Data/
│   └── LocalizedData/GameStrings.txt
├── zhCN.SC2Data/
│   └── LocalizedData/GameStrings.txt
└── scripts/
    ├── main.galaxy
    └── race_init.galaxy
```

## 示例工作流

```
用户："创建一个新种族叫机械虫群，有工人、近战兵、远程兵和防御塔"

AI 工作流：
1. project.scan - 检查当前项目
2. project.backup - 创建备份
3. faction.create - 生成完整种族
4. template.create_unit - 创建特殊单位
5. template.create_ability - 添加特殊技能
6. map.generate_blueprint - 创建测试地图布局
7. run.launch_map - 在 SC2 中测试
8. run.capture_screenshot - 截取结果
9. report.generate - 生成测试报告
```

## 项目结构

```
src/
  index.ts              # MCP 服务器入口
  resources/
    index.ts            # 资源注册
    galaxy-api.ts       # Galaxy 原生函数参考
    galaxy-types.ts     # Galaxy 类型参考
    data-xml-schema.ts  # 数据编辑器 XML Schema
    trigger-reference.ts # 触发器系统参考
    common-patterns.ts  # 常用 Galaxy 模式
    map-format.ts       # 地图格式文档
    asset-formats.ts    # 资源格式文档
  tools/
    index.ts            # 工具注册
    project-tools.ts    # 项目管理（扫描、备份、差异、回滚）
    template-tools.ts   # 模板系统（单位、按钮、技能、升级）
    faction-tools.ts    # 种族生成器
    blueprint-tools.ts  # 地图蓝图系统
    runner-tools.ts     # SC2Switcher、截图、日志
    report-tools.ts     # 报告生成
    galaxy-tools.ts     # Galaxy 代码工具
    data-xml-tools.ts   # 数据 XML 工具
    data-tools.ts       # 数据管理工具
    sc2map-tools.ts     # SC2Map 文件工具
    map-creation.ts     # 地图/Mod 创建
    unit-operations.ts  # 单位操作
    asset-management.ts # 资源管理
    terrain-tools.ts    # 地形编辑
    object-tools.ts     # 对象放置
    trigger-tools.ts    # 触发器生成
    ui-tools.ts         # UI 生成
    editor-automation.ts # 编辑器 UI 自动化
  prompts/
    index.ts            # 提示模板
  utils/
    galaxy-validator.ts # Galaxy 代码验证器
    xml-utils.ts        # XML 解析工具
    sc2map-utils.ts     # SC2Map ZIP 归档工具
```

## 使用 Galaxy Editor 测试

1. 使用 `project.create_mod` 创建新 Mod
2. 使用 `faction.create` 生成完整种族
3. 使用 `project.create_test_map` 创建测试地图
4. 使用 `run.launch_map` 在 SC2 中测试
5. 使用 `run.capture_screenshot` 验证结果
6. 使用 `report.generate` 生成测试报告

## 许可证

MIT

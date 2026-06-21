# SC2 AI Workbench 使用指南

## 快速开始

### 1. 安装

```bash
# 克隆项目
git clone <repository-url>
cd sc2mcp

# 安装依赖
npm install

# 编译
npm run build
```

### 2. 配置 MCP 客户端

#### Claude Desktop / OpenCode

在 MCP 客户端配置文件中添加：

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

#### Cursor

在 `.cursor/mcp.json` 中添加：

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

### 3. SC2 配置（可选）

创建 `sc2-workbench.json` 配置 SC2 路径：

```json
{
  "sc2": {
    "installPath": "C:\\Program Files (x86)\\StarCraft II",
    "region": "US",
    "language": "enUS"
  }
}
```

---

## 使用场景

### 场景 1：创建新种族

**自然语言请求：**
```
帮我创建一个新种族"机械虫群"：
- 主基地、工人、近战兵、远程兵、防御塔
- 一级攻防升级
- 有中英文本地化
```

**AI 执行流程：**
```
1. project.create_mod → 创建 Mod 工程
2. faction.create → 生成完整种族
3. template.create_unit → 补充特殊单位
4. template.create_upgrade → 添加升级
5. template.create_localization → 添加本地化
6. project.create_test_map → 创建测试地图
```

### 场景 2：创建自定义单位

**自然语言请求：**
```
创建一个远程单位 Void Ranger：
- 基于 Marine
- 120 生命，1 护甲
- 12 伤害，6 射程
- 有闪烁技能
```

**AI 执行流程：**
```
1. project.backup → 备份项目
2. template.create_unit → 创建单位
3. template.create_ability → 创建闪烁技能
4. template.create_localization → 添加 Tooltip
```

### 场景 3：生成地图蓝图

**自然语言请求：**
```
生成一个 2v2 对称地图：
- 丛林主题
- 主矿、分矿、中心高价值资源
- 两条进攻路线
```

**AI 执行流程：**
```
1. map.generate_blueprint → 生成蓝图
2. map.validate_blueprint → 验证蓝图
3. map.save_blueprint → 保存蓝图文件
```

### 场景 4：测试和报告

**自然语言请求：**
```
测试我的 Mod 并生成报告
```

**AI 执行流程：**
```
1. project.backup → 备份
2. project.validate_structure → 验证结构
3. run.launch_map → 启动 SC2 测试
4. run.capture_screenshot → 截图
5. run.collect_logs → 收集日志
6. report.generate → 生成报告
```

---

## 工具详解

### 项目管理工具

| 工具 | 用途 | 示例 |
|------|------|------|
| `project.scan` | 扫描项目结构 | 扫描 `.SC2Components` 目录 |
| `project.create_mod` | 创建新 Mod | 创建种族 Mod |
| `project.create_test_map` | 创建测试地图 | 带 Mod 依赖的测试图 |
| `project.backup` | 备份项目 | 修改前自动备份 |
| `project.diff` | 查看差异 | 对比当前与备份 |
| `project.rollback` | 回滚项目 | 恢复到备份版本 |
| `project.validate_structure` | 验证结构 | 检查完整性 |
| `project.list_dependencies` | 列出依赖 | 查看 Mod 依赖 |
| `project.add_dependency` | 添加依赖 | 添加 Mod 依赖 |

### 模板系统工具

| 工具 | 用途 | 参数示例 |
|------|------|----------|
| `template.create_unit` | 创建单位 | template: "ranged_basic" |
| `template.create_button` | 创建按钮 | icon: "Assets/Icons/xxx.dds" |
| `template.create_ability` | 创建技能 | template: "target_unit" |
| `template.create_upgrade` | 创建升级 | maxLevel: 3 |
| `template.create_localization` | 添加翻译 | locale: "zhCN" |

### 种族生成器

| 工具 | 用途 |
|------|------|
| `faction.create` | 一键生成完整种族 |
| `faction.generate_from_schema` | 从 JSON Schema 生成 |

**faction.create 参数：**
```json
{
  "projectPath": "D:\\SC2Projects\\MyMod.SC2Mod.SC2Components",
  "id": "MechanicalSwarm",
  "displayName": "Mechanical Swarm",
  "theme": "bio-mechanical zerg-like machines",
  "race": "Zerg"
}
```

### 地图蓝图工具

| 工具 | 用途 |
|------|------|
| `map.generate_blueprint` | 生成地图布局 |
| `map.save_blueprint` | 保存蓝图文件 |
| `map.validate_blueprint` | 验证蓝图 |

**map.generate_blueprint 参数：**
```json
{
  "mapName": "Two Rivers",
  "theme": "jungle",
  "players": 2,
  "width": 160,
  "height": 160,
  "symmetry": "vertical"
}
```

### 运行测试工具

| 工具 | 用途 |
|------|------|
| `run.launch_map` | 启动 SC2 测试 |
| `run.capture_screenshot` | 截图 |
| `run.check_sc2_status` | 检查 SC2 状态 |
| `run.collect_logs` | 收集日志 |
| `run.detect_sc2` | 检测 SC2 安装 |

### 报告生成工具

| 工具 | 用途 |
|------|------|
| `report.generate` | 生成测试报告 |
| `report.create_from_data` | 从数据创建报告 |
| `report.list_reports` | 列出报告 |

---

## 工程结构规范

### SC2Mod 工程

```
MyRace.SC2Mod.SC2Components/
├── ComponentList.SC2Components    # 组件列表
├── DocumentInfo                   # 文档信息（依赖等）
├── Base.SC2Data/
│   ├── GameData.xml              # 主数据文件
│   ├── GameData/                  # 分类数据
│   │   ├── Units.xml
│   │   ├── Weapons.xml
│   │   ├── Effects.xml
│   │   ├── Abilities.xml
│   │   ├── Behaviors.xml
│   │   ├── Buttons.xml
│   │   ├── Upgrades.xml
│   │   └── Actors.xml
│   ├── UI/Layout/                 # UI 定义
│   └── Assets/                    # 资源文件
│       ├── Icons/
│       ├── Textures/
│       ├── Sounds/
│       └── Music/
├── enUS.SC2Data/                  # 英文本地化
│   └── LocalizedData/GameStrings.txt
├── zhCN.SC2Data/                  # 中文本地化
│   └── LocalizedData/GameStrings.txt
└── scripts/                       # Galaxy 脚本
    ├── main.galaxy
    ├── race_init.galaxy
    └── ai_controller.galaxy
```

### SC2Map 工程

```
MyMap.SC2Map.SC2Components/
├── ComponentList.SC2Components
├── DocumentInfo                   # 包含 Mod 依赖
├── MapInfo                        # 地图信息
├── MapScript.galaxy               # 地图脚本
├── Base.SC2Data/                  # 地图数据
├── Objects                        # 单位/物品
├── Regions                        # 区域
├── Points                         # 点
├── Cameras                        # 相机
└── Terrain                        # 地形
```

---

## 最佳实践

### 1. 备份策略

- 每次修改前调用 `project.backup`
- 重大修改前创建多个备份
- 使用 `project.diff` 检查变更

### 2. ID 命名规范

```
单位:    [种族][类型]      (例: VoidZealot)
武器:    [单位]Weapon      (例: VoidZealotWeapon)
效果:    [单位]Damage      (例: VoidZealotDamage)
按钮:    [单位]Button      (例: VoidZealotButton)
演员:    [单位]Actor       (例: VoidZealotActor)
技能:    [种族][技能名]    (例: VoidBlink)
升级:    [种族][升级名]    (例: VoidWeaponsLevel1)
```

### 3. 本地化键名规范

```
Race/[种族ID]                    = 种族名称
Unit/[单位ID]                    = 单位名称
Unit/[单位ID]/Description        = 单位描述
Ability/[技能ID]                 = 技能名称
Ability/[技能ID]/Description     = 技能描述
Upgrade/[升级ID]                 = 升级名称
Tooltip/[技能ID]                 = 技能 Tooltip
```

### 4. 测试流程

```
1. project.backup           # 备份
2. [执行修改操作]
3. project.validate_structure # 验证
4. project.create_test_map  # 创建测试图
5. run.launch_map           # 启动测试
6. run.capture_screenshot   # 截图
7. report.generate          # 生成报告
```

---

## 常见问题

### Q: SC2 找不到怎么办？

运行 `run.detect_sc2` 自动检测，或手动配置 `sc2-workbench.json`。

### Q: 如何回滚修改？

```
project.rollback → 恢复到最近备份
project.rollback backupTimestamp="2026-06-20T12-00-00" → 恢复指定备份
```

### Q: 如何添加自定义图标？

1. 准备 76x76 像素的 PNG 图标
2. 转换为 DDS 格式
3. 放入 `Assets/Icons/` 目录
4. 在 Button/Unit 中引用路径

### Q: 如何让玩家选择种族？

在地图脚本中添加种族选择逻辑：
```galaxy
void main() {
    // 显示种族选择对话框
    ShowRaceSelectionDialog();
}
```

---

## 工具数量统计

| 类别 | 数量 |
|------|------|
| 项目管理 | 9 |
| 模板系统 | 5 |
| 种族生成 | 2 |
| Galaxy 代码 | 4 |
| 数据编辑 | 5 |
| SC2Map 文件 | 7 |
| 单位操作 | 4 |
| 资源管理 | 6 |
| 地图蓝图 | 3 |
| 运行测试 | 5 |
| 报告系统 | 3 |
| 编辑器自动化 | 7 |
| 地形编辑 | 4 |
| 对象放置 | 5 |
| 触发器 | 2 |
| UI | 3 |
| **总计** | **69** |

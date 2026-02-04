# 房贷提前还款决策器

## 项目介绍
这是一个基于 React + TypeScript + Vite 开发的房贷提前还款决策器，旨在帮助用户分析不同提前还款策略的效果，提供数据可视化和 AI 理财建议。

## 功能特点

### 🎯 核心功能
- **房贷计算**：支持等额本息和等额本金两种还款方式
- **利率调整**：允许用户添加多个利率调整节点
- **提前还款**：支持一次性还款和每月追加还款
- **策略对比**：对比缩短年限和减少月供两种策略
- **数据可视化**：提供本金余额对比、总支出构成、月供成分动态博弈等图表
- **AI 理财建议**：基于 Google Gemini API 提供专业理财建议
- **详细还款明细**：提供每期还款的详细数据，支持虚拟滚动优化

### 📱 响应式设计
- 适配桌面端、平板和移动设备
- 优化小屏幕设备的显示效果
- 响应式表格和图表

### 🚀 性能优化
- 使用 React.useMemo 优化计算性能
- 实现虚拟滚动，优化长表格渲染
- 延迟加载图表数据

## 技术栈

- React 19.2.4
- TypeScript 5.8.2
- Vite 6.2.0
- recharts 3.7.0（图表库）
- @google/genai 1.39.0（AI 功能）
- react-markdown 9.0.1（Markdown 渲染）
- react-window 2.2.6（虚拟滚动）

## 安装与运行

### 1. 克隆项目
```bash
git clone <repository-url>
cd mortgage-optimizer-pro
```

### 2. 安装依赖
```bash
# 使用 yarn
yarn install

# 或使用 npm
npm install
```

### 3. 配置环境变量
创建 `.env` 文件，添加 Google Gemini API Key：

```env
# Google Gemini API Key
API_KEY=YOUR_GOOGLE_GEMINI_API_KEY_HERE

# Vite 配置
VITE_API_KEY=${API_KEY}
```

> 注意：如果没有 Google Gemini API Key，可以跳过此步骤，但 AI 理财建议功能将无法使用。

### 4. 运行项目
```bash
# 开发模式
yarn dev

# 或
npm run dev

# 构建生产版本
yarn build

# 或
npm run build
```

## 使用方法

### 1. 基本设置
1. 选择还款方式：等额本息或等额本金
2. 输入贷款总额、初始年利率和贷款期限
3. 可选择添加利率调整节点

### 2. 提前还款设置
1. 输入一次性还款金额和还款期数
2. 输入每月追加还款金额
3. 选择提前还款策略：缩短年限或减少月供

### 3. 查看结果
1. 查看最优还款策略分析
2. 查看利息节省、提前结清时间等关键指标
3. 查看数据可视化图表
4. 点击"获取分析"按钮获取 AI 理财建议
5. 查看详细还款明细

## 项目结构

```
├── components/
│   └── ComparisonCharts.tsx  # 图表组件
├── services/
│   ├── mortgageUtils.ts       # 房贷计算核心逻辑
│   └── geminiAdvice.ts        # AI 建议功能
├── App.tsx                    # 主应用组件
├── types.ts                   # 类型定义
├── index.html                 # HTML 入口
├── index.tsx                  # React 入口
├── package.json               # 项目配置
├── tsconfig.json              # TypeScript 配置
├── vite.config.ts             # Vite 配置
└── README.md                  # 项目文档
```

## 核心算法

### 1. 月供计算
```typescript
function calculateMonthlyPayment(principal: number, annualRate: number, months: number): number {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate <= 0) return principal / months;
  if (months <= 0) return principal;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
}
```

### 2. 还款模拟
```typescript
function simulateMortgage(mortgage: MortgageInputs, early: EarlyRepaymentInputs | null = null): CalculationResult {
  // 模拟整个还款过程，支持提前还款和利率调整
  // ...
}
```

## 浏览器兼容性

- Chrome (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- Edge (最新版本)

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，欢迎联系项目维护者。

---

**感谢使用房贷提前还款决策器！** 希望这个工具能帮助您做出更明智的房贷还款决策。
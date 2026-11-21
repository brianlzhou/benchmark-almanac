// SuperCLUE-Mkt ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-mkt",
  url: "https://www.superclueai.com/specialized/Mkt",
  feed: "https://www.superclueai.com/data/specialized_list/Mkt/2026%E5%B9%B41%E6%9C%88.xlsx",
  roundFolder: "Mkt",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 12,
  parts: ["市场洞察", "投放策略", "创意生产", "合规评估"],
  settings: ["使用方式"],
  details: [{"sheet": "市场洞察", "model": "模型名称", "parts": ["产品受众匹配", "产品理解", "目标市场分析"]}, {"sheet": "投放策略", "model": "模型名称", "parts": ["品牌定位策略", "市场进入策略", "平台差异化"]}, {"sheet": "创意生产", "model": "模型名称", "parts": ["文案生成", "爆品模仿", "脚本生成"]}, {"sheet": "合规评估", "model": "模型名称", "parts": ["合规检查", "风险预审"]}],
});

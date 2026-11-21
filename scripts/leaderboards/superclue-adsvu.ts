// SuperCLUE-AdsVU ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-adsvu",
  url: "https://www.superclueai.com/specialized/AdsVU",
  feed: "https://www.superclueai.com/data/specialized_list/AdsVU/2026%E5%B9%B47%E6%9C%88.xlsx",
  roundFolder: "AdsVU",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 8,
  parts: ["创意元素识别", "创意内容理解", "创意策略分析", "投放可行性判断"],
  settings: ["使用方式"],
  details: [{"sheet": "创意元素识别", "model": "模型名称", "parts": ["分数", "品牌信息识别", "产品内容解析", "行业标签识别", "达人画像识别", "调性风格归类"]}, {"sheet": "创意内容理解", "model": "模型名称", "parts": ["分数", "叙事主旨提炼", "受众画像建模", "价值主张理解"]}, {"sheet": "创意策略分析", "model": "模型名称", "parts": ["分数", "黄金3秒钩子", "行动号召识别", "说服策略挖掘"]}, {"sheet": "投放可行性判断", "model": "模型名称", "parts": ["分数", "合规风控校验", "场景适配性评估", "可信度评估"]}],
});

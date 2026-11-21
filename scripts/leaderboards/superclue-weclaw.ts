// SuperCLUE-WeClaw ranks entries by 总成绩 on its 平均成绩 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-weclaw",
  url: "https://www.superclueai.com/openclaw/WeClaw",
  feed: "https://www.superclueai.com/data/openclaw_list/WeClaw/2026%E5%B9%B44%E6%9C%88.xlsx",
  roundFolder: "WeClaw",
  sheet: "平均成绩",
  model: "底层模型",
  score: "总成绩",
  minimum: 10,
  parts: ["代码开发", "信息检索与整理", "内容创作", "数据分析", "文档处理"],
  settings: ["部署方式", "价格", "答案获取途径"],
  harness: "产品名称",
  details: [{"sheet": "第一次测评成绩", "model": "底层模型", "parts": ["总分"]}],
});

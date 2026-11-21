// SuperCLUE-LarkClaw ranks entries by 总成绩 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-larkclaw",
  url: "https://www.superclueai.com/openclaw/LarkClaw",
  feed: "https://www.superclueai.com/data/openclaw_list/LarkClaw/2026%E5%B9%B45%E6%9C%88.xlsx",
  roundFolder: "LarkClaw",
  sheet: "总榜",
  model: "底层模型",
  score: "总成绩",
  minimum: 10,
  parts: ["信息检索与整理", "内容创作", "数据分析", "文档处理"],
  settings: ["部署方式", "价格", "答案获取途径"],
  harness: "产品名称",
});

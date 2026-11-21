// SuperCLUE-Role ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-role",
  url: "https://www.superclueai.com/specialized/Role",
  feed: "https://www.superclueai.com/data/specialized_list/Role/2024%E5%B9%B44%E6%9C%88.xlsx",
  roundFolder: "Role",
  sheet: "总榜",
  model: "模型",
  score: "总分",
  minimum: 12,
  parts: ["角色基础", "角色风格", "场景应用"],
  details: [{"sheet": "角色基础", "model": "模型", "parts": ["基础总分", "知识掌握", "对话能力"]}, {"sheet": "角色风格", "model": "模型", "parts": ["风格总分", "语言风格", "行为习惯", "角色背景"]}, {"sheet": "场景应用", "model": "模型", "parts": ["应用总分", "情感陪伴", "游戏NPC", "社交场景", "直播营销", "影音名人"]}],
});

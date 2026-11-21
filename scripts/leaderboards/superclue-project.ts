// SuperCLUE-Project ranks entries by 总分 on its 总榜单 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-project",
  url: "https://www.superclueai.com/specialized/Project",
  feed: "https://www.superclueai.com/data/specialized_list/Project/2025%E5%B9%B42%E6%9C%88.xlsx",
  roundFolder: "Project",
  sheet: "总榜单",
  model: "模型",
  score: "总分",
  minimum: 23,
  parts: ["功能完整性", "代码质量", "用户体验"],
  settings: ["使用方式"],
  details: [{"sheet": "游戏开发", "model": "模型", "parts": ["游戏开发"]}, {"sheet": "快捷工具", "model": "模型", "parts": ["快捷工具"]}, {"sheet": "网络应用", "model": "模型", "parts": ["网络应用"]}, {"sheet": "管理系统", "model": "模型", "parts": ["管理系统"]}, {"sheet": "多媒体编辑", "model": "模型", "parts": ["多媒体编辑"]}],
});

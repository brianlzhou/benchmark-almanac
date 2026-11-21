// SuperCLUE-ComicShorts ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-comicshorts",
  url: "https://www.superclueai.com/multimodal/comic",
  feed: "https://www.superclueai.com/data/multimodal_list/comic/2026%E5%B9%B44%E6%9C%88.xlsx",
  roundFolder: "comic",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 7,
  parts: ["总回复率", "基础能力", "动态表现"],
  details: [{"sheet": "基础能力榜单", "model": "模型名称", "parts": ["主体一致性", "主体一致性回复率", "人物质感", "人物质感回复率", "场景一致性", "场景一致性回复率", "场景贴合度", "场景贴合度回复率", "语义理解度", "语义理解度回复率"]}, {"sheet": "动态表现榜单", "model": "模型名称", "parts": ["内容复刻", "内容复刻回复率", "动作表现力", "动作表现力回复率", "多角度生成", "多角度生成回复率", "情感表达", "情感表达回复率", "画面一致性", "画面一致性回复率", "镜头控制力", "镜头控制力回复率"]}],
});

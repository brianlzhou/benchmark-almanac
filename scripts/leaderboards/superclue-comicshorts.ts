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
  stats: {
    responseRate1: { name: 'Total response rate', unit: 'score', better: 'higher', note: 'Rate stored from 0 to 1.' },
    responseRate2: { name: 'Subject consistency response rate', unit: 'score', better: 'higher', note: 'Rate stored from 0 to 1.' },
    responseRate3: { name: 'Character texture response rate', unit: 'score', better: 'higher', note: 'Rate stored from 0 to 1.' },
    responseRate4: { name: 'Scene consistency response rate', unit: 'score', better: 'higher', note: 'Rate stored from 0 to 1.' },
    responseRate5: { name: 'Scene relevance response rate', unit: 'score', better: 'higher', note: 'Rate stored from 0 to 1.' },
    responseRate6: { name: 'Semantic understanding response rate', unit: 'score', better: 'higher', note: 'Rate stored from 0 to 1.' },
    responseRate7: { name: 'Content reproduction response rate', unit: 'score', better: 'higher', note: 'Rate stored from 0 to 1.' },
    responseRate8: { name: 'Action expressiveness response rate', unit: 'score', better: 'higher', note: 'Rate stored from 0 to 1.' },
    responseRate9: { name: 'Multi-angle generation response rate', unit: 'score', better: 'higher', note: 'Rate stored from 0 to 1.' },
    responseRate10: { name: 'Emotional expression response rate', unit: 'score', better: 'higher', note: 'Rate stored from 0 to 1.' },
    responseRate11: { name: 'Image consistency response rate', unit: 'score', better: 'higher', note: 'Rate stored from 0 to 1.' },
    responseRate12: { name: 'Camera control response rate', unit: 'score', better: 'higher', note: 'Rate stored from 0 to 1.' },
  },
});

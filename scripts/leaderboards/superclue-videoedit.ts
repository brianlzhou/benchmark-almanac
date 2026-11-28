// SuperCLUE-VideoEdit ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  aliases: {
  "Seedance 2.5": "dreamina-seedance-2-5"
},
  benchmark: "superclue-videoedit",
  url: "https://www.superclueai.com/multimodal/VideoEdit",
  feed: "https://www.superclueai.com/data/multimodal_list/VideoEdit/2026%E5%B9%B411%E6%9C%88.xlsx",
  roundFolder: "VideoEdit",
  sheet: "总榜",
  model: "模型",
  score: "总分",
  minimum: 7,
  parts: ["基础能力", "应用能力"],
  settings: ["获取方式"],
  metrics: {"completedQuestions": "完成题数"},
  details: [{"sheet": "基础能力", "model": "模型", "parts": ["分数", "主体与属性编辑", "场景与风格编辑", "画面修复与增强", "运动与镜头编辑", "文字与符号编辑"]}, {"sheet": "应用能力", "model": "模型", "parts": ["分数", "广告与电商营销", "影视后期与创意特效", "社交媒体与个人创作"]}, {"sheet": "完成度统计", "model": "模型", "parts": ["生成视频数", "有效评测数", "评测完成率(%)"]}],
});

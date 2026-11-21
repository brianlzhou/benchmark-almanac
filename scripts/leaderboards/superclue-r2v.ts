// SuperCLUE-R2V ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  aliases: {
  "Seedance 2.5": "dreamina-seedance-2-5"
},
  benchmark: "superclue-r2v",
  url: "https://www.superclueai.com/multimodal/R2V",
  feed: "https://www.superclueai.com/data/multimodal_list/R2V/2026%E5%B9%B410%E6%9C%88.xlsx",
  roundFolder: "R2V",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 8,
  parts: ["基础能力", "应用能力"],
  settings: ["使用方式"],
  metrics: {"completedQuestions": "完成题数", "questions": "总题数"},
  details: [{"sheet": "基础能力", "model": "模型名称", "parts": ["物理真实性", "主体一致性", "画面流畅度", "场景一致性", "指令执行度", "运动表现性", "镜头控制能力"]}, {"sheet": "应用能力", "model": "模型名称", "parts": ["影视创作", "商业广告", "电商场景", "泛娱乐", "知识科普与教学", "创意特效制作"]}, {"sheet": "单图专项", "model": "模型名称", "parts": ["人物还原度"]}, {"sheet": "回复率统计", "model": "模型名称", "parts": ["生成视频数", "有效评测数", "评测完成率(%)"]}],
});

// SuperCLUE-ICabin ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-icabin",
  url: "https://www.superclueai.com/specialized/ICabin",
  feed: "https://www.superclueai.com/data/specialized_list/ICabin/2024%E5%B9%B410%E6%9C%88.xlsx",
  roundFolder: "ICabin",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 10,
  parts: [],
  details: [{"sheet": "各任务大类得分", "model": "模型名称", "parts": ["车身服务能力", "多指令识别能力", "个性化推荐能力", "泛化表达理解能力", "上下文信息理解与处理", "娱乐能力", "复杂意图推理能力"]}, {"sheet": "基础能力", "model": "模型名称", "parts": ["基础能力"]}, {"sheet": "应用能力", "model": "模型名称", "parts": ["应用能力", "汽车操控", "故障维修", "用车答疑", "百科问答", "儿童关怀", "情感聊天", "出行规划"]}],
});

// SuperCLUE-VLR ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-vlr",
  url: "https://www.superclueai.com/multimodal/VLR",
  feed: "https://www.superclueai.com/data/multimodal_list/VLR/2025%E5%B9%B45%E6%9C%88.xlsx",
  roundFolder: "VLR",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 10,
  parts: ["数学推理", "科学推理", "代码推理", "逻辑推理", "空间推理", "时间推理"],
  settings: ["使用方式"],
});

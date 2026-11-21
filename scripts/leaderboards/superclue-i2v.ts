// SuperCLUE-I2V ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  aliases: {
  "Seedance 2.5": "dreamina-seedance-2-5"
},
  benchmark: "superclue-i2v",
  url: "https://www.superclueai.com/multimodal/I2V",
  feed: "https://www.superclueai.com/data/multimodal_list/I2V/2026%E5%B9%B410%E6%9C%88.xlsx",
  roundFolder: "I2V",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 8,
  parts: ["基础能力", "应用能力"],
  settings: ["使用方式"],
  details: [{"sheet": "基础能力", "model": "模型名称", "parts": ["运动流畅性", "内容一致性", "物理真实性", "长时序生成", "首尾帧控制"]}, {"sheet": "应用能力", "model": "模型名称", "parts": ["视觉风格创作", "广告营销", "教学演示"]}, {"sheet": "回复率统计", "model": "模型名称", "parts": ["回复率(%)"]}],
});

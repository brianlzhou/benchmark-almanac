// SuperCLUE-MedAssist ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-medassist",
  url: "https://www.superclueai.com/specialized/MedAssist",
  feed: "https://www.superclueai.com/data/specialized_list/MedAssist/2026%E5%B9%B46%E6%9C%88.xlsx",
  roundFolder: "MedAssist",
  sheet: "总榜",
  model: "产品名称",
  score: "总分",
  minimum: 8,
  parts: ["医学知识准确性与覆盖度", "症状评估与就医引导能力", "用药安全与指导能力", "检验报告与健康数据解读", "多模态健康信息交互与解读能力", "医疗安全与伦理合规"],
  settings: ["使用方式"],
});

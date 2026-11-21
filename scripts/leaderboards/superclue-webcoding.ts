// SuperCLUE-WebCoding ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-webcoding",
  url: "https://www.superclueai.com/specialized/WebCoding",
  feed: "https://www.superclueai.com/data/specialized_list/WebCoding/2025%E5%B9%B412%E6%9C%88.xlsx",
  roundFolder: "WebCoding",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 14,
  parts: [],
  settings: ["使用方式"],
  details: [{"sheet": "界面呈现榜单", "model": "模型名称", "parts": ["界面呈现总分", "结构布局", "视觉样式", "信息内容呈现", "响应式与适配"]}, {"sheet": "交互功能榜单", "model": "模型名称", "parts": ["交互功能总分", "导航视图切换", "输入与提交", "数据列表管理", "状态反馈提示", "可视化统计", "多功能协同"]}],
});

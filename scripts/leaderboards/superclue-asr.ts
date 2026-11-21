// SuperCLUE-ASR ranks entries by CER↓ on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-asr",
  url: "https://www.superclueai.com/multimodal/ASR",
  feed: "https://www.superclueai.com/data/multimodal_list/ASR/2026%E5%B9%B49%E6%9C%88.xlsx",
  roundFolder: "ASR",
  sheet: "总榜",
  model: "模型名称",
  score: "CER↓",
  minimum: 12,
  parts: ["基础中文转写↓", "真实声学鲁棒性↓", "对话与长音频↓", "专业领域与长尾信息↓", "中文高难信息↓"],
  settings: ["使用方式"],
  details: [{"sheet": "基础中文转写", "model": "模型名称", "parts": ["标准普通话↓", "自然口语普通话↓"]}, {"sheet": "真实声学鲁棒性", "model": "模型名称", "parts": ["环境噪声↓", "房间混响与远场↓", "通信与压缩↓", "语速变化↓"]}, {"sheet": "对话与长音频", "model": "模型名称", "parts": ["双人自然对话↓", "多人对话↓", "长音频连续转写↓"]}, {"sheet": "专业领域与长尾信息", "model": "模型名称", "parts": ["法律↓", "金融↓", "工程↓", "人工智能与信息技术↓", "医疗↓"]}, {"sheet": "中文高难信息", "model": "模型名称", "parts": ["数字相似↓", "同音近音↓", "古文↓", "多音字↓"]}, {"sheet": "参测模型信息", "model": "模型名称", "parts": []}],
});

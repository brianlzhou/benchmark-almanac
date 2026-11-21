// SuperCLUE-Writing ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-writing",
  url: "https://www.superclueai.com/specialized/Writing",
  feed: "https://www.superclueai.com/data/specialized_list/Writing/2026%E5%B9%B45%E6%9C%88.xlsx",
  roundFolder: "Writing",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 14,
  parts: ["内容质量", "内容风格", "内容创意", "主流题材创作", "约束创作"],
  settings: ["使用方式"],
  details: [{"sheet": "内容质量", "model": "模型名称", "parts": ["事实可靠性", "内容完整性", "节奏流畅度", "逻辑严谨性"]}, {"sheet": "内容风格", "model": "模型名称", "parts": ["人设一致性", "场景风格适配性", "语言表现力"]}, {"sheet": "内容创意", "model": "模型名称", "parts": ["情绪共鸣", "结构反套路", "视角创新", "认知启发"]}, {"sheet": "主流题材创作", "model": "模型名称", "parts": ["IP衍生创作", "剧本杀", "小说故事", "广告文案", "漫画分镜", "直播脚本", "短视频脚本", "网剧剧本"]}, {"sheet": "约束创作", "model": "模型名称", "parts": ["多约束兼容", "跨题材迁移"]}],
});

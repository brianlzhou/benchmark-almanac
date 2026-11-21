// AgentCLUE-Mobile (offline) ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "agentclue-mobile-offline",
  url: "https://www.superclueai.com/agent/Mobile",
  feed: "https://www.superclueai.com/data/agent_list/Mobile/2025%E5%B9%B412%E6%9C%88.xlsx",
  roundFolder: "Mobile",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 12,
  parts: ["UI元素定位平均分", "指令执行平均分"],
  settings: ["使用方式"],
  details: [{"sheet": "不同指令类型得分榜单", "model": "模型名称", "parts": ["指令执行得分", "简单指令得分", "一般指令得分", "困难指令得分"]}, {"sheet": "综合指令执行质量评分榜单", "model": "模型名称", "parts": ["指令执行得分", "任务完成度得分", "平均动作类型准确率得分", "平均动作细节准确匹配率得分"]}, {"sheet": "应用场景榜单", "model": "模型名称", "parts": ["指令执行得分", "视频娱乐", "音乐播放", "交通导航", "本机应用", "旅行预订", "社交通讯", "生活服务", "健康管理", "办公协作"]}],
});

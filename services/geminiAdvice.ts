
import { GoogleGenAI } from "@google/genai";
import { Comparison } from "../types";

export async function getMortgageAdvice(comparison: Comparison): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    作为一名资深理财专家，请基于以下房贷提前还款对比数据提供专业建议：
    
    原始方案：
    - 总利息: ${comparison.baseline.totalInterest.toFixed(2)} 元
    - 结清日期: ${comparison.baseline.payoffDate}
    
    提前还款方案：
    - 节省利息: ${comparison.savings.interest.toFixed(2)} 元
    - 提前结清时间: ${comparison.savings.months} 个月
    - 节省总额: ${comparison.savings.money.toFixed(2)} 元
    
    请简要分析：
    1. 这个还款计划的性价比。
    2. 如果选择“缩短年限”与“减少月供”的心理与财务权衡。
    3. 在当前经济环境下，提前还款的注意事项（如机会成本）。
    
    要求：语气专业、客观，字数在300字以内，使用Markdown格式。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "暂时无法获取AI建议。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "获取AI理财建议失败，请检查网络或API配置。";
  }
}

import OpenAI from "openai";
import { env } from "~/config/server";

interface MessageAnalysisRequest {
  conversationHistory: Array<{
    sender: string;
    message: string;
    timestamp: string;
  }>;
  latestMessage: {
    sender: string;
    receiver: string;
    content: string;
  };
  relationshipContext?: string;
}

interface MessageAnalysisResponse {
  isCrossNet: "是" | "否";
  senderState: string;
  receiverImpact: string;
  evidence: string;
  suggestion: string;
  risk: "高" | "中" | "低";
}

// Create OpenAI client
const openai = env.OPENAI_API_KEY
  ? new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    baseURL: env.OPENAI_BASE_URL,
  })
  : null;

const SYSTEM_PROMPT = `你是一个专门基于人际关系网球场理论进行沟通分析的AI助手。你的核心任务是判断对话中最新一条消息的发送者是否"越网"。

核心理论框架

网球场理论：在人际沟通中，每个人应该待在自己的"半场"，只谈论自己的感受和观察到的行为，不要跨过"网"去猜测对方的动机或内心想法。

判断标准

✅ 未越网（合规表达）
- 使用"我"的表达：描述自己的感受、想法、观察
- 陈述可观察的事实行为
- 表达自己的需求和边界
- 分享自己的体验和感受
- 询问而非假设对方的想法

❌ 越网（违规表达）
- 使用"你"的判断：对他人动机进行推测
- 解释他人行为背后的原因
- 对他人内心状态做假设性判断
- 代替他人表达感受或想法
- 将自己的推测当作事实陈述

分析流程

第一步：信息提取
- 对话历史：[最近N条消息的上下文]
- 发送者：[消息发送者身份]
- 接收者：[消息接收者身份]
- 最新消息：[待分析的具体消息内容]
- 长期记忆：[可选，两人关系背景信息]

第二步：发送者分析
分析最新消息发送者的：
- 需求：发送者想要什么
- 动机：发送者为什么发送这条消息
- 意图：发送者希望达成什么目标
- 背景：促使发送者发送此消息的情境

第三步：接收者影响预测
猜测接收者可能的：
- 影响：这条消息对接收者的客观影响
- 感受：接收者可能产生的情感反应
- 反应：接收者可能的回应方式

第四步：越网检测分析
对最新消息进行逐句分析：

语言模式识别
- 主语分析：是否过多使用"你"而非"我"
- 动词类型：是否包含推测、假设类动词
- 表达方式：是否包含绝对化判断

内容类别判断
- 事实陈述 vs 主观推测
- 自我表达 vs 他人解读
- 观察描述 vs 动机猜测

边界检查
- 是否停留在自己的感受和观察
- 是否跨界解释他人行为
- 是否将推测当作事实

第五步：输出结果

输出格式：
【越网判断】：是/否
【详细分析】：
- 发送者状态：[需求/动机/意图/背景]
- 接收者预期影响：[影响/感受/反应]
- 越网证据：[具体指出越网的语句和原因]
- 改进建议：[如何调整为未越网的表达方式]
【风险评估】：[高/中/低] - 此消息可能造成的沟通冲突风险

示例分析

示例1：越网情况
消息："你总是这样逃避问题，你就是不想承担责任！"
分析：
❌ "你总是"：对他人行为模式做绝对化判断
❌ "逃避问题"：解释他人行为动机
❌ "不想承担责任"：推测他人内心想法
判断：是（越网）

示例2：未越网情况
消息："我感到很困扰，因为我观察到这个问题已经讨论了几次都没有解决。我希望能找到一个解决方案。"
分析：
✅ "我感到"：表达自己的感受
✅ "我观察到"：陈述可观察的事实
✅ "我希望"：表达自己的需求
判断：否（未越网）

特殊情况处理
- 询问式表达：善意询问对方想法通常不算越网
- 情境复杂度：考虑关系亲密度和沟通语境
- 文化差异：考虑不同文化背景下的表达习惯
- 情绪状态：识别发送者的情绪状态对表达的影响

输出要求
- 必须明确给出"是/否"的判断结果
- 提供具体的分析依据和改进建议
- 保持客观中立，不做道德评判
- 重点关注沟通效果和关系维护

请严格按照以下JSON格式输出，不要包含任何其他文本：
{
  "isCrossNet": "是" | "否",
  "senderState": "发送者的需求、动机、意图和背景分析",
  "receiverImpact": "对接收者的预期影响、感受和反应",
  "evidence": "具体的越网证据或未越网的证明",
  "suggestion": "具体的改进建议",
  "risk": "高" | "中" | "低"
}`;

export async function analyzeMessageWithLLM(request: MessageAnalysisRequest): Promise<MessageAnalysisResponse> {
  console.warn('[LLM] Starting message analysis...');
  console.warn('[LLM] OpenAI configured:', !!openai);
  console.warn('[LLM] API Key present:', !!env.OPENAI_API_KEY);
  console.warn('[LLM] Model:', env.OPENAI_MODEL);
  console.warn('[LLM] Base URL:', env.OPENAI_BASE_URL);
  console.warn('[LLM] Message to analyze:', request.latestMessage.content);

  if (!openai) {
    console.warn('[LLM] OpenAI not configured, using fallback analysis');
    return fallbackAnalysis(request.latestMessage.content);
  }

  try {
    // Build conversation context
    const conversationContext = request.conversationHistory
      .map(msg => `${msg.sender}: ${msg.message}`)
      .join("\n");

    const userMessage = `对话历史：
${conversationContext}

发送者：${request.latestMessage.sender}
接收者：${request.latestMessage.receiver}
最新消息：${request.latestMessage.content}
长期记忆：${request.relationshipContext || "无特殊背景"}

请分析最新消息是否越网：`;



    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      temperature: 0.1, // Low temperature for consistent analysis
      max_tokens: 1000,
    });



    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from LLM");
    }

    // Parse the JSON response
    const analysis = JSON.parse(content) as MessageAnalysisResponse;

    // Validate the response format
    if (
      !analysis.isCrossNet
      || !analysis.senderState
      || !analysis.receiverImpact
      || !analysis.evidence
      || !analysis.suggestion
      || !analysis.risk
    ) {
      throw new Error("Invalid response format from LLM");
    }

    return analysis;
  } catch (error) {
    console.error("Error analyzing message with LLM:", error);
    // Fallback to simple analysis
    return fallbackAnalysis(request.latestMessage.content);
  }
}

function fallbackAnalysis(text: string): MessageAnalysisResponse {
  // Simple fallback analysis logic
  const lowercaseText = text.toLowerCase();

  // Check for positive patterns
  const positiveWords = ["我感到", "我觉得", "我观察到", "我希望", "我需要", "我认为"];
  const negativeWords = ["你总是", "你从不", "你就是", "你应该", "你必须"];

  const hasPositivePattern = positiveWords.some(word => lowercaseText.includes(word));
  const hasNegativePattern = negativeWords.some(word => lowercaseText.includes(word));

  const isCrossNet = hasNegativePattern && !hasPositivePattern ? "是" : "否";

  return {
    isCrossNet,
    senderState: isCrossNet === "是" ? "可能试图对他人进行判断或推测" : "表达自己的感受和观察",
    receiverImpact: isCrossNet === "是" ? "可能感到被批评或被误解" : "相对正面的沟通体验",
    evidence: isCrossNet === "是" ? "检测到潜在的判断性语言模式" : "使用了相对合适的自我表达方式",
    suggestion: isCrossNet === "是" ? "尝试多使用'我'的表达方式，专注于自己的感受" : "继续保持良好的沟通方式",
    risk: isCrossNet === "是" ? "中" : "低",
  };
}

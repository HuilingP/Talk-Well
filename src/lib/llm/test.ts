import { analyzeMessageWithLLM } from './client';

// 测试LLM分析功能
export async function testLLMAnalysis() {
  console.log('🧪 开始测试LLM分析功能...');
  
  // 测试案例1：越网消息
  const testCase1 = {
    conversationHistory: [
      {
        sender: 'User A',
        message: '最近工作怎么样？',
        timestamp: new Date().toISOString(),
      }
    ],
    latestMessage: {
      sender: 'User B',
      receiver: 'User A',
      content: '你总是这样问，你就是不关心我的工作！',
    },
    relationshipContext: '同事关系',
  };

  // 测试案例2：未越网消息
  const testCase2 = {
    conversationHistory: [
      {
        sender: 'User A',
        message: '最近工作怎么样？',
        timestamp: new Date().toISOString(),
      }
    ],
    latestMessage: {
      sender: 'User B',
      receiver: 'User A',
      content: '我感到工作压力比较大，我观察到项目时间很紧张。',
    },
    relationshipContext: '同事关系',
  };

  try {
    console.log('\n📋 测试案例1 - 预期越网：');
    console.log('消息:', testCase1.latestMessage.content);
    const result1 = await analyzeMessageWithLLM(testCase1);
    console.log('分析结果:', JSON.stringify(result1, null, 2));

    console.log('\n📋 测试案例2 - 预期未越网：');
    console.log('消息:', testCase2.latestMessage.content);
    const result2 = await analyzeMessageWithLLM(testCase2);
    console.log('分析结果:', JSON.stringify(result2, null, 2));

    console.log('\n✅ LLM分析功能测试完成');
    return { success: true, results: [result1, result2] };
  } catch (error) {
    console.error('\n❌ LLM分析功能测试失败:', error);
    return { success: false, error: error.message };
  }
}

// 如果直接运行此文件
if (require.main === module) {
  testLLMAnalysis();
}
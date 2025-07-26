// LLM配置测试脚本
import { env } from './src/config/server.js';

console.log('=== LLM 配置检查 ===');
console.log('');

// 检查环境变量
console.log('1. 环境变量配置:');
console.log(`   OPENAI_API_KEY: ${env.OPENAI_API_KEY ? `${env.OPENAI_API_KEY.slice(0, 10)}...` : '未设置'}`);
console.log(`   OPENAI_MODEL: ${env.OPENAI_MODEL}`);
console.log(`   OPENAI_BASE_URL: ${env.OPENAI_BASE_URL || '默认 OpenAI URL'}`);
console.log('');

// 检查API密钥格式
if (env.OPENAI_API_KEY) {
  console.log('2. API密钥格式检查:');
  if (env.OPENAI_API_KEY.startsWith('sk-')) {
    console.log('   ✅ API密钥格式正确 (sk-开头)');
  } else {
    console.log('   ⚠️  API密钥格式可能不标准 (通常应该以sk-开头)');
  }
  
  if (env.OPENAI_API_KEY.length >= 45) {
    console.log('   ✅ API密钥长度合理');
  } else {
    console.log('   ⚠️  API密钥长度可能不足');
  }
} else {
  console.log('2. API密钥检查:');
  console.log('   ❌ 未配置API密钥，将使用降级分析');
}
console.log('');

// 检查模型配置
console.log('3. 模型配置检查:');
const supportedModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-4', 'gpt-3.5-turbo'];
if (supportedModels.includes(env.OPENAI_MODEL)) {
  console.log(`   ✅ 模型 "${env.OPENAI_MODEL}" 是支持的模型`);
} else {
  console.log(`   ⚠️  模型 "${env.OPENAI_MODEL}" 可能不是标准OpenAI模型`);
}
console.log('');

// 检查API端点
console.log('4. API端点检查:');
if (env.OPENAI_BASE_URL) {
  if (env.OPENAI_BASE_URL.includes('moonshot')) {
    console.log('   ℹ️  使用Moonshot API端点');
  } else if (env.OPENAI_BASE_URL.includes('openai.com')) {
    console.log('   ✅ 使用官方OpenAI API端点');
  } else {
    console.log(`   ℹ️  使用自定义API端点: ${env.OPENAI_BASE_URL}`);
  }
} else {
  console.log('   ✅ 使用默认OpenAI API端点');
}
console.log('');

console.log('=== 配置建议 ===');
if (!env.OPENAI_API_KEY) {
  console.log('• 建议配置OPENAI_API_KEY以启用LLM分析');
  console.log('• 当前系统会自动降级到简单关键词分析');
} else {
  console.log('• LLM配置看起来正常');
  console.log('• 系统应该能够使用LLM进行深度分析');
}

if (env.OPENAI_BASE_URL && env.OPENAI_BASE_URL.includes('moonshot')) {
  console.log('• 注意：使用的是Moonshot API，请确保API密钥和模型兼容');
}

console.log('');
console.log('=== 测试完成 ===');
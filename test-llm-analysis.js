// 简单的LLM分析测试
import fetch from 'node-fetch';

const testMessage = {
  text: "我感到有些困扰，我观察到最近的沟通中存在一些问题。"
};

const testUrl = 'http://localhost:3000/api/room/test123/message';

console.log('=== LLM分析功能测试 ===');
console.log('发送测试消息:', testMessage.text);
console.log('');

// 注意：这个测试需要有效的认证，所以可能会失败
// 主要是用来查看服务器日志中的LLM调用情况
fetch(testUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': 'test-session'
  },
  body: JSON.stringify(testMessage)
}).then(response => {
  console.log('响应状态:', response.status);
  return response.json();
}).then(data => {
  console.log('响应数据:', JSON.stringify(data, null, 2));
}).catch(error => {
  console.log('预期错误（需要认证）:', error.message);
  console.log('请查看服务器控制台输出以确认LLM是否被调用');
});

console.log('');
console.log('请检查服务器日志以确认：');
console.log('1. 是否有LLM API调用');
console.log('2. 是否有"Error analyzing message with LLM"错误');
console.log('3. 是否降级到简单分析');
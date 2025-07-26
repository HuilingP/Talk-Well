import { db } from './src/lib/db/index.js';
import { message, messageAnalysis } from './src/lib/db/schema.js';
import { like, eq } from 'drizzle-orm';

async function cleanupDefaultMessages() {
  try {
    console.log('清理默认消息...');

    // 首先获取所有默认消息
    const defaultMessages = await db.select().from(message).where(like(message.id, 'default_%'));
    console.log(`找到 ${defaultMessages.length} 条默认消息`);

    // 删除与默认消息相关的分析数据
    for (const msg of defaultMessages) {
      if (msg.analysisId) {
        await db.delete(messageAnalysis).where(eq(messageAnalysis.id, msg.analysisId));
        console.log(`删除分析数据: ${msg.analysisId}`);
      }
    }

    // 删除所有默认消息
    const result = await db.delete(message).where(like(message.id, 'default_%'));
    console.log(`成功删除所有默认消息`);

    // 验证清理结果
    const remainingMessages = await db.select().from(message).where(like(message.id, 'default_%'));
    console.log(`剩余默认消息: ${remainingMessages.length}`);

    process.exit(0);
  } catch (error) {
    console.error('清理失败:', error);
    process.exit(1);
  }
}

cleanupDefaultMessages();
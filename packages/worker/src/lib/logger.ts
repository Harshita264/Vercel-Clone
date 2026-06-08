import { createClient, RedisClientType } from 'redis';

let publisher: RedisClientType | null = null;

export async function getPublisher(): Promise<RedisClientType> {
  if (publisher) return publisher;

  publisher = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  }) as RedisClientType;

  publisher.on('error', (err) => {
    console.error('Redis publisher error:', err);
  });

  await publisher.connect();
  return publisher;
}

export async function publishLog(
  deploymentId: string,
  line: string
): Promise<void> {
  try {
    const pub = await getPublisher();
    await pub.publish(`logs:${deploymentId}`, line);
  } catch (err) {
    // Don't crash the build if logging fails
    console.error('Failed to publish log:', err);
  }
}

export async function disconnectPublisher(): Promise<void> {
  if (publisher) {
    await publisher.disconnect();
    publisher = null;
  }
}

export async function appendBuildLog(
  prisma: PrismaClient,
  deploymentId: string,
  line: string
): Promise<void> {
  await prisma.deployment.update({
    where: { id: deploymentId },
    data: {
      buildLogs: {
        set: undefined,
      },
    },
  });
}
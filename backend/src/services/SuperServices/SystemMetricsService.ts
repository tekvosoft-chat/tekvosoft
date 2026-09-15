import fs from "fs";
import os from "os";
import { QueryTypes } from "sequelize";

import sequelize from "../../database";
import { getPublicPath } from "../../helpers/GetPublicPath";

/**
 * Saúde do servidor para o painel do super admin: CPU, memória, disco,
 * banco e o próprio processo. Tudo lido na hora (a tela consulta a cada
 * poucos segundos); só o tamanho do banco fica 30 s guardado.
 */
type CpuSample = { idle: number; total: number };

const sampleCpu = (): CpuSample =>
  os.cpus().reduce(
    (acc, cpu) => {
      const t = cpu.times;
      acc.idle += t.idle;
      acc.total += t.user + t.nice + t.sys + t.idle + t.irq;
      return acc;
    },
    { idle: 0, total: 0 }
  );

let lastCpu = sampleCpu();
let dbSize = { value: 0, at: 0 };

const readNumber = (file: string): number | null => {
  try {
    const raw = fs.readFileSync(file, "utf8").trim();
    if (!raw || raw === "max") return null;
    const value = Number(raw);
    // cgroup v1 sem limite devolve um número absurdo
    return Number.isFinite(value) && value < 2 ** 60 ? value : null;
  } catch (error) {
    return null;
  }
};

const availableMemory = (): number => {
  try {
    const info = fs.readFileSync("/proc/meminfo", "utf8");
    const match = info.match(/MemAvailable:\s+(\d+)\s+kB/);
    if (match) return Number(match[1]) * 1024;
  } catch (error) {
    // fora do Linux
  }
  return os.freemem();
};

const SystemMetricsService = async () => {
  const now = sampleCpu();
  const idle = now.idle - lastCpu.idle;
  const total = now.total - lastCpu.total;
  lastCpu = now;
  const cpu =
    total > 0 ? Math.max(0, Math.min(100, (1 - idle / total) * 100)) : 0;

  const memTotal = os.totalmem();
  const memUsed = memTotal - availableMemory();

  const containerLimit =
    readNumber("/sys/fs/cgroup/memory.max") ??
    readNumber("/sys/fs/cgroup/memory/memory.limit_in_bytes");
  const containerUsage =
    readNumber("/sys/fs/cgroup/memory.current") ??
    readNumber("/sys/fs/cgroup/memory/memory.usage_in_bytes");

  let disk = { total: 0, used: 0, free: 0 };
  try {
    const stat = (fs as any).statfsSync(getPublicPath());
    const diskTotal = stat.blocks * stat.bsize;
    const diskFree = stat.bavail * stat.bsize;
    disk = { total: diskTotal, free: diskFree, used: diskTotal - diskFree };
  } catch (error) {
    // sem statfs: fica zerado
  }

  if (Date.now() - dbSize.at > 30000) {
    try {
      const [row] = await sequelize.query<{ size: string }>(
        "SELECT pg_database_size(current_database()) AS size",
        { type: QueryTypes.SELECT }
      );
      dbSize = { value: Number(row?.size || 0), at: Date.now() };
    } catch (error) {
      dbSize = { value: dbSize.value, at: Date.now() };
    }
  }

  const [online] = await sequelize.query<{ count: string }>(
    'SELECT COUNT(DISTINCT "userId") AS count FROM "UserSocketSessions" WHERE active = true',
    { type: QueryTypes.SELECT }
  );

  const processMemory = process.memoryUsage();

  return {
    at: new Date().toISOString(),
    cpu: {
      usage: Math.round(cpu * 10) / 10,
      cores: os.cpus().length,
      model: os.cpus()[0]?.model || "",
      load: os.loadavg()
    },
    memory: { total: memTotal, used: memUsed },
    container:
      containerUsage !== null
        ? { used: containerUsage, limit: containerLimit }
        : null,
    disk,
    database: { size: dbSize.value },
    process: {
      rss: processMemory.rss,
      heapUsed: processMemory.heapUsed,
      uptime: Math.round(process.uptime()),
      node: process.version
    },
    host: {
      uptime: Math.round(os.uptime()),
      platform: `${os.type()} ${os.release()}`
    },
    usersOnline: Number(online?.count || 0)
  };
};

export default SystemMetricsService;

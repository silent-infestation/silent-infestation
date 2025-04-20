const { PrismaClient } = require("@prisma/client");
const { runAudit } = require("./index.js");

const prisma = new PrismaClient();

process.on("message", async (msg) => {
  const { startUrl, userId, scanId } = msg;

  try {
    await runAudit(startUrl, userId);

    process.send({ status: "complete" });
    process.exit(0);
  } catch (err) {
    console.error("[scanRunner] Scan failed:", err);
    await prisma.scan.update({
      where: { id: scanId },
      data: { isRunning: false, status: "error", error: err.message },
    });

    process.send({ status: "error", error: err.message });
    process.exit(1);
  }
});

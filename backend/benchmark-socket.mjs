import { io } from "socket.io-client";

const NUM_JOBS = 200;
const API_URL = "http://localhost:3000/api/response";

const sampleCode = `
// A simple loop to take a tiny bit of time
let sum = 0;
for(let i = 0; i < 100000; i++){
  sum += i;
}
console.log(sum);
`;

const payload = {
  code: sampleCode,
  language: "javascript",
};

const socket = io("http://localhost:3000");

async function waitForConnection() {
  return new Promise((resolve, reject) => {
    if (socket.connected) return resolve(undefined);
    socket.on("connect", () => resolve(undefined));
    socket.on("connect_error", (err) => reject(err));
  });
}

async function submitJob() {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data.jobId;
}

function waitForResult(jobId) {
  return new Promise((resolve) => {
    socket.on(`result:${jobId}`, (data) => {
      socket.off(`result:${jobId}`);
      resolve(data);
    });
  });
}

async function runBenchmark() {
  await waitForConnection();
  console.log("Socket.io connected. Starting benchmark...");
  console.log(`Submitting ${NUM_JOBS} jobs concurrently...`);
  const startTime = Date.now();

  // Submit all jobs and set up Socket.io listeners simultaneously
  const resultPromises = [];

  const submitPromises = Array.from({ length: NUM_JOBS }).map(async () => {
    const jobId = await submitJob();
    resultPromises.push(waitForResult(jobId));
    return jobId;
  });

  await Promise.all(submitPromises);
  console.log(`All ${NUM_JOBS} jobs submitted. Waiting for Socket.io results...`);

  // Wait for all results via Socket.io (no polling!)
  const results = await Promise.all(resultPromises);

  const endTime = Date.now();
  const totalTimeSec = ((endTime - startTime) / 1000).toFixed(2);

  const completed = results.filter((r) => r.status === "Completed").length;
  const failed = results.filter((r) => r.status === "Failed").length;

  console.log("\n--- Benchmark Results (Socket.io) ---");
  console.log(`Total Time     : ${totalTimeSec} seconds`);
  console.log(`Total Jobs     : ${NUM_JOBS}`);
  console.log(`Completed      : ${completed}`);
  console.log(`Failed         : ${failed}`);
  console.log(`Throughput     : ${(NUM_JOBS / (endTime - startTime) * 1000).toFixed(2)} jobs/sec`);

  socket.disconnect();
  process.exit(0);
}

runBenchmark().catch((err) => {
  console.error(err);
  process.exit(1);
});

const NUM_JOBS = 200;
const API_URL = "http://localhost:3000/api/response";

const sampleCode = `
// A simple loop to take a tiny bit of time
console.log("Hello World");
`;

const payload = {
  code: sampleCode,
  language: "javascript",
};

async function submitJob() {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data.jobId;
}

async function pollJob(jobId) {
  while (true) {
    const res = await fetch(`${API_URL}/${jobId}`);
    const data = await res.json();
    if (data.status === "Completed" || data.status === "Failed") {
      return data;
    }
    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

async function runBenchmark() {
  console.log(`Submitting ${NUM_JOBS} jobs concurrently...`);
  const startTime = Date.now();

  // Submit all jobs at once
  const submitPromises = Array.from({ length: NUM_JOBS }).map(() => submitJob());
  const jobIds = await Promise.all(submitPromises);

  console.log(`All ${NUM_JOBS} jobs submitted. Polling for completion...`);

  // Poll all jobs
  const pollPromises = jobIds.map((id) => pollJob(id));
  const results = await Promise.all(pollPromises);

  const endTime = Date.now();
  const totalTimeSec = ((endTime - startTime) / 1000).toFixed(2);

  const completed = results.filter((r) => r.status === "Completed").length;
  const failed = results.filter((r) => r.status === "Failed").length;

  console.log("\n--- Benchmark Results (HTTP Polling) ---");
  console.log(`Total Time     : ${totalTimeSec} seconds`);
  console.log(`Total Jobs     : ${NUM_JOBS}`);
  console.log(`Completed      : ${completed}`);
  console.log(`Failed         : ${failed}`);
  console.log(`Throughput     : ${(NUM_JOBS / (endTime - startTime) * 1000).toFixed(2)} jobs/sec`);
}

runBenchmark().catch(console.error);

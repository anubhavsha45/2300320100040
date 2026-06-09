const axios = require("axios");
require("dotenv").config();

const BASE_URL = "http://4.224.186.213/evaluation-service";

async function fetchDepots() {
  const response = await axios.get(`${BASE_URL}/depots`, {
    headers: {
      Authorization: `Bearer ${process.env.TOKEN}`,
    },
  });

  return response.data.depots;
}

async function fetchVehicles() {
  const response = await axios.get(`${BASE_URL}/vehicles`, {
    headers: {
      Authorization: `Bearer ${process.env.TOKEN}`,
    },
  });

  return response.data.vehicles;
}

function getBestTasks(tasks, availableHours) {
  const n = tasks.length;

  const dp = Array.from({ length: n + 1 }, () =>
    Array(availableHours + 1).fill(0),
  );

  for (let i = 1; i <= n; i++) {
    const currentTask = tasks[i - 1];

    for (let hours = 0; hours <= availableHours; hours++) {
      if (currentTask.Duration <= hours) {
        const includeTask =
          currentTask.Impact + dp[i - 1][hours - currentTask.Duration];

        const skipTask = dp[i - 1][hours];

        dp[i][hours] = Math.max(includeTask, skipTask);
      } else {
        dp[i][hours] = dp[i - 1][hours];
      }
    }
  }

  const selectedTasks = [];

  let remainingHours = availableHours;

  for (let i = n; i > 0; i--) {
    if (dp[i][remainingHours] !== dp[i - 1][remainingHours]) {
      selectedTasks.push(tasks[i - 1]);
      remainingHours -= tasks[i - 1].Duration;
    }
  }

  return {
    maxImpact: dp[n][availableHours],
    selectedTasks,
  };
}

function printDepotResult(depotId, hours, result) {
  const totalDuration = result.selectedTasks.reduce(
    (sum, task) => sum + task.Duration,
    0,
  );

  console.log("\n=================================================");
  console.log(`DEPOT ${depotId}`);
  console.log("=================================================");
  console.log(`Available Mechanic Hours : ${hours}`);
  console.log(`Maximum Impact Achieved  : ${result.maxImpact}`);
  console.log(`Total Duration Used      : ${totalDuration}`);
  console.log(`Tasks Selected           : ${result.selectedTasks.length}`);

  console.log("\nSelected Tasks:");
  console.table(
    result.selectedTasks.map((task) => ({
      TaskID: task.TaskID.slice(0, 8) + "...",
      Duration: task.Duration,
      Impact: task.Impact,
    })),
  );
}

async function main() {
  try {
    const depots = await fetchDepots();
    const vehicles = await fetchVehicles();

    for (const depot of depots) {
      const result = getBestTasks(vehicles, depot.MechanicHours);

      printDepotResult(depot.ID, depot.MechanicHours, result);
    }
  } catch (error) {
    console.log("Something went wrong:", error.response?.data || error.message);
  }
}

main();

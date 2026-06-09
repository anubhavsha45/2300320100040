const axios = require("axios");
require("dotenv").config();

const BASE_URL = "http://4.224.186.213/evaluation-service";

const priorityWeight = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

async function fetchNotifications() {
  const response = await axios.get(`${BASE_URL}/notifications`, {
    headers: {
      Authorization: `Bearer ${process.env.TOKEN}`,
    },
  });

  return response.data.notifications;
}

function calculatePriority(notification) {
  const weight = priorityWeight[notification.Type] || 0;

  const timestamp = new Date(notification.Timestamp).getTime();

  return {
    ...notification,
    score: weight * 1000000000000 + timestamp,
  };
}

async function main() {
  try {
    const notifications = await fetchNotifications();

    const topNotifications = notifications
      .map(calculatePriority)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    console.log("\n===== TOP 10 PRIORITY NOTIFICATIONS =====\n");

    console.table(
      topNotifications.map((n) => ({
        Type: n.Type,
        Message: n.Message,
        Timestamp: n.Timestamp,
      })),
    );
  } catch (error) {
    console.log("Error:", error.response?.data || error.message);
  }
}

main();

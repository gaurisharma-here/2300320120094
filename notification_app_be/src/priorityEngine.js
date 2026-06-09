const typeWeights = {
  Placement: 100,
  Result: 80,
  Event: 40,
};

function getAgeScore(timestamp) {
  const ageInHours = (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60);
  return Math.max(0, 100 - ageInHours);
}

function computeScore(notification) {
  const typeScore = typeWeights[notification.Type] || 10;
  const ageScore = getAgeScore(notification.Timestamp);
  return typeScore + ageScore;
}

function rankNotifications(notifications, topN = 10) {
  const scored = notifications.map((n) => ({
    ...n,
    priorityScore: computeScore(n),
  }));
  scored.sort((a, b) => b.priorityScore - a.priorityScore);
  return scored.slice(0, topN);
}

export default rankNotifications;

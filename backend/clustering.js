function salaryClusters(employees, k = 3) {
  if (!employees.length) return [];
  const values = employees.map((employee) => employee.salary);
  const clusterCount = Math.min(k, values.length);
  let centroids = Array.from({ length: clusterCount }, (_, index) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.round((index * (values.length - 1)) / Math.max(clusterCount - 1, 1))];
  });

  for (let iteration = 0; iteration < 20; iteration += 1) {
    const groups = centroids.map(() => []);
    values.forEach((salary) => {
      const groupIndex = centroids.reduce((best, centroid, index) => Math.abs(salary - centroid) < Math.abs(salary - centroids[best]) ? index : best, 0);
      groups[groupIndex].push(salary);
    });
    const nextCentroids = groups.map((group, index) => group.length ? group.reduce((sum, salary) => sum + salary, 0) / group.length : centroids[index]);
    if (nextCentroids.every((centroid, index) => centroid === centroids[index])) break;
    centroids = nextCentroids;
  }

  return centroids.map((centroid, index) => {
    const count = values.filter((salary) => centroids.reduce((best, value, candidate) => Math.abs(salary - value) < Math.abs(salary - centroids[best]) ? candidate : best, 0) === index).length;
    return { group: `Tier ${index + 1}`, centroid: Math.round(centroid), count };
  }).sort((a, b) => a.centroid - b.centroid).map((cluster, index) => ({ ...cluster, group: `Tier ${index + 1}` }));
}

module.exports = { salaryClusters };

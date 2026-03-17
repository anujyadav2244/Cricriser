export function buildPlayerMap(matchDetails) {
  if (!matchDetails) return {};

  const allPlayers = [
    ...matchDetails.team1.squad,
    ...matchDetails.team2.squad,
  ];

  const map = {};
  allPlayers.forEach(p => {
    map[p.id] = p.name;
  });

  return map;
}

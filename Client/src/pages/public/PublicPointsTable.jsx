import { useEffect, useState } from "react";
import { getPointsTable } from "@/api/public.api";
import { Card, CardContent } from "@/components/ui/card";

function PublicPointsTable() {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        // ⚠ For now using first league or hardcode leagueId if needed
        const leagueId = "default"; // Replace later dynamically
        const res = await getPointsTable(leagueId);
        setPoints(res.data);
      } catch (error) {
        console.error("Error fetching points table", error);
      }
    };

    fetchPoints();
  }, []);

  return (
    <div className="max-w-5xl mx-auto mt-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-4">Points Table</h2>

          {points.length === 0 ? (
            <p className="text-gray-500">No data available</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Team</th>
                  <th>M</th>
                  <th>W</th>
                  <th>L</th>
                  <th>Pts</th>
                  <th>NRR</th>
                </tr>
              </thead>
              <tbody>
                {points.map((team, index) => (
                  <tr key={index} className="border-b text-center">
                    <td className="text-left py-2">{team.teamName}</td>
                    <td>{team.matches}</td>
                    <td>{team.wins}</td>
                    <td>{team.losses}</td>
                    <td className="font-semibold">{team.points}</td>
                    <td>{team.netRunRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default PublicPointsTable;

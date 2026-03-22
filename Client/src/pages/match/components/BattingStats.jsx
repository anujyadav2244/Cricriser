import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import BASE_URL from "@/api/config";

export default function BattingStats({ matchScore, matchDetails }) {
    const [batting, setBatting] = useState(null);
    const token = localStorage.getItem("token");

    /* ================= PLAYER NAME FIX ================= */
    const findPlayerName = (playerId) => {
        const players = [
            ...matchDetails.team1.squad,
            ...matchDetails.team2.squad,
        ];

        return players.find((p) => p.id === playerId)?.name || playerId;
    };

    /* ================= FETCH STATS ================= */
    useEffect(() => {
        if (!matchScore?.strikerId || !matchScore?.nonStrikerId) return;

        fetch(
            `${BASE_URL}/api/match-player-stats/batting` +
            `?matchId=${matchScore.matchId}` +
            `&strikerId=${matchScore.strikerId}` +
            `&nonStrikerId=${matchScore.nonStrikerId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        )
            .then((res) => res.json())
            .then(setBatting)
            .catch((err) =>
                console.error("Failed to load batting stats", err)
            );
    }, [matchScore?.strikerId, matchScore?.nonStrikerId]);

    if (!batting) return null;

    const { striker, nonStriker } = batting;

    return (
        <Card>
            <CardContent className="p-4 space-y-3">

                <h3 className="font-semibold text-sm text-gray-600">
                    Batters
                </h3>

                {/* STRIKER */}
                <div className="flex justify-between">
                    <p className="font-semibold">
                        {findPlayerName(striker.playerId)}
                        <span className="text-green-600">*</span>
                    </p>
                    <p className="font-medium">
                        {striker.runs} ({striker.balls})
                    </p>
                </div>

                {/* NON STRIKER */}
                <div className="flex justify-between">
                    <p className="font-semibold">
                        {findPlayerName(nonStriker.playerId)}
                    </p>
                    <p className="font-medium">
                        {nonStriker.runs} ({nonStriker.balls})
                    </p>
                </div>

            </CardContent>
        </Card>
    );
}

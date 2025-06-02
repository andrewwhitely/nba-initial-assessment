import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';

import { BalldontlieAPI } from '@balldontlie/sdk/dist/index.js';

interface DraftStats {
  round1: number;
  round2: number;
  undrafted: number;
  total: number;
}

interface NBAPlayer {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  height: string;
  weight: string;
  jersey_number: string;
  college: string;
  country: string;
  draft_year: number;
  draft_round: number;
  draft_number: number;
  team: NBATeam;
}

interface NBATeam {
  id: number;
  conference: 'East' | 'West';
  division:
    | 'Atlantic'
    | 'Central'
    | 'Southeast'
    | 'Northwest'
    | 'Pacific'
    | 'Southwest';
  city: string;
  name: string;
  full_name: string;
  abbreviation: string;
}

function App() {
  const [teamName, setTeamName] = useState('');

  const [teams, setTeams] = useState<NBATeam[] | null>(() => {
    const cachedTeams = localStorage.getItem('nbaTeams');
    return cachedTeams ? JSON.parse(cachedTeams) : null;
  });

  const [draftStats, setDraftStats] = useState<DraftStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [rawResponses, setRawResponses] = useState<{
    teams?: string;
    players?: string;
  }>({});

  const api = useMemo(
    () =>
      new BalldontlieAPI({
        apiKey: import.meta.env.VITE_BALL_DONT_LIE_API_KEY || '',
      }),
    []
  );

  const fetchTeams = useCallback(async () => {
    const cachedTeams = localStorage.getItem('nbaTeams');
    if (teams || cachedTeams) return;

    try {
      const response = await api.nba.getTeams();
      setTeams(response.data);
      setRawResponses((prev) => ({
        ...prev,
        teams: JSON.stringify(response, null, 2),
      }));
      localStorage.setItem('nbaTeams', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }, [api.nba, teams]);

  const calculateDraftStats = (players: NBAPlayer[]): DraftStats => {
    return players.reduce(
      (stats, player) => {
        if (!player.draft_round) {
          stats.undrafted++;
        } else if (player.draft_round === 1) {
          stats.round1++;
        } else if (player.draft_round === 2) {
          stats.round2++;
        }
        stats.total++;
        return stats;
      },
      { round1: 0, round2: 0, undrafted: 0, total: 0 }
    );
  };

  const fetchTeamPlayers = useCallback(async () => {
    if (!teamName) return;

    setLoading(true);
    try {
      const selectedTeam = teams?.find((t) => t.full_name === teamName);
      if (!selectedTeam) return;

      const response = await api.nba.getPlayers({
        team_ids: [selectedTeam.id],
        per_page: 100,
      });

      setDraftStats(calculateDraftStats(response.data));
      setRawResponses((prev) => ({
        ...prev,
        players: JSON.stringify(response, null, 2),
      }));
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  }, [api.nba, teamName, teams]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return (
    <div>
      <h1>{teamName || 'NBA'} Draft Statistics</h1>
      <div>
        <select
          value={teamName}
          onChange={(e) => {
            const newTeam = e.target.value;
            if (newTeam !== teamName) {
              setDraftStats(null);
              setRawResponses((prev) => ({ teams: prev.teams }));
            }
            setTeamName(newTeam);
          }}
          className='team-select'
        >
          <option value=''>Select a team</option>
          <optgroup label='Eastern Conference'>
            {teams
              ?.filter((team) => team.conference === 'East')
              .sort((a, b) => a.full_name.localeCompare(b.full_name))
              .map((team) => (
                <option key={team.id} value={team.full_name}>
                  {team.full_name}
                </option>
              ))}
          </optgroup>
          <optgroup label='Western Conference'>
            {teams
              ?.filter((team) => team.conference === 'West')
              .sort((a, b) => a.full_name.localeCompare(b.full_name))
              .map((team) => (
                <option key={team.id} value={team.full_name}>
                  {team.full_name}
                </option>
              ))}
          </optgroup>
          <optgroup label='Other'>
            {teams
              ?.filter(
                (team) =>
                  team.conference !== 'West' && team.conference !== 'East'
              )
              .sort((a, b) => a.full_name.localeCompare(b.full_name))
              .map((team) => (
                <option key={team.id} value={team.full_name}>
                  {team.full_name}
                </option>
              ))}
          </optgroup>
        </select>
        <button
          onClick={fetchTeamPlayers}
          disabled={!teamName || loading}
          className='fetch-button'
        >
          {loading ? 'Loading...' : 'Get Draft Stats'}
        </button>
      </div>
      {draftStats && (
        <div className='stats-container'>
          <h2>Draft Round Statistics</h2>
          <div className='stats-grid'>
            <div className='stat-item'>
              <h3>First Round</h3>
              <p>{draftStats.round1} players</p>
              <p>
                ({((draftStats.round1 / draftStats.total) * 100).toFixed(1)}%)
              </p>
            </div>
            <div className='stat-item'>
              <h3>Second Round</h3>
              <p>{draftStats.round2} players</p>
              <p>
                ({((draftStats.round2 / draftStats.total) * 100).toFixed(1)}%)
              </p>
            </div>
            <div className='stat-item'>
              <h3>Undrafted</h3>
              <p>{draftStats.undrafted} players</p>
              <p>
                ({((draftStats.undrafted / draftStats.total) * 100).toFixed(1)}
                %)
              </p>
            </div>
            <div className='stat-item'>
              <h3>Total Players</h3>
              <p>{draftStats.total}</p>
            </div>
          </div>
        </div>
      )}
      <div className='json-output'>
        <details>
          <summary>API Response Data</summary>
          {rawResponses.teams && (
            <>
              <h3>Teams Response:</h3>
              <pre>{rawResponses.teams}</pre>
            </>
          )}
          {rawResponses.players && (
            <>
              <h3>Players Response:</h3>
              <pre>{rawResponses.players}</pre>
            </>
          )}
        </details>
      </div>
    </div>
  );
}

export default App;

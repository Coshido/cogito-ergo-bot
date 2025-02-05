const fs = require('fs').promises;
const path = require('path');

class LeagueManager {
    static LEAGUE_DATA_PATH = path.join(__dirname, '../database/league-data.json');

    // Initialize or load league data
    static async initializeLeague(leagueName) {
        // Get participants from registration list
        const participants = await this.getParticipants();

        if (participants.length < 2) {
            throw new Error('Not enough participants to start a league. Minimum 2 required.');
        }

        // Use usernames for league initialization
        const participantNames = participants.map(p => p.username);

        const leagueData = {
            name: leagueName,
            participants: participantNames,
            matches: this.generateRoundRobinSchedule(participantNames),
            standings: this.initializeStandings(participantNames)
        };

        await this.saveLeagueData(leagueData);
        return leagueData;
    }

    // Generate round-robin schedule
    static generateRoundRobinSchedule(participants) {
        const matches = [];
        const n = participants.length;
        
        // If odd number of participants, add a "bye" participant
        if (n % 2 !== 0) {
            participants.push('BYE');
        }

        const totalRounds = participants.length - 1;
        const halfSize = participants.length / 2;

        for (let round = 0; round < totalRounds; round++) {
            const roundMatches = [];
            for (let i = 0; i < halfSize; i++) {
                const home = participants[(round + i) % (n - 1)];
                const away = participants[(n - 1 - i + round) % (n - 1)];
                
                // Alternate home/away to ensure fairness
                if (round % 2 === 0) {
                    roundMatches.push({
                        home: home,
                        away: away,
                        round: round + 1,
                        status: 'scheduled',
                        result: null
                    });
                } else {
                    roundMatches.push({
                        home: away,
                        away: home,
                        round: round + 1,
                        status: 'scheduled',
                        result: null
                    });
                }
            }
            matches.push(...roundMatches);
        }

        return matches;
    }

    // Initialize standings
    static initializeStandings(participants) {
        return participants.map(participant => ({
            name: participant,
            points: 0,
            matchesPlayed: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0
        }));
    }

    // Record match result
    static async recordMatchResult(matchId, result) {
        const leagueData = await this.loadLeagueData();
        
        const matchIndex = leagueData.matches.findIndex(m => m.id === matchId);
        if (matchIndex === -1) {
            throw new Error('Match not found');
        }

        // Update match status and result
        leagueData.matches[matchIndex].status = 'completed';
        leagueData.matches[matchIndex].result = result;

        // Update standings
        this.updateStandings(leagueData, matchId, result);

        await this.saveLeagueData(leagueData);
        return leagueData;
    }

    // Update league standings based on match result
    static updateStandings(leagueData, matchId, result) {
        const match = leagueData.matches.find(m => m.id === matchId);
        const standings = leagueData.standings;

        // Find home and away team standings
        const homeTeamStanding = standings.find(s => s.name === match.home);
        const awayTeamStanding = standings.find(s => s.name === match.away);

        // Update match statistics
        homeTeamStanding.matchesPlayed++;
        awayTeamStanding.matchesPlayed++;

        // Update goals
        homeTeamStanding.goalsFor += result.homeGoals;
        homeTeamStanding.goalsAgainst += result.awayGoals;
        awayTeamStanding.goalsFor += result.awayGoals;
        awayTeamStanding.goalsAgainst += result.homeGoals;

        // Determine match outcome
        if (result.homeGoals > result.awayGoals) {
            // Home team wins
            homeTeamStanding.points += 3;
            homeTeamStanding.wins++;
            awayTeamStanding.losses++;
        } else if (result.homeGoals < result.awayGoals) {
            // Away team wins
            awayTeamStanding.points += 3;
            awayTeamStanding.wins++;
            homeTeamStanding.losses++;
        } else {
            // Draw
            homeTeamStanding.points += 1;
            awayTeamStanding.points += 1;
            homeTeamStanding.draws++;
            awayTeamStanding.draws++;
        }

        // Sort standings by points (descending)
        leagueData.standings.sort((a, b) => {
            // Sort by points first
            if (b.points !== a.points) return b.points - a.points;
            
            // If points are equal, sort by goal difference
            const goalDiffA = a.goalsFor - a.goalsAgainst;
            const goalDiffB = b.goalsFor - b.goalsAgainst;
            return goalDiffB - goalDiffA;
        });
    }

    // Load league data
    static async loadLeagueData() {
        try {
            const data = await fs.readFile(this.LEAGUE_DATA_PATH, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }

    // Save league data
    static async saveLeagueData(leagueData) {
        await fs.writeFile(
            this.LEAGUE_DATA_PATH, 
            JSON.stringify(leagueData, null, 2)
        );
    }

    // Get upcoming matches
    static async getUpcomingMatches() {
        const leagueData = await this.loadLeagueData();
        return leagueData.matches.filter(match => match.status === 'scheduled');
    }

    // Get current standings
    static async getCurrentStandings() {
        const leagueData = await this.loadLeagueData();
        return leagueData.standings;
    }

    // Add participant
    static async addParticipant(userId, username) {
        const participantsPath = path.join(__dirname, '../database/league-participants.json');
        
        try {
            // Read existing participants
            let participants;
            try {
                const data = await fs.readFile(participantsPath, 'utf8');
                participants = JSON.parse(data);
            } catch (error) {
                // If file doesn't exist, initialize empty array
                if (error.code === 'ENOENT') {
                    participants = [];
                } else {
                    throw error;
                }
            }

            // Check if user is already registered
            const existingParticipant = participants.find(p => p.userId === userId);
            if (existingParticipant) {
                throw new Error('You are already registered for the league.');
            }

            // Add new participant
            participants.push({
                userId,
                username,
                registeredAt: new Date().toISOString()
            });

            // Save updated participants
            await fs.writeFile(participantsPath, JSON.stringify(participants, null, 2));

            return participants;
        } catch (error) {
            console.error('Error adding participant:', error);
            throw error;
        }
    }

    // Remove participant
    static async removeParticipant(userId) {
        const participantsPath = path.join(__dirname, '../database/league-participants.json');
        
        try {
            // Read existing participants
            let participants;
            try {
                const data = await fs.readFile(participantsPath, 'utf8');
                participants = JSON.parse(data);
            } catch (error) {
                // If file doesn't exist, return empty array
                if (error.code === 'ENOENT') {
                    return [];
                }
                throw error;
            }

            // Remove participant
            participants = participants.filter(p => p.userId !== userId);

            // Save updated participants
            await fs.writeFile(participantsPath, JSON.stringify(participants, null, 2));

            return participants;
        } catch (error) {
            console.error('Error removing participant:', error);
            throw error;
        }
    }

    // Get participants
    static async getParticipants() {
        const participantsPath = path.join(__dirname, '../database/league-participants.json');
        
        try {
            const data = await fs.readFile(participantsPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // If file doesn't exist, return empty array
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }
}

module.exports = LeagueManager;

export class Storage {
	constructor(prefix = "besedko+") {
		this.prefix = prefix;
	}

	key(k) {
		return `${this.prefix}:${k}`;
	}

	get(k, fallback = null) {
		try {
			const v = localStorage.getItem(this.key(k));
			return v === null ? fallback : JSON.parse(v);
		} catch (e) {
			return fallback;
		}
	}

	set(k, v) {
		try {
			localStorage.setItem(this.key(k), JSON.stringify(v));
		} catch (e) {
			// ignore storage errors
		}
	}

	incrementStat(statKey) {
		const s = this.get("stats", {});
		s[statKey] = (s[statKey] || 0) + 1;
		this.set("stats", s);
	}

	recordGame({ mode = "classic", wordLength = 5, won = false, guessCount = null, taScore = null, cluesUsed = null, isMultiplayer = false } = {}) {
		const s = this.get("stats", {});

		// Totals (backward compat)
		s.played = (s.played || 0) + 1;
		if (won) s.wins = (s.wins || 0) + 1;

		// Streak (only for finite modes: not zen, not timeattack)
		const countsForStreak = mode !== "zen" && mode !== "timeattack";
		if (countsForStreak) {
			if (won) {
				s.streak = (s.streak || 0) + 1;
				s.bestStreak = Math.max(s.bestStreak || 0, s.streak);
			} else {
				s.streak = 0;
			}
		}

		// Guess distribution (wins only, finite modes, not riddle)
		const countsDist = won && guessCount && mode !== "timeattack" && mode !== "zen" && mode !== "riddle";
		if (countsDist) {
			if (!s.guessDistribution) s.guessDistribution = [0,0,0,0,0,0,0,0];
			const idx = Math.min(guessCount - 1, 7);
			s.guessDistribution[idx] = (s.guessDistribution[idx] || 0) + 1;
		}

		// By mode
		if (!s.byMode) s.byMode = {};
		const modeKey = isMultiplayer ? "multiplayer" : mode;
		const m = s.byMode[modeKey] || {};
		m.played = (m.played || 0) + 1;
		if (won) m.wins = (m.wins || 0) + 1;
		if (guessCount != null && mode !== "timeattack") m.totalGuesses = (m.totalGuesses || 0) + guessCount;
		if (taScore != null) m.bestScore = Math.max(m.bestScore || 0, taScore);
		if (cluesUsed != null) m.totalClues = (m.totalClues || 0) + cluesUsed;
		s.byMode[modeKey] = m;

		// By word length (not timeattack, not riddle)
		if (wordLength && mode !== "timeattack" && mode !== "riddle") {
			if (!s.byLength) s.byLength = {};
			const l = s.byLength[String(wordLength)] || {};
			l.played = (l.played || 0) + 1;
			if (won) l.wins = (l.wins || 0) + 1;
			s.byLength[String(wordLength)] = l;
		}

		this.set("stats", s);
	}

	getNickname() { return this.get("nickname", null); }
	setNickname(name) { this.set("nickname", name.trim().slice(0, 20)); }
	getAvatar() { return this.get("avatar", "🎮"); }
	setAvatar(emoji) { this.set("avatar", emoji); }

	getStats() {
		return this.get("stats", {});
	}

	setStats(stats) {
		this.set("stats", stats);
	}
}

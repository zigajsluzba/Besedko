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

	getStats() {
		return this.get("stats", {});
	}

	setStats(stats) {
		this.set("stats", stats);
	}
}

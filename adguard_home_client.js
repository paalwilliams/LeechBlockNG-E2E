
class AdguardHomeClient{
	/**
	 * 
	 * @param {{
	 * username: string,
	 * password: string,
	 * baseUrl: string,
	 * port: string
	 * }} options 
	*/
	constructor({username, password, baseUrl, port}) {

		this.username = username;
		this.password = password;
		this.baseUrl = baseUrl
		this.port = port
		const token = window.btoa(`${this.username}:${this.password}`)
		this.headers = new Headers({
			"Content-type": "application/json",
			"Authorization": `Basic ${token}`
		});
	}

	/**
	 * @param {string} path
	 * @param {RequestInit} options
	 */
	async makeRequest(path, options) {
		const url = `${this.baseUrl}:${this.port}/control${path}`
		return fetch(url, {...options, headers: this.headers})
	}

	async getFilteringStatus () {
		return this.makeRequest("/filtering/status")
	}

	/**
	 * 
	 * @param {string[]} rules 
	 */
	async setRules(rules) {
		return this.makeRequest("/filtering/set_rules", {method: 'POST', body: JSON.stringify({rules})})
	}
	
	/** 
	* @param {string} userRules
	* @returns {string} 
	*/
	applySiteBlockPattern(url) {
		 return `||${url}^`
	}

	/**
	* @param {string[]} userRules
	* @param {number} set
	* @returns {string[]}
	*/
	formatRequestBody(userRules, set) {
		const existingUserRules = userRules || [];

		const sites = gOptions[`sites${set}`].split(" ");

		const sitesWithblockPattern = sites.map(this.applySiteBlockPattern.bind(this));

		const newRules = [...sitesWithblockPattern,]

		const filteredRules = existingUserRules.filter((r) => !newRules.includes(r));
		const rules = [...filteredRules, ...newRules]
		return rules

	}
}

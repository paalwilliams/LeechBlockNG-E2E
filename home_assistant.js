class HomeAssistantClient {

/**
 * @param {{
 * token: string,
 * baseUrl: string,
 * port: string
 * }} options 
*/
constructor({token, baseUrl, port}) {

	this.token = token;
	this.baseUrl = baseUrl
	this.port = port

	this.headers = new Headers({
		"Content-type": "application/json",
		"Authorization": `Bearer ${this.token}`
	});
}

/**
 * @param {string} path
 * @param {RequestInit} options
 */
async makeRequest(path, options) {
	const url = `${this.baseUrl}:${this.port}/api${path}`
	return fetch(url, {...options, headers: this.headers})
}

/**
 *
 * @param {string} timestamp
 * @param {number} set
 */
formatTimestamp(timestamp, set) {
	const date = new Date(timestamp)
	const d = new Date(date.getTime() + set*60000);
	const pad = n => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` 

}

/**
 * @param {string} entityId
 * @param {string[]} value
 * @param {string} timestamp
 * @param {number} set
 */
async setStateValue(entityId, value, timestamp, set) {

	const dateTime = this.formatTimestamp(timestamp, set)
	const date = new Date(timestamp)
	const d = new Date(date.getTime() + set*60000);

	return this.makeRequest(`/states/${entityId}`, {method: 'POST', body: JSON.stringify({
			state: dateTime,
			attributes: {
				year: d.getFullYear(),
				month: d.getMonth() + 1,
				day: d.getDate(),
				hour: d.getHours(),
				minute: d.getMinutes(),
				second: d.getSeconds(),
				editable: true,
				has_time: true,
				has_date: true,
				friendly_name: `Blocklist ${set}`,
				rules: JSON.stringify(value)
			}
	})
		
}
)}

}

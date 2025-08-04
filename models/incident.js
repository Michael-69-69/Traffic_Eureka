class Incident {
    static incidents = [];

    static create(data) {
        const incident = { id: Date.now(), ...data };
        this.incidents.push(incident);
        return incident;
    }

    static getAll() {
        return this.incidents;
    }
}

module.exports = Incident;
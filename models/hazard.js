class Hazard {
    static hazards = [];

    static create(data) {
        const hazard = { id: Date.now(), ...data };
        this.hazards.push(hazard);
        return hazard;
    }

    static getAll() {
        return this.hazards;
    }
}

module.exports = Hazard;
export class Identity {
    firstName;
    lastName;
    static TYPE = 'Identity';
    _type = Identity.TYPE;
    constructor(firstName = 'Inconnu', lastName = 'Anonyme') {
        this.firstName = firstName;
        this.lastName = lastName;
    }
    get fullName() {
        return `${this.firstName} ${this.lastName}`;
    }
}
//# sourceMappingURL=Identity.js.map
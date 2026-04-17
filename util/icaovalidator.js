function isValidICAO(id) {
    if (typeof id !== 'string') return false;
    return /^[A-Z]{4}$/.test(id.trim().toUpperCase());
}
function isValidMinutes(checkTimes) {
    return checkTimes.every(v => Number.isInteger(v));
}
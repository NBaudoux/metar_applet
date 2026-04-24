function isValidMinutes(checkTimes) {
    return checkTimes.some(v => !Number.isInteger(v));
}
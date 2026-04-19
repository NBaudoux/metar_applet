function formatMetar(metarLine, lineLength) {
    let displayText = metarLine.substring(0, lineLength);
    if (metarLine.length > lineLength) {
        const lastSpaceIndex = metarLine.substring(0, lineLength).lastIndexOf(" ");
        displayText = metarLine.substring(0, lastSpaceIndex);
        displayText += "\n";
        displayText += metarLine.substring(lastSpaceIndex+1, 2 * lineLength);
        if (metarLine.length > 2 * lineLength) displayText += "...";
    }
    return displayText;
}

function formatZuluTime(date) {
    const hour = doubleDigitTime(date.getUTCHours());
    const minutes = doubleDigitTime(date.getUTCMinutes());
    return hour.toString()+minutes.toString()+"Z";
}

function doubleDigitTime(time) {
    return time < 10 ? "0" + time : time.toString();
}
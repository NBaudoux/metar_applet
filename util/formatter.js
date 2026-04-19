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
    const hour = date.getUTCHours() < 10 ? "0" + date.getUTCHours() : date.getUTCHours().toString();
    const minutes = date.getUTCMinutes() < 10 ? "0" + date.getUTCMinutes() : date.getUTCMinutes().toString();
    return hour.toString()+minutes.toString()+"Z";
}
const createLogText = (errorArray, fileName) => {
    let text = "Errors for \"" + fileName + "\":";

    for (let i = 0; i < errorArray.length; i++) {
        const currentList = errorArray[i];

        if ( currentList.length ===0 ) continue;

        text += "\r\n\r\nLis No" + (i + 1) + "(" + currentList[0].listName + ")\r\n";
        text += "No - ROW - VALUE - ERROR TYPE\r\n\r\n";

        for (let j = 0; j < currentList.length; j++) {
            const currentError = currentList[j];
            text += "" + (j + 1)         + " - "
                    + currentError.row   + " - "
                    + currentError.value + " - "
                    + currentError.error + "\r\n";

        }
    }

    return text;
};

export default createLogText;
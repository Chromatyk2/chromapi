function getLevelFromXp(xp) {

    return Math.floor(
        (
            Math.sqrt(
                1 + (16 * xp) / 100
            ) - 1
        ) / 2 + 1
    );

}

module.exports = {
    getLevelFromXp
};
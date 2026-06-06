const express = require('express');
const db = require('./config/db')
const cors = require('cors');
const cron = require("node-cron");
const app = express();
const PORT = 8080;
const axios = require('axios');
require('dotenv').config();

app.use(express.json())
app.use(
    cors({
        origin:
            "https://chromatyk.fr",
        credentials: true
    })
);

// TWITCH
let twitchCache = {
    live: false,
    title: "",
    viewers: 0,
    updatedAt: null
};
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const session =  require("express-session");
app.set(
    "trust proxy",
    1
);
app.use(
    session({
        secret:
            process.env.SESSION_SECRET,

        resave: false,

        saveUninitialized: false,

        cookie: {

            httpOnly: true,

            secure: true,

            sameSite: "lax",

            maxAge:
                1000 * 60 * 60 * 24 * 30

        }

    })
);
async function updateTwitchCache() {

    try {

        const tokenResponse = await axios.post(
            "https://id.twitch.tv/oauth2/token",
            null,
            {
                params: {
                    client_id: TWITCH_CLIENT_ID,
                    client_secret: TWITCH_CLIENT_SECRET,
                    grant_type: "client_credentials"
                }
            }
        );

        const accessToken =
            tokenResponse.data.access_token;

        const streamResponse = await axios.get(
            "https://api.twitch.tv/helix/streams?user_login=chromatyk",
            {
                headers: {
                    "Client-Id": TWITCH_CLIENT_ID,
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        const stream =
            streamResponse.data.data[0];

        twitchCache = {
            live: !!stream,
            title: stream?.title || "",
            viewers: stream?.viewer_count || 0,
            updatedAt: new Date()
        };

        console.log(
            `[TWITCH CACHE] Live=${twitchCache.live}`
        );

    } catch (err) {

        console.error(
            "[TWITCH CACHE]",
            err.response?.data || err.message
        );

    }
}
app.post("/api/auth/twitch", async (req, res) => {
    try {

        const { code } = req.body;

        const tokenResponse = await axios.post(
            "https://id.twitch.tv/oauth2/token",
            null,
            {
                params: {
                    client_id: process.env.TWITCH_CLIENT_ID,
                    client_secret: process.env.TWITCH_CLIENT_SECRET,
                    code,
                    grant_type: "authorization_code",
                    redirect_uri: "https://chromatyk.fr/log"
                }
            }
        );

        const accessToken =
            tokenResponse.data.access_token;

        const userResponse = await axios.get(
            "https://api.twitch.tv/helix/users",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Client-Id": process.env.TWITCH_CLIENT_ID
                }
            }
        );

        const user =
            userResponse.data.data[0];
        const profile =
            await query(                `
                SELECT theme
                FROM zxd_profil
                WHERE user = ?
                `,
                [user.id]
            );
        req.session.user = {
            id: user.id,
            login: user.login,
            display_name: user.display_name,
            theme:
                profile[0]?.theme ||
                "defaut"
        };

        console.log(
            "SESSION CREATED",
            req.sessionID,
            req.session.user
        );

        req.session.save((err) => {

            if (err) {

                console.error(
                    "SESSION SAVE ERROR",
                    err
                );

                return res
                    .status(500)
                    .json({
                        success: false
                    });

            }

            res.json({
                success: true,
                user: {
                    id: user.id,
                    login: user.login,
                    display_name: user.display_name,
                    profile_image_url:
                        user.profile_image_url
                }
            });

        });

    } catch (err) {

        console.error(err.response?.data || err);

        res.status(500).json({
            success: false
        });
    }
});
app.get("/api/twitch/live", (req, res) => {
    res.json(twitchCache);
});
app.get("/api/me", (req, res) => {

    console.log(
        "SESSION ID ME",
        req.sessionID
    );

    console.log(
        "SESSION ME",
        req.session
    );

    if (!req.session?.user) {

        return res
            .status(401)
            .json({
                authenticated: false
            });

    }

    res.json({
        authenticated: true,
        user: req.session.user
    });

});
function authMiddleware(req, res, next) {
    if (!req.session?.user) {
        return res.status(401).json({
            error: "Not authenticated"
        });
    }
    req.user = req.session.user;
    next();
}

/* Création de compte */
app.post(
    "/api/createAccount",
    authMiddleware,
    async (req, res) => {
        const user =
            req.user;
        try {
            await query("START TRANSACTION");
            await query(`
                INSERT INTO zxd_profil
                (
                    user,
                    login,
                    level,
                    xp,
                    skin,
                    compagnon
                )
                VALUES
                (?, ?, 1, 0, 9999, 0)
                `,
                [
                    user.id,
                    user.login
                ]
            );
            await query(
                `
                INSERT INTO zxd_inventaire
                (user, item, quantity, slug)
                VALUES
                (?, ?, ?, ?),
                (?, ?, ?, ?),
                (?, ?, ?, ?),
                (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                quantity = quantity + VALUES(quantity)
                `,
                [
                    user.id,
                    "Miel Ordinaire",
                    1,
                    "honey",

                    user.id,
                    "Bonbon S",
                    10,
                    "exps",

                    user.id,
                    "Poke Ball",
                    10,
                    "ball",

                    user.id,
                    "Super Bonbon",
                    0,
                    "rarecandy"
                ]
            );
            await query("COMMIT");
            res.send({
                success: true
            });
        } catch (err) {
            await query("ROLLBACK");
            console.error(err);
            res.status(500).send(err);
        }
    }
);
app.get('/api/getShinydex', (req, res) => {
    db.query("SELECT id,pokemon, surnom, date, version, gen, description, lien,idPkm FROM zxd_shinydex ORDER BY idPkm ASC ", (err, result) => {
        if (err) {
            console.log(err)
        }
        res.send(result)
    });
});

/* Profil */
app.get(
    "/api/profile/:id",
    async (req, res) => {
        try {
            const user =
                req.params.id;
            const {
                getLevelFromXp
            } = require(
                "./utils/levels"
            );
            const profile =
                await query(
                    `
                    SELECT
                        p.user,
                        p.login,
                        p.level,
                        p.xp,
                        p.skin,
                        p.compagnon,
                        p.title,
                        t.name AS title_name,
                        t.rarity AS title_rarity,
                        c.pokemon,
                        c.shiny,
                        c.negative
                    FROM zxd_profil p
                    LEFT JOIN zxd_capture c
                        ON c.user = p.user
                    LEFT JOIN zxd_titles t
                        ON t.code = p.title
                    WHERE p.user = ?
                    `,
                    [user]
                );
            const skins =
                await query(
                    `
                    SELECT
                        user,
                        skin
                    FROM zxd_skin
                    WHERE user = ?
                    `,
                    [user]
                );
            const activeCompanion =
                await query(
                    `
                    SELECT
                        user,
                        number,
                        pokemon,
                        level,
                        shiny,
                        negative
                    FROM zxd_compagnon
                    WHERE user = ?
                    AND number = (
                        SELECT compagnon
                        FROM zxd_profil
                        WHERE user = ?
                    )
                    `,
                    [
                        user,
                        user
                    ]
                );
            const maxLevelCompanions =
                await query(
                    `
                    SELECT
                        tier,
                        user,
                        number,
                        pokemon,
                        level,
                        shiny,
                        negative
                    FROM zxd_compagnon
                    WHERE user = ?
                    AND level = 100
                    `,
                    [user]
                );
            const expeditions =
                await query(
                    `
                    SELECT
                        e.active,
                        e.id,
                        e.date,
                        e.endDate,
                        c.tier,
                        c.number,
                        c.pokemon,
                        c.shiny,
                        c.negative
                    FROM zxd_expedition e
                    INNER JOIN zxd_compagnon c
                        ON c.number = e.number
                    WHERE e.user = ?
                    `,
                    [user]
                );
            const progress =
                await query(
                    `
                    SELECT
                        (
                            SELECT COUNT(
                                DISTINCT card_tcgdex_id
                            )
                            FROM zxd_card_collection
                            WHERE profil_id = ?
                        ) AS owned,
                        (
                            SELECT SUM(card_count)
                            FROM zxd_card_set
                            WHERE active = 1
                        ) AS total
                    `,
                    [user]
                );
            const pokedexStats = await query(
                `
                SELECT
                    COUNT(
                        DISTINCT CASE
                            WHEN shiny = 0
                            AND negative = 0
                            THEN pokemon
                        END
                    ) AS pokedexNormal,

                    COUNT(
                        DISTINCT CASE
                            WHEN shiny = 1
                            THEN pokemon
                        END
                    ) AS pokedexShiny,

                    COUNT(
                        DISTINCT CASE
                            WHEN negative = 1
                            THEN pokemon
                        END
                    ) AS pokedexShadow

                FROM zxd_capture
                WHERE user = ?
                `,
                [user]
            );
            const titles = await query(
                `
                    SELECT DISTINCT
                        t.code,
                        t.name,
                        t.rarity
                    FROM zxd_titles t
                    INNER JOIN zxd_user_titles u
                        ON u.title_code = t.code
                    WHERE u.user = ?
                    ORDER BY
                        t.display_order ASC
                    `,
                [user]
            );
            const owned =
                progress[0]?.owned || 0;
            const total =
                progress[0]?.total || 0;
            const profileData =
                profile[0] || null;
            if (profileData) {
                profileData.level =
                    getLevelFromXp(
                        profileData.xp
                    );
            }
            const {
                pokedexNormal,
                pokedexShiny,
                pokedexShadow
            } = pokedexStats[0];
            res.send({
                profile:
                    profileData,
                skins,
                activeCompanion:
                    activeCompanion[0] || null,
                maxLevelCompanions,
                expeditions,
                pokedexNormal,
                pokedexShiny,
    titles,
                pokedexShadow,
                globalProgress: {
                    owned,
                    total,
                    percent:
                        total > 0
                            ? Number(
                                (
                                    owned /
                                    total *
                                    100
                                ).toFixed(1)
                            )
                            : 0
                }
            });
        } catch (err) {
            console.error(err);
            res.status(500).send({
                error:
                    "Erreur lors du chargement du profil"
            });
        }
    }
);
/* Change Skin */
app.post(
    "/api/changeSkin",
    authMiddleware,
    async (req, res) => {
        const user =req.user.id;
        const skin = req.body.skin;
        const owned =
            await query(
                `
                SELECT 1
                FROM zxd_skin
                WHERE user = ?
                AND skin = ?
                `,
                [
                    user,
                    skin
                ]
            );
        if (
            owned.length === 0
        ) {
            return res
                .status(403)
                .send({
                    error:
                        "Skin non possédé"
                });
        }
        await query(
            `
            UPDATE zxd_profil
            SET skin = ?
            WHERE user = ?
            `,
            [
                skin,
                user
            ]
        );
        res.send({
            success: true
        });

    }
);
app.post(
    "/api/changeTitle",
    authMiddleware,
    async (req, res) => {
        const user = req.user.id;
        const code = req.body.code;
        const owned =
            await query(
                `
                SELECT 1
                FROM zxd_user_titles
                WHERE user = ?
                AND title_code = ?
                `,
                [
                    user,
                    code
                ]
            );
        if (
            owned.length === 0
        ) {
            return res
                .status(403)
                .send({
                    error:
                        "Skin non possédé"
                });
        }
        await query(
            `
            UPDATE zxd_profil
            SET title = ?
            WHERE user = ?
            `,
            [
                code,
                user
            ]
        );
        res.send({
            success: true
        });

    }
);
/* Add Skin */
app.post(
    "/api/addSkin",
    authMiddleware,
    async (req, res) => {
        try {
            const user =
                req.user.id;
            const {
                getLevelFromXp
            } = require(
                "./utils/levels"
            );
            const profile =
                await query(
                    `
                    SELECT xp
                    FROM zxd_profil
                    WHERE user = ?
                    `,
                    [user]
                );
            const skins =
                await query(
                    `
                    SELECT COUNT(*)
                    AS total
                    FROM zxd_skin
                    WHERE user = ?
                    `,
                    [user]
                );
            const level =
                getLevelFromXp(
                    profile[0].xp
                );
            if (
                skins[0].total >= level
            ) {
                return res
                    .status(400)
                    .send({
                        error:
                            "Limite atteinte"
                    });
            }
            const skin =
                Math.floor(
                    Math.random() * 1398
                ) + 1;
            await query(
                `
                INSERT INTO zxd_skin
                (
                    user,
                    skin
                )
                VALUES
                (?, ?)
                `,
                [
                    user,
                    skin
                ]
            );
            res.send({
                success: true,
                skin
            });
        } catch (err) {
            console.error(err);
            res.status(500).send(err);
        }
    }
);
/* Change Companion */
app.post(
    "/api/changeCompagnon",
    authMiddleware,
    async (req, res) => {
        try {
            const user =
                req.user.id;
            const compagnon =
                req.body.compagnon;
            const owned =
                await query(
                    `
                    SELECT 1
                    FROM zxd_compagnon
                    WHERE user = ?
                    AND number = ?
                    `,
                    [
                        user,
                        compagnon
                    ]
                );
            if (
                owned.length === 0
            ) {
                return res
                    .status(403)
                    .send({
                        error:
                            "Compagnon non possédé"
                    });

            }
            await query(
                `
                UPDATE zxd_profil
                SET compagnon = ?
                WHERE user = ?
                `,
                [
                    compagnon,
                    user
                ]
            );
            res.send({
                success: true
            });
        } catch (err) {
            console.error(err);
            res.status(500).send({
                error:
                    "Erreur lors du changement de compagnon"
            });
        }
    }
);
/* New Expedition */
app.post(
    "/api/newExpedition",
    authMiddleware,
    async (req, res) => {
        try {
            const user =
                req.user.id;
            const number =
                req.body.number;
            const companion =
                await query(                    `
                    SELECT
                        number,
                        tier,
                        shiny,
                        negative
                    FROM zxd_compagnon
                    WHERE user = ?
                    AND number = ?
                    `,
                    [
                        user,
                        number
                    ]
                );
            if (
                companion.length === 0
            ) {
                return res
                    .status(404)
                    .send({
                        error:
                            "Compagnon introuvable"
                    });
            }
            const alreadyUsed =
                await query(
                    `
                    SELECT 1
                    FROM zxd_expedition
                    WHERE number = ?
                    LIMIT 1
                    `,
                    [number]
                );
            if (
                alreadyUsed.length > 0
            ) {
                return res
                    .status(400)
                    .send({
                        error:
                            "Ce compagnon a déjà effectué une expédition"
                    });
            }
            const {
                tier,
                shiny,
                negative
            } = companion[0];
            const hours =
                negative === 1
                    ? 3 + tier
                    : shiny === 1
                        ? 2 + tier
                        : 1 + tier;
            const startDate =
                new Date();
            const endDate =
                new Date(
                    Date.now() +
                    hours *
                    60 *
                    60 *
                    1000
                );
            await query(
                `
                INSERT INTO zxd_expedition
                (
                    user,
                    number,
                    tier,
                    active,
                    date,
                    endDate,
                    negative,
                    shiny
                )
                VALUES
                (?, ?, ?, 1, ?, ?, ?, ?)
                `,
                [
                    user,
                    number,
                    tier,
                    startDate,
                    endDate,
                    negative,
                    shiny
                ]
            );
            res.send({
                success: true,
                endDate
            });
        } catch (err) {
            console.error(err);
            res.status(500).send({
                error:
                    "Erreur création expédition"
            });
        }
    }
);
/* Recover Expedition */
app.post(
    "/api/recoverExpeditionReward/:number",
    authMiddleware,
    async (req, res) => {
        try {
            const user =
                req.user.id;
            const number =
                req.params.number;
            const expedition =
                await query(
                    `
                    SELECT
                        number,
                        tier,
                        active,
                        endDate,
                        date,
                        negative,
                        shiny
                    FROM zxd_expedition
                    WHERE user = ?
                    AND number = ?
                    `,
                    [
                        user,
                        number
                    ]
                );
            if (
                expedition.length === 0
            ) {
                return res
                    .status(404)
                    .send({
                        error:
                            "Expédition introuvable"
                    });
            }
            const current =
                expedition[0];
            if (
                current.active !== 1
            ) {
                return res
                    .status(400)
                    .send({
                        error:
                            "Récompense déjà récupérée"
                    });
            }
            if (
                new Date() <
                new Date(
                    current.endDate
                )
            ) {
                return res
                    .status(400)
                    .send({
                        error:
                            "Expédition non terminée"
                    });
            }
            const rewards = {
                normal: {
                    1: [1, 3],
                    2: [2, 4],
                    3: [4, 6],
                    4: [6, 8]
                },

                shiny: {
                    1: [2, 4],
                    2: [4, 6],
                    3: [7, 10],
                    4: [11, 14]
                },

                negative: {
                    1: [3, 5],
                    2: [6, 8],
                    3: [11, 14],
                    4: [27, 31]
                }

            };
            const form =
                current.negative === 1
                    ? "negative"
                    : current.shiny === 1
                        ? "shiny"
                        : "normal";
            const [min, max] =
                rewards[form][
                current.tier
                ];
            const amount =
                Math.floor(
                    Math.random() *
                    (
                        max -
                        min +
                        1
                    )
                ) + min;
            await incrementStat(
                user,
                "expedition_total"
            );
            await incrementStat(
                user,
                "expedition_"+form
            );
            await incrementStat(
                user,
                "expedition_" + current.tier
            );
            await checkAchievements(
                user
            );
            await query(
                `
                INSERT INTO zxd_inventaire
                (
                    user,
                    item,
                    quantity,
                    slug
                )
                VALUES
                (
                    ?,
                    'Fragment de Pack',
                    ?,
                    'fragement'
                )
                ON DUPLICATE KEY UPDATE
                    quantity =
                    quantity +
                    VALUES(quantity)
                `,
                [
                    user,
                    amount
                ]
            );
            await query(
                `
                UPDATE zxd_expedition
                SET active = 0
                WHERE number = ?
                `,
                [number]
            );
            res.send({
                success: true,
                reward:
                    amount
            });
        } catch (err) {
            console.error(err);
            res.status(500).send(err);
        }
    }
);

/* Inventaire */
app.get(
    "/api/inventory",
    authMiddleware,
    async (req, res) => {

        const inventory =
            await query(
                `
                SELECT
                    item,
                    slug,
                    quantity
                FROM zxd_inventaire
                WHERE user = ?
                `,
                [req.user.id]
            );

        res.send(inventory);

    }
);
app.post(
    "/api/createLootbox",
    authMiddleware,
    async (req, res) => {
        const user =
            req.user.id;
        const fragments =
            await query(
                `
                SELECT quantity
                FROM zxd_inventaire
                WHERE user = ?
                AND slug = 'fragement'
                `,
                [user]
            );
        if (
            !fragments.length ||
            fragments[0].quantity < 100
        ) {
            return res
                .status(400)
                .send({
                    error:
                        "Fragments insuffisants"
                });
        }
        await incrementStat(
            user,
            "created_box"
        );
        await checkAchievements(
            user
        );
        await query(
            `
            UPDATE zxd_inventaire
            SET quantity =
                quantity - 100
            WHERE user = ?
            AND slug = 'fragement'
            `,
            [user]
        );
        await query(
            `
            INSERT INTO zxd_inventaire
            (
                user,
                item,
                quantity,
                slug
            )
            VALUES
            (
                ?,
                'Pack Safari',
                1,
                'box'
            )
            ON DUPLICATE KEY UPDATE
                quantity =
                quantity + 1
            `,
            [user]
        );
        res.send({
            success: true
        });
    }
);
app.post(
    "/api/openLootbox",
    authMiddleware,
    async (req, res) => {
        try {
            const user =
                req.user.id;
            const box =
                await query(
                    `
                    SELECT quantity
                    FROM zxd_inventaire
                    WHERE user = ?
                    AND slug = 'box'
                    `,
                    [user]
                );
            if (
                !box.length ||
                box[0].quantity < 1
            ) {
                return res
                    .status(400)
                    .send({
                        error:
                            "Aucun Pack Safari"
                    });
            }
            await query(
                `
                UPDATE zxd_inventaire
                SET quantity =
                    quantity - 1
                WHERE user = ?
                AND slug = 'box'
                `,
                [user]
            );
            const rewards = [];
            // BONBONS XP
            const candyTier =
                Math.random();
            let item;
            let slug;
            let quantity;
            if (candyTier < 0.10) {
                item = "Bonbon L";
                slug = "expl";
                quantity =
                    Math.floor(
                        Math.random() * 5
                    ) + 1;
            } else if (
                candyTier < 0.40
            ) {
                item = "Bonbon M";
                slug = "expm";
                quantity =
                    Math.floor(
                        Math.random() * 10
                    ) + 1;
            } else {
                item = "Bonbon S";
                slug = "exps";
                quantity =
                    Math.floor(
                        Math.random() * 10
                    ) + 5;
            }
            await addItem(
                user,
                item,
                slug,
                quantity
            );
            rewards.push({
                item,
                quantity
            });
            // BALLS
            const ballTier =
                Math.random();
            if (ballTier < 0.001) {
                item =
                    "Master Ball";
                slug =
                    "master";
                quantity = 1;
            } else if (
                ballTier < 0.101909
            ) {
                item =
                    "Hyper Ball";
                slug =
                    "ultra";
                quantity =
                    Math.floor(
                        Math.random() * 5
                    ) + 1;
            } else if (
                ballTier < 0.404636
            ) {
                item =
                    "Super Ball";
                slug =
                    "great";
                quantity =
                    Math.floor(
                        Math.random() * 5
                    ) + 1;
            } else {
                item =
                    "Poke Ball";
                slug =
                    "ball";
                quantity =
                    Math.floor(
                        Math.random() * 5
                    ) + 1;
            }
            await addItem(
                user,
                item,
                slug,
                quantity
            );
            rewards.push({
                item,
                quantity
            });
            // MIEL
            const honeyTier =
                Math.random();
            if (
                honeyTier <
                1 / 6000
            ) {
                item =
                    "Miel Obscure";
                slug =
                    "negative";
            } else if (
                honeyTier <
                (1 / 6000) +
                (1 / 3000)
            ) {
                item =
                    "Miel Chromatique";
                slug =
                    "shiny";
            } else if (
                honeyTier <
                (1 / 6000) +
                (1 / 3000) +
                0.0001
            ) {
                item =
                    "Miel Légendaire";
                slug =
                    "legendary";
            } else {
                item =
                    "Miel Ordinaire";
                slug =
                    "honey";
            }
            await addItem(
                user,
                item,
                slug,
                1
            );
            rewards.push({
                item,
                quantity: 1
            });
            // SUPER BONBON
            quantity =
                Math.floor(
                    Math.random() * 3
                ) + 1;
            await addItem(
                user,
                "Super Bonbon",
                "rarecandy",
                quantity
            );
            rewards.push({
                item:
                    "Super Bonbon",
                quantity
            });
            // BOOSTER
            if (
                Math.random() < 0.01
            ) {
                await addItem(
                    user,
                    "Booster",
                    "booster",
                    1
                );
                rewards.push({
                    item:
                        "Booster",
                    quantity: 1
                });
            }
            // MEGA BONBON
            if (
                Math.random() <
                0.001
            ) {
                await addItem(
                    user,
                    "Mega Bonbon",
                    "megacandy",
                    1
                );
                rewards.push({
                    item:
                        "Mega Bonbon",
                    quantity: 1
                });
            }
            await incrementStat(
                user,
                "opened_box"
            );
            await checkAchievements(
                user
            );
            res.send({
                success: true,
                rewards
            });
        } catch (err) {
            console.error(err);
            res.status(500).send({
                error:
                    "Erreur ouverture pack"
            });
        }
    }
);
async function addItem(
    user,
    item,
    slug,
    quantity
) {
    await query(
        `
        INSERT INTO zxd_inventaire
        (
            user,
            item,
            slug,
            quantity
        )
        VALUES
        (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            quantity =
                quantity + VALUES(quantity)
        `,
        [
            user,
            item,
            slug,
            quantity
        ]
    );

}
/* Pokedex */
app.get(
    "/api/pokedex/:id",
    async (req, res) => {
        try {
            const user =
                req.params.id;
            const pokedex =
                await query(
                    `
                    SELECT
                        id,
                        pokemon,
                        gen,
                        shiny,
                        negative
                    FROM zxd_capture
                    WHERE user = ?
                    `,
                    [user]
                );
            const level100 =
                await query(
                    `
                    SELECT
                        number,
                        pokemon,
                        shiny,
                        negative
                    FROM zxd_compagnon
                    WHERE user = ?
                    AND level = 100
                    `,
                    [user]
                );
            const level100Keys =
                new Set(
                    level100.map(
                        pokemon =>
                            `${pokemon.number}-${pokemon.shiny}-${pokemon.negative}`
                    )
                );
            res.send({
                pokedex,
                level100Keys: [
                    ...level100Keys
                ]
            });
        } catch (err) {
            console.error(err);
            res.status(500).send({
                error:
                    "Erreur chargement pokédex"
            });
        }
    }
);

/* Safari */
app.get(
    "/api/safari",
    authMiddleware,
    async (req, res) => {
        try {
            const user =
                req.user.id;
            const profile =
                await query(
                    `
                    SELECT
                        user,
                        login,
                        xp,
                        skin,
                        compagnon
                    FROM zxd_profil
                    WHERE user = ?
                    `,
                    [user]
                );
            const pokedex =
                await query(
                    `
                    SELECT
                        pokemon,
                        shiny,
                        negative
                    FROM zxd_capture
                    WHERE user = ?
                    `,
                    [user]
                );
            const inventory =
                await query(
                    `
                    SELECT
                        item,
                        slug,
                        quantity
                    FROM zxd_inventaire
                    WHERE user = ?
                    `,
                    [user]
                );
            const safari =
                await query(
                    `
                    SELECT
                        s.pokemon,
                        s.love,
                        s.shiny,
                        s.negative,
                        s.tier,
                        p.name,
                        p.gen
                    FROM zxd_safari s
                    INNER JOIN zxd_pokemon p
                        ON p.number = s.pokemon
                    WHERE s.user = ?
                    `,
                    [user]
                );
            res.send({
                profile:
                    profile[0] || null,
                pokedex,
                inventory,
                safari:
                    safari[0] || null
            });
        } catch (err) {
            console.error(err);
            res.status(500).send({
                error:
                    "Erreur chargement safari"
            });
        }
    }
);
app.post(
    "/api/safari/useHoney",
    authMiddleware,
    async (req, res) => {
        try {
            const user =
                req.user.id;
            const honey =
                req.body.honey;
            const inventory =
                await query(                    `
                    SELECT quantity
                    FROM zxd_inventaire
                    WHERE user = ?
                    AND slug = ?
                    `,
                    [
                        user,
                        honey
                    ]
                );
            if (
                inventory.length === 0 ||
                inventory[0].quantity < 1
            ) {
                return res
                    .status(400)
                    .send({
                        error:
                            "Miel indisponible"
                    });
            }
            await incrementStat(
                user,
                "honey_total"
            );
            await incrementStat(
                user,
                "honey_"+honey
            );
            await checkAchievements(
                user
            );
            await query(
                `
                UPDATE zxd_inventaire
                SET quantity =
                    quantity - 1
                WHERE user = ?
                AND slug = ?
                `,
                [
                    user,
                    honey
                ]
            );
            let tier;
            let shiny = 0;
            let negative = 0;
            let maxLove;
            if (
                honey === "legendary"
            ) {
                tier = 4;
            } else {
                const tierRoll =
                    Math.random();
                if (
                    tierRoll < 0.01
                ) {
                    tier = 4;
                } else if (
                    tierRoll < 0.11
                ) {
                    tier = 3;
                } else if (
                    tierRoll < 0.41
                ) {
                    tier = 2;
                } else {
                    tier = 1;
                }
            }
            if (
                honey === "shiny"
            ) {
                shiny = 1;
            } else if (
                honey === "negative"
            ) {
                negative = 1;
            } else {
                const shinyRoll =
                    Math.floor(
                        Math.random() * 4096
                    ) + 1;
                const negativeRoll =
                    Math.floor(
                        Math.random() * 8192
                    ) + 1;
                if (
                    negativeRoll === 16
                ) {
                    negative = 1;

                    await incrementStat(
                        user,
                        "safari_negative"
                    );
                    await checkAchievements(
                        user
                    );
                } else if (
                    shinyRoll === 16
                ) {
                    shiny = 1;
                    await incrementStat(
                        user,
                        "safari_shiny"
                    );
                    await checkAchievements(
                        user
                    );
                }
            }
            await incrementStat(
                user,
                "safari_"+tier
            );
            await checkAchievements(
                user
            );
            const pokemon =
                (
                    await query(
                        `
                        SELECT *
                        FROM zxd_pokemon
                        WHERE tier = ?
                        ORDER BY RAND()
                        LIMIT 1
                        `,
                        [tier]
                    )
                )[0];
            switch (
            tier
            ) {
                case 1:
                    maxLove = 125;
                    break;
                case 2:
                    maxLove = (
                        negative
                            ? 375
                            : 250
                    );
                    break;
                case 3:
                    maxLove = (
                        negative
                            ? 650
                            : 500
                    );
                    break;
                default:
                    maxLove = 1000;
            }
            await query(
                `
                REPLACE INTO
                zxd_safari
                (
                    user,
                    pokemon,
                    love,
                    shiny,
                    negative,
                    tier
                )
                VALUES
                (
                    ?, ?, 0, ?, ?, ?
                )
                `,
                [
                    user,
                    pokemon.number,
                    shiny,
                    negative,
                    tier
                ]
            );
            res.send({
                pokemon,
                shiny,
                negative,
                tier,
                maxLove
            });
        } catch (err) {
            console.error(err);
            res.status(500).send({
                error:
                    "Erreur safari"
            });
        }
    }
);
app.post(
    "/api/safari/addLove",
    authMiddleware,
    async (req, res) => {
        try {
            const user =
                req.user.id;
            const candy =
                req.body.candy;
            const values = {
                exps: 25,
                expm: 50,
                expl: 200
            };
            const loveGain =
                values[candy];
            if (!loveGain) {
                return res
                    .status(400)
                    .send({
                        error:
                            "Bonbon invalide"
                    });
            }
            await incrementStat(
                user,
                "candy_total"
            );
            await incrementStat(
                user,
                "candy_" + candy
            );
            await checkAchievements(
                user
            );
            const item =
                await query(
                    `
                    SELECT quantity
                    FROM zxd_inventaire
                    WHERE user = ?
                    AND slug = ?
                    `,
                    [
                        user,
                        candy
                    ]
                );
            if (
                item.length === 0 ||
                item[0].quantity < 1
            ) {
                return res
                    .status(400)
                    .send({
                        error:
                            "Bonbon indisponible"
                    });
            }
            await query(
                `
                UPDATE zxd_inventaire
                SET quantity =
                    quantity - 1
                WHERE user = ?
                AND slug = ?
                `,
                [
                    user,
                    candy
                ]
            );
            await query(
                `
                UPDATE zxd_safari
                SET love =
                    love + ?
                WHERE user = ?
                `,
                [
                    loveGain,
                    user
                ]
            );
            const safari =
                (
                    await query(
                        `
                        SELECT love
                        FROM zxd_safari
                        WHERE user = ?
                        `,
                        [user]
                    )
                )[0];
            res.send({
                success: true,
                love:
                    safari.love
            });
        } catch (err) {
            console.error(err);
            res.status(500).send({
                error:
                    "Erreur ajout affection"
            });
        }
    }
);
app.post(
    "/api/safari/catch",
    authMiddleware,
    async (req, res) => {
        try {
            const user =
                req.user.id;
            const ball =
                req.body.ball;
            const safari =
                (
                    await query(                        `
                        SELECT
                            s.*,
                            p.gen,
                            p.name
                        FROM zxd_safari s
                        INNER JOIN zxd_pokemon p
                            ON p.number = s.pokemon
                        WHERE s.user = ?
                        `,
                        [user]
                    )
                )[0];
            if (!safari) {
                return res
                    .status(400)
                    .send({
                        error:
                            "Aucun safari actif"
                    });
            }
            const catchRates = {
                1: {
                    ball: 0.50,
                    great: 0.75,
                    ultra: 0.95
                },
                2: {
                    ball: 0.30,
                    great: 0.65,
                    ultra: 0.85
                },
                3: {
                    ball: 0.20,
                    great: 0.50,
                    ultra: 0.75
                },
                4: {
                    ball: 0.10,
                    great: 0.35,
                    ultra: 0.60
                }
            };
            const inventory =
                await query(
                    `
                    SELECT quantity
                    FROM zxd_inventaire
                    WHERE user = ?
                    AND slug = ?
                    `,
                    [
                        user,
                        ball
                    ]
                );
            if (
                inventory.length === 0 ||
                inventory[0].quantity < 1
            ) {
                return res
                    .status(400)
                    .send({
                        error:
                            "Ball indisponible"
                    });
            }
            await incrementStat(
                user,
                "ball_total"
            );
            await incrementStat(
                user,
                "ball_"+ball
            );
            await checkAchievements(
                user
            );
            await query(
                `
                UPDATE zxd_inventaire
                SET quantity =
                    quantity - 1
                WHERE user = ?
                AND slug = ?
                `,
                [
                    user,
                    ball
                ]
            );
            const success =
                ball === "master"
                    ? true
                    : Math.random() <
                    catchRates[
                    safari.tier
                    ][ball];
            if (success) {
                await query(
                    `
                    INSERT INTO
                    zxd_capture
                    (
                        user,
                        pokemon,
                        gen,
                        shiny,
                        negative,
                        date
                    )
                    VALUES
                    (?, ?, ?, ?, ?, NOW())
                    `,
                    [
                        user,
                        safari.pokemon,
                        safari.gen,
                        safari.shiny,
                        safari.negative
                    ]
                );
                let bonusXP =
                    0;
                if (
                    safari.shiny === 1
                ) {
                    bonusXP = 100;

                } else if (
                    safari.negative === 1
                ) {
                    bonusXP = 500;
                }
                const xp =
                    Math.floor(
                        Math.random() *
                        (
                            safari.tier *
                            50 +
                            1
                        )
                    ) +
                    (
                        safari.tier *
                        100
                    ) +
                    bonusXP;
                await query(
                    `
                    UPDATE zxd_profil
                    SET xp =
                        xp + ?
                    WHERE user = ?
                    `,
                    [
                        xp,
                        user
                    ]
                );
                await query(
                    `
                    DELETE FROM
                    zxd_safari
                    WHERE user = ?
                    `,
                    [user]
                );
                return res.send({
                    success: true,
                    xp
                });
            }
            const flee =
                Math.random() <
                0.10;
            if (flee) {
                await incrementStat(
                    user,
                    "flee_total"
                );
                await checkAchievements(
                    user
                );
                await query(
                    `
                    DELETE FROM
                    zxd_safari
                    WHERE user = ?
                    `,
                    [user]
                );
            }
            res.send({
                success: false,
                flee
            });
        } catch (err) {
            console.error(err);
            res.status(500).send({
                error:
                    "Erreur capture"
            });
        }
    }
);
app.delete(
    "/api/safari/flee",
    authMiddleware,
    async (req, res) => {
        try {
            await query(
                `
                DELETE FROM
                zxd_safari
                WHERE user = ?
                `,
                [req.user.id]
            );
            res.send({
                success: true
            });
        } catch (err) {
            console.error(err);
            res.status(500).send({
                error:
                    "Erreur fuite"
            });
        }
    }
);

/* Compagnon */
app.get(
    "/api/compagnon",
    authMiddleware,
    async (req, res) => {
        try {
            const user =
                req.user.id;
            const pokedex =
                await query(
                    `
                    SELECT *
                    FROM zxd_capture
                    WHERE user = ?
                    `,
                    [user]
                );
            const activeCompanion =
                await query(
                    `
                    SELECT *
                    FROM zxd_compagnon
                    WHERE user = ?
                    AND active = 1
                    `,
                    [user]
                );
            const allCompanions =
                await query(
                    `
                    SELECT *
                    FROM zxd_compagnon
                    WHERE user = ?
                    `,
                    [user]
                );
            const inventory =
                await query(
                    `
                    SELECT *
                    FROM zxd_inventaire
                    WHERE user = ?
                    `,
                    [user]
                );
            res.send({
                pokedex,
                activeCompanion,
                allCompanions,
                inventory
            });
        } catch (err) {
            console.error(err);
            res.status(500).send({
                error:
                    "Erreur chargement compagnon"
            });
        }
    }
);
app.post(
    "/api/compagnon/change",
    authMiddleware,
    async (req, res) => {
        try {
            const user =
                req.user.id;
            const {
                pokemon,
                shiny,
                negative
            } = req.body;
            await query(
                `
                UPDATE zxd_compagnon
                SET active = 0
                WHERE user = ?
                `,
                [user]
            );
            let companion =
                (
                    await query(
                        `
                        SELECT *
                        FROM zxd_compagnon
                        WHERE user = ?
                        AND number = ?
                        AND shiny = ?
                        AND negative = ?
                        `,
                        [
                            user,
                            pokemon,
                            shiny,
                            negative
                        ]
                    )
                )[0];
            if (!companion) {
                const poke =
                    (
                        await query(
                            `
                            SELECT
                                name,
                                tier
                            FROM zxd_pokemon
                            WHERE number = ?
                            `,
                            [pokemon]
                        )
                    )[0];
                await query(
                    `
                    INSERT INTO
                    zxd_compagnon
                    (
                        user,
                        number,
                        pokemon,
                        shiny,
                        negative,
                        level,
                        xp,
                        active,
                        tier
                    )
                    VALUES
                    (
                        ?, ?, ?, ?, ?, 1, 0, 1, ?
                    )
                    `,
                    [
                        user,
                        pokemon,
                        poke.name,
                        shiny,
                        negative,
                        poke.tier
                    ]
                );
            } else {
                await query(
                    `
                    UPDATE zxd_compagnon
                    SET active = 1
                    WHERE id = ?
                    `,
                    [companion.id]
                );
            }
            const active =
                (
                    await query(
                        `
                        SELECT *
                        FROM zxd_compagnon
                        WHERE user = ?
                        AND active = 1
                        `,
                        [user]
                    )
                )[0];
            res.send(
                active
            );
        } catch (err) {
            console.error(
                err
            );
            res.status(500).send({
                error:
                    "Erreur changement compagnon"
            });
        }
    }
);
app.post(
    "/api/compagnon/useCandy",
    authMiddleware,
    async (req, res) => {
        try {
            const user =
                req.user.id;
            const {
                candy
            } = req.body;
            const item =
                (
                    await query(
                        `
                        SELECT quantity
                        FROM zxd_inventaire
                        WHERE user = ?
                        AND slug = ?
                        `,
                        [
                            user,
                            candy
                        ]
                    )
                )[0];
            if (
                !item ||
                item.quantity < 1
            ) {
                return res
                    .status(400)
                    .send({
                        error:
                            "Objet indisponible"
                    });
            }
            await incrementStat(
                user,
                "candy_"+candy
            );
            await checkAchievements(
                user
            );
            await query(
                `
                UPDATE zxd_inventaire
                SET quantity =
                    quantity - 1
                WHERE user = ?
                AND slug = ?
                `,
                [
                    user,
                    candy
                ]
            );
            if (
                candy ===
                "rarecandy"
            ) {
                await query(
                    `
                    UPDATE zxd_compagnon
                    SET level =
                        LEAST(level + 1, 100)
                    WHERE user = ?
                    AND active = 1
                    `,
                    [user]
                );
            } else if (
                candy ===
                "megacandy"
            ) {
                await query(
                    `
                    UPDATE zxd_compagnon
                    SET level = 100
                    WHERE user = ?
                    AND active = 1
                    `,
                    [user]
                );
            } else {
                return res
                    .status(400)
                    .send({
                        error:
                            "Bonbon invalide"
                    });
            }
            const companion =
                (
                    await query(
                        `
                        SELECT *
                        FROM zxd_compagnon
                        WHERE user = ?
                        AND active = 1
                        `,
                        [user]
                    )
                )[0];
            res.send({
                success: true,
                companion
            });
        } catch (err) {
            console.error(err);
            res.status(500).send({
                error:
                    "Erreur compagnon"
            });
        }
    }
);

/* Combat */
app.post(
    "/api/fight/start",
    authMiddleware,
    async (req, res) => {
        try {
            const tierRoll =
                Math.random();
            let tier;
            let maxHp;
            if (
                tierRoll < 0.01
            ) {
                tier = 4;
                maxHp = 12000;
            } else if (
                tierRoll < 0.11
            ) {
                tier = 3;
                maxHp = 6000;
            } else if (
                tierRoll < 0.41
            ) {
                tier = 2;
                maxHp = 3000;
            } else {
                tier = 1;
                maxHp = 1500;
            }
            const pokemon =
                (
                    await query(
                        `
                        SELECT *
                        FROM zxd_pokemon
                        WHERE tier = ?
                        ORDER BY RAND()
                        LIMIT 1
                        `,
                        [tier]
                    )
                )[0];
            const shinyRoll =
                Math.floor(
                    Math.random() * 4096
                ) + 1;
            const negativeRoll =
                Math.floor(
                    Math.random() * 8192
                ) + 1;
            let shiny = 0;
            let negative = 0;
            if (
                negativeRoll === 16
            ) {
                negative = 1;
            } else if (
                shinyRoll === 16
            ) {
                shiny = 1;
            }
            res.send({
                pokemon,
                shiny,
                negative,
                currentHp:
                    maxHp,
                maxHp
            });
        } catch (err) {
            console.error(
                err
            );
            res.status(500).send({
                error:
                    "Erreur combat"
            });
        }
    }
);
app.post(
    "/api/fight/kill",
    authMiddleware,
    async (req, res) => {
        try {
            const user =
                req.user.id;
            const enemy =
                req.body.pokemon;
            const companion =
                (
                    await query(
                        `
                        SELECT *
                        FROM zxd_compagnon
                        WHERE user = ?
                        AND active = 1
                        `,
                        [user]
                    )
                )[0];
            if (!companion) {
                return res
                    .status(400)
                    .send({
                        error:
                            "Aucun compagnon"
                    });
            }
            const rewards = [];
            // RECOMPENSES
            const tierMultiplierReward =
                enemy.tier === 4 ? 58.65 :
                    enemy.tier === 3 ? 1.75 :
                        enemy.tier === 2 ? 1.5 :
                            1.25;
            const packChance =
                0.000142 *
                (tierMultiplierReward / 2);
            const fragmentChance =
                0.000569 *
                (tierMultiplierReward / 2);
            const boosterChance =
                0.00341 *
                (tierMultiplierReward / 2);
            const roll =
                Math.random();
            let reward =
                null;
            if (
                roll <
                packChance
            ) {
                reward = {
                    item:
                        "Pack Safari",
                    slug:
                        "box"
                };
            } else if (
                roll <
                packChance +
                fragmentChance
            ) {
                reward = {
                    item:
                        "Fragment de Pack",
                    slug:
                        "fragement"
                };
            } else if (
                roll <
                packChance +
                fragmentChance +
                boosterChance
            ) {
                reward = {
                    item:
                        "Booster",
                    slug:
                        "booster"
                };
            }
            if (reward) {
                await addItem(
                    user,
                    reward.item,
                    reward.slug,
                    1
                );
                rewards.push(
                    reward
                );
            }
            // XP
            const formMultiplier =
                companion.negative === 1
                    ? 2
                    : companion.shiny === 1
                        ? 1.5
                        : 1;

            const tierMultiplier =
            {
                1: 1,
                2: 2,
                3: 4,
                4: 8
            };
            const xpGainByTier =
            {
                1: 18,
                2: 37,
                3: 75,
                4: 288
            };
            const xpToNextLevel =
                Math.floor(
                    (
                        20 +
                        companion.level *
                        companion.level *
                        2
                    ) *
                    tierMultiplier[
                    companion.tier
                    ] *
                    formMultiplier
                );
            const xpGain =
                xpGainByTier[
                enemy.tier
                ];
            let level =
                companion.level;
            let xp =
                companion.xp +
                xpGain;
            if (
                xp >=
                xpToNextLevel
            ) {
                level++;
                xp = 0;
            }
            await query(
                `
                UPDATE zxd_compagnon
                SET
                    level = ?,
                    xp = ?
                WHERE id = ?
                `,
                [
                    level,
                    xp,
                    companion.id
                ]
            );
            await incrementStat(
                user,
                "fight_total"
            );
            await incrementStat(
                user,
                "fight_"+enemy.tier
            );
            await checkAchievements(
                user
            );
            res.send({
                rewards,
                level,
                xp,
                xpGain
            });
        } catch (err) {
            console.error(
                err
            );
            res.status(500)
                .send({
                    error:
                        "Erreur combat"
                });
        }
    }
);

/* Leaderboard */
app.get("/api/getLeaderBoard", (req, res, next) => {
    db.query(
        `
        SELECT
            p.user,
            p.login,
            p.level,
            p.skin,
            p.title,
            t.name AS title_name,
            t.rarity AS title_rarity,
            c.number,
            c.pokemon,
            c.shiny,
            c.negative
        FROM zxd_profil p
        LEFT JOIN zxd_compagnon c
            ON c.number = p.compagnon
        LEFT JOIN zxd_titles t
            ON t.code = p.title
        ORDER BY p.level DESC
        `,
        (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }

            res.send(result);
        }
    );
});


//Cartes
app.get("/api/card/init/:profilId", async (req, res) => {
    try {
        const profilId = req.params.profilId; // Rotation active 
        const rotationSets = await query(` SELECT s.*, r.end_date FROM zxd_card_set s INNER JOIN zxd_card_rotation_set rs ON rs.set_id = s.id INNER JOIN zxd_card_rotation r ON r.id = rs.rotation_id WHERE NOW() BETWEEN r.start_date AND r.end_date `);
        // Collection 
        const collection = await query(` SELECT * FROM zxd_card_collection WHERE profil_id = ? `, [profilId]);
        // Progression rotation 
        const progressRows = await query(` SELECT set_tcgdex_id, COUNT( DISTINCT card_tcgdex_id ) AS owned FROM zxd_card_collection WHERE profil_id = ? GROUP BY set_tcgdex_id `, [profilId]);
        const progress = {}; progressRows.forEach(row => { progress[row.set_tcgdex_id] = { owned: row.owned }; });
        rotationSets.forEach(set => { if (!progress[set.tcgdex_id]) { progress[set.tcgdex_id] = { owned: 0 }; } progress[set.tcgdex_id].total = set.card_count; progress[set.tcgdex_id].percent = Number((progress[set.tcgdex_id].owned / set.card_count * 100).toFixed(1)); });
        // Monnaie booster 
        const boosterRow = await query(` SELECT quantity FROM zxd_inventaire WHERE user = ? AND slug = 'booster' LIMIT 1 `, [profilId]);
        const boosterCurrency = boosterRow?.[0]?.quantity || 0;
        // Progression globale 
        const globalOwned = await query(` SELECT COUNT( DISTINCT card_tcgdex_id ) AS total FROM zxd_card_collection WHERE profil_id = ? `, [profilId]);
        const globalTotal = await query(` SELECT SUM(card_count) AS total FROM zxd_card_set WHERE active = 1 `);
        const globalProgress = { owned: globalOwned[0]?.total || 0, total: globalTotal[0]?.total || 0, percent: Number(((globalOwned[0]?.total || 0) / (globalTotal[0]?.total || 1) * 100).toFixed(1)) };
        // Sets possédés 
        const ownedSets = await query(`SELECT s.tcgdex_id, s.name, s.logo, s.card_count, COUNT(DISTINCT c.card_tcgdex_id) AS owned, JSON_ARRAYAGG(JSON_OBJECT('id', c.card_tcgdex_id,'localId', card.local_id, 'quantity', c.quantity, 'image', card.image, 'rarity', card.rarity, 'tier', rarity.tier)) AS cards FROM zxd_card_set s INNER JOIN zxd_card_collection c ON c.set_tcgdex_id = s.tcgdex_id INNER JOIN zxd_card card ON card.tcgdex_id = c.card_tcgdex_id LEFT JOIN zxd_card_rarity rarity ON rarity.name = card.rarity WHERE c.profil_id = ? GROUP BY s.tcgdex_id, s.name, s.logo, s.card_count ORDER BY s.release_date DESC`, [profilId]);
        ownedSets.forEach(set => { set.percent = Number((set.owned / set.card_count * 100).toFixed(1)); set.cards = typeof set.cards === "string" ? JSON.parse(set.cards) : set.cards; });
        res.send({ rotationSets, collection, progress, boosterCurrency, globalProgress, ownedSets });
    }
    catch (err)
    {
        console.error(err); res.status(500).send(err);
    }
});
app.get("/api/card/globalProgress/:profilId", async (req, res) => {

    try {

        const profilId =
            req.params.profilId;
        const result =
            await query(`
                SELECT
                    (SELECT COUNT(DISTINCT card_tcgdex_id)
                        FROM zxd_card_collection
                        WHERE profil_id = ?
                    ) AS owned,
                    (
                        SELECT SUM(card_count)
                        FROM zxd_card_set
		                WHERE active = 1
                    ) AS total
            `, [profilId]);
        const owned =
            result[0].owned;
        const total =
            result[0].total;
        res.send({
            owned,
            total,
            percent:
                Number(
                    (
                        owned /
                        total *
                        100
                    ).toFixed(1)
                )

        });

    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }

});
app.post("/api/card/openBooster", async (req, res) => {

    try {

        const userId = req.body.userId;
        const setTcgdexId = req.body.setTcgdexId;

        // Vérification monnaie

        const inventory = await query(`
            SELECT quantity
            FROM zxd_inventaire
            WHERE user = ?
            AND slug = 'booster'
            LIMIT 1
        `, [userId]);

        const boosterCurrency =
            inventory?.[0]?.quantity || 0;

        if (boosterCurrency <= 0) {

            return res.send({
                success: false,
                message: "Aucun booster disponible"
            });

        }

        // Consommation

        await query(`
            UPDATE zxd_inventaire
            SET quantity = quantity - 1
            WHERE user = ?
            AND slug = 'booster'
            AND quantity > 0
        `, [userId]);

        // 2 cartes tier 1

        const commonCards = await query(`
            SELECT c.*,
    r.tier
            FROM zxd_card c
            INNER JOIN zxd_card_rarity r
                ON r.name = c.rarity
            WHERE c.set_tcgdex_id = ?
            AND r.tier = 1
            ORDER BY RAND()
            LIMIT 2
        `, [setTcgdexId]);

        // 2 cartes tier 2

        const uncommonCards = await query(`
            SELECT c.*,
    r.tier
            FROM zxd_card c
            INNER JOIN zxd_card_rarity r
                ON r.name = c.rarity
            WHERE c.set_tcgdex_id = ?
            AND r.tier = 2
            ORDER BY RAND()
            LIMIT 2
        `, [setTcgdexId]);

        // Pool premium

        const rarityPool = await query(`
            SELECT
                r.name AS rarity,
                r.weight
            FROM zxd_card_rarity r
            INNER JOIN zxd_card c
                ON c.rarity = r.name
            WHERE c.set_tcgdex_id = ?
            AND r.tier >= 3
            GROUP BY r.name
        `, [setTcgdexId]);

        const selectedRarity =
            weightedRandom(rarityPool);

        // Carte premium

        const premiumCard = await query(`
    SELECT
        c.*,
        r.tier
    FROM zxd_card c
    INNER JOIN zxd_card_rarity r
        ON r.name = c.rarity
    WHERE c.set_tcgdex_id = ?
    AND c.rarity = ?
    ORDER BY RAND()
    LIMIT 1
`, [
            setTcgdexId,
            selectedRarity
        ]);

        // Booster final

        const openedCards = [

            ...commonCards,
            ...uncommonCards,
            ...premiumCard

        ];

        // Ajout collection

        for (const card of openedCards) {
            const existing = await query(`
                SELECT id
                FROM zxd_card_collection
                WHERE profil_id = ?
                AND card_tcgdex_id = ?
                LIMIT 1
            `, [
                        userId,
                        card.tcgdex_id
                    ]);

                    card.isNew =
                existing.length === 0;
            await query(`
                INSERT INTO zxd_card_collection
                (
                    profil_id,
                    set_tcgdex_id,
                    card_tcgdex_id,
                    quantity,
                    first_obtained_at,
                    last_obtained_at
                )
                VALUES
                (
                    ?, ?, ?, 1,
                    NOW(),
                    NOW()
                )

                ON DUPLICATE KEY UPDATE

                    quantity =
                        quantity + 1,

                    last_obtained_at =
                        NOW()
            `, [
                userId,
                card.set_tcgdex_id,
                card.tcgdex_id
            ]);

        }
        const progressRows = await query(`
            SELECT
                set_tcgdex_id,
                COUNT(DISTINCT card_tcgdex_id) AS owned
            FROM zxd_card_collection
            WHERE profil_id = ?
            GROUP BY set_tcgdex_id
        `, [userId]);
        const progress = {};

        progressRows.forEach(row => {

            progress[row.set_tcgdex_id] = {
                owned: row.owned
            };

        });
        const rotationSets = await query(`
            SELECT s.*
            FROM zxd_card_set s
            INNER JOIN zxd_card_rotation_set rs
                ON rs.set_id = s.id
            INNER JOIN zxd_card_rotation r
                ON r.id = rs.rotation_id
            WHERE NOW() BETWEEN r.start_date
                            AND r.end_date
        `);
        rotationSets.forEach(set => {

            if (!progress[set.tcgdex_id]) {

                progress[set.tcgdex_id] = {
                    owned: 0
                };

            }

            progress[set.tcgdex_id].total =
                set.card_count;

            progress[set.tcgdex_id].percent =
                Number(
                    (
                        progress[set.tcgdex_id].owned /
                        set.card_count *
                        100
                    ).toFixed(1)
                );

        });
        const globalOwned = await query(`
            SELECT
                COUNT(
                    DISTINCT card_tcgdex_id
                ) AS total
            FROM zxd_card_collection
            WHERE profil_id = ?
        `, [userId]);

        const globalTotal = await query(`
            SELECT
                SUM(card_count) AS total
            FROM zxd_card_set
            WHERE active = 1
        `);

        const globalProgress = {

            owned:
                globalOwned[0]?.total || 0,

            total:
                globalTotal[0]?.total || 0,

            percent:
                Number(
                    (
                        (
                            globalOwned[0]?.total || 0
                        ) /
                        (
                            globalTotal[0]?.total || 1
                        ) * 100
                    ).toFixed(1)
                )

        };

        await incrementStat(
            userId,
            "booster_" + setTcgdexId,
        );
        await incrementStat(
            userId,
            "booster_total"
        );
        await checkAchievements(
            userId
        );
        res.send({
            success: true,
            boosterCurrency:
                boosterCurrency - 1,
            openedCards,
            progress,
            globalProgress
        });

    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }

});

/* Succès */
app.get(
    "/api/profile/:id/achievements",
    async (req, res) => {
        try {
            const results =
                await getAchievementsProgress(
                    req.params.id
                );
            res.send(
                results
            );
        } catch (err) {
            console.error(
                err
            );
            res.status(500).send({
                error:
                    "Erreur succès"
            });
        }
    }
);
// Fonctions
//Synchronise les sets de l'API TCGDEX avec ma BDD
function query(sql, params = []) {

    return new Promise((resolve, reject) => {

        db.query(
            sql,
            params,
            (err, result) => {

                if (err) {
                    reject(err);
                    return;
                }

                resolve(result);

            }
        );

    });

}
async function syncSets() {

    try {

        const { data: sets } = await axios.get(
            "https://api.tcgdex.net/v2/fr/sets"
        );

        for (const set of sets) {

            const { data: details } = await axios.get(
                `https://api.tcgdex.net/v2/fr/sets/${set.id}`
            );

            db.query(
                `
                INSERT INTO zxd_card_set
                (
                    tcgdex_id,
                    name,
                    logo,
                    release_date,
                    card_count
                )
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    logo = VALUES(logo),
                    release_date = VALUES(release_date),
                    card_count = VALUES(card_count)
                `,
                [
                    details.id,
                    details.name,
                    `/boosters/${details.id}.png`,
                    details.releaseDate || null,
                    details.cardCount?.total || 0
                ],
                (err) => {
                    if (err) console.log(err);
                }
            );
        }

        console.log("Sets synchronisés");

    } catch (err) {
        console.error(err);
    }
}
async function incrementStat(
    user,
    stat,
    amount = 1
) {

    await query(
        `
        INSERT INTO zxd_user_stats
        (
            user,
            stat_code,
            value
        )
        VALUES
        (
            ?,
            ?,
            ?
        )
        ON DUPLICATE KEY UPDATE
            value =
            value + VALUES(value)
        `,
        [
            user,
            stat,
            amount
        ]
    );

}
async function syncSetCards(setTcgdexId) {

    try {

        const { data: setData } =
            await axios.get(
                `https://api.tcgdex.net/v2/fr/sets/${setTcgdexId}`
            );

        for (const card of setData.cards) {

            const { data: cardData } =
                await axios.get(
                    `https://api.tcgdex.net/v2/fr/cards/${card.id}`
                );
            let imageUrl = cardData.image;
            try {
                await axios.head(
                    imageUrl + "/high.webp"
                );
            } catch {
                imageUrl =
                    imageUrl.replace(
                        "/fr/",
                        "/en/"
                    );
            }
            await query(`
                INSERT INTO zxd_card
                (
                    tcgdex_id,
                    set_tcgdex_id,
                    local_id,
                    rarity,
                    image
                )
                VALUES (?, ?, ?, ?, ?)

                ON DUPLICATE KEY UPDATE
                    local_id = VALUES(local_id),
                    rarity = VALUES(rarity),
                    image = VALUES(image)
            `, [
                cardData.id,
                setTcgdexId,
                cardData.localId,
                cardData.rarity,
                imageUrl
            ]);

        }

        await query(`
            UPDATE zxd_card_set
            SET cards_synced = 1
            WHERE 
            tcgdex_id = ?
        `, [setTcgdexId]);

        console.log(
            `[TCG] ${setTcgdexId} synchronisé`
        );

    } catch (err) {

        console.error(err);

    }

}
async function getAchievementsProgress(
    userId
) {
    const achievements =
        await query(
            `
                    SELECT

                        a.*,

                        c.label,
                        c.icon,

                        c.display_order
                            AS category_order,

                        t.name
                            AS title_name,

                        t.rarity
                            AS title_rarity

                    FROM zxd_achievements a

                    LEFT JOIN zxd_achievement_categories c
                        ON c.code =
                            a.category

                    LEFT JOIN zxd_titles t
                        ON t.code =
                            a.title_code

                    ORDER BY
                        c.display_order,
                        a.display_order
                    `
        );

    /*
     * Stats utilisateur
     */

    const stats =
        await query(
            `
                    SELECT
                        stat_code,
                        value
                    FROM zxd_user_stats
                    WHERE user = ?
                    `,
            [userId]
        );

    const statsMap =
        {};

    stats.forEach(
        stat => {

            statsMap[
                stat.stat_code
            ] = Number(
                stat.value
            );

        }
    );

    /*
     * Pokédex
     */

    const pokedexStats =
        await query(
            `
                    SELECT

                        p.gen,

                        COUNT(
                            DISTINCT CASE
                                WHEN c.shiny = 0
                                AND c.negative = 0
                                THEN c.pokemon
                            END
                        ) AS normal_count,

                        COUNT(
                            DISTINCT CASE
                                WHEN c.shiny = 1
                                THEN c.pokemon
                            END
                        ) AS shiny_count,

                        COUNT(
                            DISTINCT CASE
                                WHEN c.negative = 1
                                THEN c.pokemon
                            END
                        ) AS shadow_count

                    FROM zxd_pokemon p

                    LEFT JOIN zxd_capture c
                        ON c.pokemon =
                            p.number
                        AND c.user = ?

                    GROUP BY p.gen
                    `,
            [userId]
        );

    let totalNormal =
        0;

    let totalShiny =
        0;

    let totalShadow =
        0;

    pokedexStats.forEach(
        row => {

            statsMap[
                `dex_${row.gen}`
            ] =
                Number(
                    row.normal_count
                );

            statsMap[
                `shiny_${row.gen}`
            ] =
                Number(
                    row.shiny_count
                );

            statsMap[
                `shadow_${row.gen}`
            ] =
                Number(
                    row.shadow_count
                );

            totalNormal +=
                Number(
                    row.normal_count
                );

            totalShiny +=
                Number(
                    row.shiny_count
                );

            totalShadow +=
                Number(
                    row.shadow_count
                );

        }
    );

    statsMap.dex_total =
        totalNormal;

    statsMap.shiny_total =
        totalShiny;

    statsMap.shadow_total =
        totalShadow;

    statsMap.chromatyk_total =
        totalNormal +
        totalShiny +
        totalShadow;

    /*
     * Cartes
     */

    const cardStats =
        await query(
            `
                    SELECT
                        COUNT(
                            DISTINCT card_tcgdex_id
                        ) AS total
                    FROM zxd_card_collection
                    WHERE profil_id = ?
                    `,
            [userId]
        );

    statsMap.cards_total =
        Number(
            cardStats[0]
                ?.total || 0
        );

    /*
     * Companion
     */

    const companionStats =
        await query(
            `
                    SELECT
                        COUNT(
                            DISTINCT CASE
                                WHEN c.shiny = 0
                                AND c.negative = 0
                                THEN c.pokemon
                            END
                        ) AS normal_count,

                        COUNT(
                            DISTINCT CASE
                                WHEN c.shiny = 1
                                THEN c.pokemon
                            END
                        ) AS shiny_count,

                        COUNT(
                            DISTINCT CASE
                                WHEN c.negative = 1
                                THEN c.pokemon
                            END
                        ) AS shadow_count,

                        COUNT(DISTINCT c.pokemon) AS total_count

                    FROM zxd_pokemon p
                    LEFT JOIN zxd_compagnon c
                        ON c.number = p.number
                        AND c.user = ?
                        AND c.level = 100;
                    `,
            [userId]
        );
    companionStats.forEach(
        row => {
            statsMap[
                `max_normal`
            ] =
                Number(
                    row.normal_count
                );

            statsMap[
                `max_shiny`
            ] =
                Number(
                    row.shiny_count
                );

            statsMap[
                `max_shadow`
            ] =
                Number(
                    row.shadow_count
                );

            statsMap[
                `max_total`
            ] =
                Number(
                    row.total_count
                );
        }
    );

    /*
     * Calcul progression
     */

    const results =
        achievements.map(
            achievement => {

                const progress =
                    statsMap[
                    achievement.stat_code
                    ] || 0;

                return {

                    id:
                        achievement.id,

                    category:
                        achievement.category,

                    subcategory:
                        achievement.subcategory,

                    code:
                        achievement.code,

                    achievement:
                        achievement.achievement,

                    description:
                        achievement.description,

                    target:
                        achievement.target,

                    progress,

                    completed:
                        progress >=
                        achievement.target,

                    categoryLabel:
                        achievement.label,

                    categoryIcon:
                        achievement.icon,

                    title: {

                        code:
                            achievement.title_code,

                        name:
                            achievement.title_name,

                        rarity:
                            achievement.title_rarity

                    }

                };
            }
        );

    return results;

}
async function checkAchievements(
    userId
) {

    const achievements =
        await getAchievementsProgress(
            userId
        );

    for (
        const achievement
        of achievements
    ) {

        if (
            !achievement.completed
        ) {

            continue;

        }

        if (
            !achievement.title?.code
        ) {

            continue;

        }

        await query(
            `
            INSERT IGNORE INTO
            zxd_user_titles
            (
                user,
                title_code
            )
            VALUES (?, ?)
            `,
            [
                userId,
                achievement.title.code
            ]
        );

    }

}
//Créer une nouvelle rotation de set

async function createRotation() {

    // Set le plus récent
    const latestSet = await query(`
        SELECT
            id,
            tcgdex_id,
            cards_synced
        FROM zxd_card_set
        ORDER BY release_date DESC
        LIMIT 1
    `);

    const latestSetData = latestSet[0];

    // Deux sets aléatoires
    const randomSets = await query(`
        SELECT
            id,
            tcgdex_id,
            cards_synced
        FROM zxd_card_set
        WHERE id != ?
        AND active = 1
        ORDER BY RAND()
        LIMIT 2
    `, [latestSetData.id]);

    // Les 3 sets de la rotation
    const selectedSets = [
        latestSetData,
        ...randomSets
    ];

    // Synchronisation des cartes si nécessaire
    for (const set of selectedSets) {

        if (!Number(set.cards_synced)) {

            console.log(
                `[TCG] Sync ${set.tcgdex_id}`
            );

            await syncSetCards(
                set.tcgdex_id
            );

        }

    }

    // Création de la rotation
    const startDate = new Date();

    const endDate = new Date();
    endDate.setDate(
        endDate.getDate() + 14
    );

    const result = await query(`
        INSERT INTO zxd_card_rotation
        (
            start_date,
            end_date
        )
        VALUES (?, ?)
    `, [startDate, endDate]);

    const rotationId =
        result.insertId;

    // Association des sets à la rotation
    for (const set of selectedSets) {

        await query(`
            INSERT INTO zxd_card_rotation_set
            (
                rotation_id,
                set_id
            )
            VALUES (?, ?)
        `, [
            rotationId,
            set.id
        ]);

    }

    console.log(
        `[TCG] Rotation #${rotationId} créée`
    );

}

async function createRotationIfNeeded() {

    db.query(
        `
        SELECT *
        FROM zxd_card_rotation
        WHERE NOW()
        BETWEEN start_date
        AND end_date
        LIMIT 1
        `,
        async (err, result) => {

            if (result.length > 0) {
                return;
            }

            await createRotation();

        }
    );

}
function weightedRandom(items) {

    const totalWeight =
        items.reduce(
            (sum, item) =>
                sum + item.weight,
            0
        );

    let random =
        Math.random() * totalWeight;

    for (const item of items) {

        random -= item.weight;

        if (random <= 0) {

            return item.rarity;

        }

    }

    return items[0].rarity;

}
const SERVER_START =
    Date.now();

app.get(
    "/api/version",
    (req, res) => {

        res.send({
            version:
                SERVER_START
        });

    }
);
// Automatisations
cron.schedule("0 22 * * 3", async () => {

    try {

        await syncSets();
        await createRotationIfNeeded();

        console.log("[TCG] Rotation créée");

    } catch (err) {

        console.error(err);

    }
}
);
cron.schedule("0 0 1 * *", () => {
    console.log("Suppression des anciennes expéditions");

    db.query(
        `
    DELETE FROM zxd_expedition
    WHERE endDate < DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 2 HOUR), '%Y-%m-01');
    `,
        (err, result) => {
            if (err) {
                console.log(err);
                return;
            }

            console.log(`${result.affectedRows} expéditions supprimées`);
        }
    );
},
{
    timezone: "Europe/Paris",
    }
);

cron.schedule("0 0,12 * * *", () => {
    db.query(
        `UPDATE zxd_inventaire 
         SET quantity = quantity + 1 
         WHERE slug = 'box' AND quantity < 2`,
        (err, result) => {
            if (err) {
                console.log(err);
                return;
            }

            console.log("Quantité box mise à jour");
        }
    );
},
{
    timezone: "Europe/Paris",
}
);
app.listen(3001, async () => {

    console.log("Serveur démarré");

    await syncSets();

});
updateTwitchCache();
setInterval(
    updateTwitchCache,
    30000
);
app.listen(process.env.PORT || PORT, ()=>{
    console.log(`Server is running on ＄{PORT}`)
})

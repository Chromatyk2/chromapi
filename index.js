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

        req.session.user = {
            id: user.id,
            login: user.login,
            display_name: user.display_name
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
//Version 2
app.post(
    "/api/createAccount",
    authMiddleware,
    async (req, res) => {
        const user =
            req.user;
        await query(
            `
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
                INSERT INTO zxd_item
                (user, item, slug, quantity)
                VALUES
                (?, ?, ?, ?)
                `,
            [
                user.id,
                "Miel Ordinaire",
                "honey",
                1
            ]
        );
        await query(
            `
                INSERT INTO zxd_item
                (user, item, slug, quantity)
                VALUES
                (?, ?, ?, ?)
                `,
            [
                user.id,
                "Bonbon S",
                "exps",
                10
            ]
        );
        await query(
            `
                INSERT INTO zxd_item
                (user, item, slug, quantity)
                VALUES
                (?, ?, ?, ?)
                `,
            [
                user.id,
                "Poke Ball",
                "ball",
                10
            ]
        );
        res.send({
            success: true
        });
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
app.post(
    "/api/createAccount",
    authMiddleware,
    async (req, res) => {
        const user =
            req.user;
        try {
            await query("START TRANSACTION");
            await query(                `
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
/* Profil Old*/
app.post('/api/addProfil', (req, res) => {
    const user = req.body.user;
    const login = req.body.login;
    const level = req.body.level;
    const xp = req.body.xp;
    const skin = req.body.skin;
    const compagnon = req.body.compagnon;
    db.query("INSERT INTO zxd_profil (user, login, level,xp,skin,compagnon) VALUES(?, ?, ?, ?,?,?) ON DUPLICATE KEY UPDATE user = VALUES(user),login = VALUES(login),level = VALUES(level),xp = VALUES(xp),skin = VALUES(skin),compagnon = VALUES(compagnon)", [user, login, level, xp, skin, compagnon], (err, result) => {
        if (err) {
            console.log(err)
        }
        res.send(result)
    });
});

app.post('/api/updateXp', (req, res) => {
    const user = req.body.user;
    const xp = req.body.xp;
    db.query("UPDATE zxd_profil SET xp = xp + ? WHERE user = ?", [xp, user], (err, result) => {
        if (err) {
            console.log(err)
        }
        res.send(result)
    });
});
app.post('/api/updateLevel', (req, res) => {
    const user = req.body.user;
    const level = req.body.level;
    db.query("UPDATE zxd_profil SET level = ? WHERE user = ?", [level, user], (err, result) => {
        if (err) {
            console.log(err)
        }
        res.send(result)
    });
});
app.post('/api/addNewSkin', (req, res) => {
    const user = req.body.user;
    db.query("INSERT INTO `zxd_skin` (`skin`, `user`) VALUES (ROUND( RAND() * 2154 ) + 1, ?)", [user], (err, result) => {
        if (err) {
            console.log(err)
        }
        res.send(result)
    });
});

app.get("/api/getTrainers/:id", (req, res, next) => {

    const id = req.params.id;
    db.query("SELECT user, skin FROM zxd_skin WHERE user = ?", id,
        (err, result) => {
            if (err) {
                console.log(err)
            }
            res.send(result)
        });
});
app.get("/api/getUser/:id", (req, res, next) => {

    const id = req.params.id;
    db.query("SELECT zxd_profil.user,zxd_profil.login,zxd_profil.level,zxd_profil.xp,zxd_profil.skin,zxd_profil.compagnon,zxd_capture.pokemon,zxd_capture.shiny,zxd_capture.negative FROM zxd_profil LEFT JOIN zxd_capture ON zxd_capture.user = zxd_profil.user WHERE zxd_profil.user = ?", id,
        (err, result) => {
            if (err) {
                console.log(err)
            }
            res.send(result)
        });
});

/** Inventaire **/
app.post('/api/addItem', (req, res) => {
    const user = req.body.user;
    const item = req.body.item;
    const slug = req.body.slug;
    db.query("INSERT INTO zxd_inventaire (user, item, quantity,slug) VALUES(?, ?, 1, ?) ON DUPLICATE KEY UPDATE quantity = quantity+1", [user, item, slug], (err, result) => {
        if (err) {
            console.log(err)
        }
        res.send(result)
    });
});
app.post('/api/addCandy', (req, res) => {
    const user = req.body.user;
    const item = req.body.item;
    const slug = req.body.slug;
    const quantity = req.body.quantity;
    db.query("INSERT INTO zxd_inventaire (user, item, quantity,slug) VALUES(?, ?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity+?", [user, item, quantity, slug, quantity], (err, result) => {
        if (err) {
            console.log(err)
        }
        res.send(result)
    });
});
app.post('/api/removeItem', (req, res) => {
    const user = req.body.user;
    const slug = req.body.slug;
    db.query("UPDATE zxd_inventaire SET quantity = quantity - 1 WHERE user = ? AND slug = ?", [user, slug], (err, result) => {
        if (err) {
            console.log(err)
        }
        res.send(result)
    });
});
app.post('/api/removeFragement', (req, res) => {
    const user = req.body.user;
    const slug = req.body.slug;
    db.query("UPDATE zxd_inventaire SET quantity = quantity - 100 WHERE user = ? AND slug = ?", [user, slug], (err, result) => {
        if (err) {
            console.log(err)
        }
        res.send(result)
    });
});
app.get("/api/getInventory/:user", (req, res, next) => {

    const user = req.params.user;
    db.query("SELECT item, quantity, slug FROM zxd_inventaire WHERE user= ? ", user,
        (err, result) => {
            if (err) {
                console.log(err)
            }
            res.send(result)
        });
});

/** Safari **/
app.get("/api/getRandomPokemon/:tier", (req, res, next) => {

    const tier = req.params.tier;
    db.query("SELECT name, tier, number,gen FROM zxd_pokemon WHERE tier= ? ORDER BY RAND() LIMIT 1", tier,
        (err, result) => {
            if (err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.post('/api/addSafari', (req, res) => {
    const user = req.body.user;
    const pokemon = req.body.pokemon;
    const love = req.body.love;
    const shiny = req.body.shiny;
    const negative = req.body.negative;
    const tier = req.body.tier;
    db.query("INSERT INTO zxd_safari (user, pokemon, love,shiny,negative,tier) VALUES(?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE pokemon = VALUES(pokemon), love = VALUES(love), shiny = VALUES(shiny), negative = VALUES(negative), tier = VALUES(tier); ", [user, pokemon, love, shiny, negative, tier], (err, result) => {
        if (err) {
            console.log(err)
        }
        res.send(result)
    });
});

app.get("/api/getSafari/:user", (req, res, next) => {

    const user = req.params.user;
    db.query("SELECT zxd_safari.user,zxd_safari.pokemon,zxd_safari.love,zxd_safari.shiny,zxd_safari.negative,zxd_pokemon.name,zxd_pokemon.tier,zxd_pokemon.gen FROM `zxd_safari` JOIN zxd_pokemon ON zxd_pokemon.number=zxd_safari.pokemon WHERE zxd_safari.user = ?;", user,
        (err, result) => {
            if (err) {
                console.log(err)
            }
            res.send(result)
        });
});
app.delete('/api/deleteSafari/:user', (req, res) => {
    const user = req.params.user;
    db.query("DELETE FROM `zxd_safari` WHERE `zxd_safari`.`user` = ?", user, (err, result) => {
        if (err) {
            console.log(err)
        }
        res.send(result)
    })
})
app.post('/api/addPokemon', (req, res) => {
    const user = req.body.user;
    const pokemon = req.body.pokemon;
    const gen = req.body.gen;
    const shiny = req.body.shiny;
    const negative = req.body.negative;
    const date = req.body.date;
    db.query("INSERT INTO zxd_capture (user, pokemon, gen,shiny,negative,date) VALUES(?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE shiny = VALUES(shiny), negative = VALUES(negative), date = VALUES(date);", [user, pokemon,gen, shiny, negative, date], (err, result) => {
        if (err) {
            console.log(err)
        }
        res.send(result)
    });
});

/* Pokedex */
app.get("/api/getPokedex/:user", (req, res, next) => {

    const user = req.params.user;
    db.query("SELECT zxd_capture.pokemon,zxd_capture.gen, zxd_capture.shiny, zxd_capture.negative, zxd_capture.date, zxd_pokemon.name, zxd_pokemon.tier FROM `zxd_capture` JOIN zxd_pokemon ON zxd_pokemon.number = zxd_capture.pokemon WHERE user = ?;", user,
        (err, result) => {
            if (err) {
                console.log(err)
            }
            res.send(result)
        });
});

/* Compagnon */
app.get("/api/getActiveCompagnon/:user/:number", (req, res, next) => {
    const user = req.params.user;
    const number = req.params.number;
    db.query("SELECT zxd_compagnon.user,zxd_compagnon.number,zxd_compagnon.pokemon ,zxd_compagnon.level,zxd_compagnon.shiny,zxd_compagnon.negative FROM zxd_compagnon WHERE zxd_compagnon.user = ? AND zxd_compagnon.number = ?;", [user, number],
        (err, result) => {
            if (err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getMaxLevelCompagnon/:user", (req, res, next) => {
    const user = req.params.user;
    db.query("SELECT zxd_compagnon.tier,zxd_compagnon.user,zxd_compagnon.number,zxd_compagnon.pokemon ,zxd_compagnon.level,zxd_compagnon.shiny,zxd_compagnon.negative FROM zxd_compagnon WHERE zxd_compagnon.user = ? AND zxd_compagnon.level = 100;", [user],
        (err, result) => {
            if (err) {
                console.log(err)
            }
            res.send(result)
        });
});
app.post('/api/updateCurrentCompagnon', (req, res) => {
    const user = req.body.user;
    db.query("UPDATE `zxd_compagnon`SET active = 0 WHERE user = ?", [user], (err, result) => {
        if (err) {
            console.log(err)
        }
        res.send(result)
    });
});
app.post('/api/levelupCompagnon', (req, res) => {
    const id = req.body.id;
    db.query("UPDATE `zxd_compagnon`SET level = level+1, xp = 0 WHERE id = ?", [id], (err, result) => {
        if (err) {
            console.log(err)
        }
        res.send(result)
    });
});
app.post('/api/updateXpCompagnon', (req, res) => {
    const xp = req.body.xp;
    const id = req.body.id;
    db.query("UPDATE `zxd_compagnon`SET xp = xp + ? WHERE id = ?", [xp,id], (err, result) => {
        if (err) {
            console.log(err)
        }
        res.send(result)
    });
});
app.post('/api/levelMaxCompagnon', (req, res) => {
    const id = req.body.id;
    db.query("UPDATE `zxd_compagnon`SET level = 100 WHERE id = ?", [id], (err, result) => {
        if (err) {
            console.log(err)
        }
        res.send(result)
    });
});
app.post('/api/newCompagnon', (req, res) => {
    const user = req.body.user;
    const number = req.body.number;
    const pokemon = req.body.pokemon;
    const shiny = req.body.shiny;
    const negative = req.body.negative;
    const level = req.body.level;
    const xp = req.body.xp;
    const active = req.body.active;
    const tier = req.body.tier;
    db.query("INSERT INTO `zxd_compagnon` (`user`, `number`, `pokemon`, `shiny`, `negative`, `level`, `xp`, `active`,`tier`) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?) ON DUPLICATE KEY UPDATE user = VALUES(user), number = VALUES(number), pokemon = VALUES(pokemon), shiny = VALUES(shiny), negative = VALUES(negative), level = VALUES(level), xp = VALUES(xp), active = VALUES(active), tier = VALUES(tier);", [user, number, pokemon, shiny, negative, level, xp,active,tier], (err, result) => {
        if (err) {
            console.log(err)
        }
        res.send(result)
    });
});
app.get("/api/getAllCompagnon/:user", (req, res, next) => {
    const user = req.params.user;
    db.query("SELECT zxd_compagnon.id,zxd_compagnon.user,zxd_compagnon.number,zxd_compagnon.pokemon ,zxd_compagnon.level,zxd_compagnon.shiny,zxd_compagnon.negative FROM zxd_compagnon WHERE zxd_compagnon.user = ?;", [user],
        (err, result) => {
            if (err) {
                console.log(err)
            }
            res.send(result)
        });
});
app.get("/api/getCurrentCompagnon/:user", (req, res, next) => {
    const user = req.params.user;
    db.query("SELECT zxd_compagnon.id,zxd_compagnon.xp,zxd_compagnon.user,zxd_compagnon.number,zxd_compagnon.pokemon ,zxd_compagnon.level,zxd_compagnon.shiny,zxd_compagnon.negative,zxd_pokemon.tier FROM zxd_compagnon JOIN zxd_pokemon ON zxd_pokemon.number = zxd_compagnon.number WHERE zxd_compagnon.user = ? AND zxd_compagnon.active = 1 ORDER BY id DESC LIMIT 1;", [user],
        (err, result) => {
            if (err) {
                console.log(err)
            }
            res.send(result)
        });
});
/* Leaderboard */
app.get("/api/getLeaderBoard", (req, res, next) => {
    db.query("SELECT zxd_profil.user, zxd_profil.login, zxd_profil.level, zxd_profil.skin,zxd_compagnon.number,zxd_compagnon.pokemon,zxd_compagnon.shiny,zxd_compagnon.negative FROM zxd_profil LEFT JOIN zxd_compagnon ON zxd_compagnon.number = zxd_profil.compagnon ORDER BY zxd_profil.level DESC ;",
        (err, result) => {
            if (err) {
                console.log(err)
            }
            res.send(result)
        });
});

/* Expedition */
app.post('/api/newExpedition', (req, res) => {
    const date = req.body.date;
    const number = req.body.number;
    const user = req.body.user;
    const tier = req.body.tier;
    const endDate = req.body.endDate;
    db.query("INSERT INTO `zxd_expedition` (`date`,`endDate`, `number`, `user`, `tier`, `active`) VALUES (?,?, ?, ?, ?,1) ON DUPLICATE KEY UPDATE endDate = VALUES(endDate), user = VALUES(user), number = VALUES(number), date = VALUES(date), tier = VALUES(tier);", [date, endDate, number, user, tier], (err, result) => {
        if (err) {
            console.log(err)
        }
        res.send(result)
    });
});
app.get("/api/getAllExpedition/:user", (req, res, next) => {
    const user = req.params.user;
    db.query("SELECT zxd_compagnon.tier,zxd_expedition.active,zxd_expedition.id,zxd_expedition.date,zxd_expedition.endDate,zxd_compagnon.number,zxd_compagnon.pokemon,zxd_compagnon.shiny,zxd_compagnon.negative FROM zxd_expedition INNER JOIN zxd_compagnon ON zxd_compagnon.number = zxd_expedition.number WHERE zxd_expedition.user = ?;", user,
        (err, result) => {
            if (err) {
                console.log(err)
            }
            res.send(result)
        });
});
app.get("/api/getExpedition/:user", (req, res, next) => {
    const user = req.params.user;
    db.query("SELECT zxd_compagnon.tier,zxd_expedition.id,zxd_expedition.date,zxd_expedition.endDate,zxd_compagnon.number,zxd_compagnon.pokemon,zxd_compagnon.shiny,zxd_compagnon.negative FROM zxd_expedition JOIN zxd_compagnon ON zxd_compagnon.user = zxd_expedition.user WHERE zxd_expedition.user = ? AND active = 1;",user,
        (err, result) => {
            if (err) {
                console.log(err)
            }
            res.send(result)
        });
});
app.delete('/api/deleteExpedition/:id', (req, res) => {
    const id = req.params.id;
    db.query("DELETE FROM `zxd_expedition` WHERE `zxd_expedition`.`number` = ?", id, (err, result) => {
        if (err) {
            console.log(err)
        }
        res.send(result)
    })
})
app.post('/api/closeExpedition/:id', (req, res) => {
    const id = req.params.id;
    db.query("UPDATE `zxd_expedition`SET active = 0 WHERE number = ?", [id], (err, result) => {
        if (err) {
            console.log(err)
        }
        res.send(result)
    });
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
            WHERE tcgdex_id = ?
        `, [setTcgdexId]);

        console.log(
            `[TCG] ${setTcgdexId} synchronisé`
        );

    } catch (err) {

        console.error(err);

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

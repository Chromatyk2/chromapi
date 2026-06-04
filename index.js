const express = require('express');
const db = require('./config/db')
const cors = require('cors');
const cron = require("node-cron");
const app = express();
const PORT = 8080;
const axios = require('axios');
require('dotenv').config();

app.use(express.json())
app.use(cors());
// Route to get all posts
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

    } catch (err) {

        console.error(err.response?.data || err);

        res.status(500).json({
            success: false
        });
    }
});
app.post('/api/updateIdProfil',(req,res)=>{

    const idUser = req.body.idUser;
    const user = req.body.user;
    db.query("UPDATE profil SET idUser = ? WHERE pseudo = ?",[idUser,user], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/updateIdBadges',(req,res)=>{

    const idUser = req.body.idUser;
    const user = req.body.user;
    db.query("UPDATE badges SET idUser = ? WHERE user = ?",[idUser,user], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/updateIdCaptures',(req,res)=>{

    const idUser = req.body.idUser;
    const user = req.body.user;
    db.query("UPDATE captures SET idUser = ? WHERE pseudo = ?",[idUser,user], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/updateIdCards',(req,res)=>{

    const idUser = req.body.idUser;
    const user = req.body.user;
    db.query("UPDATE cards SET idUser = ? WHERE user = ?",[idUser,user], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/updateIdCompagnon',(req,res)=>{

    const idUser = req.body.idUser;
    const user = req.body.user;
    db.query("UPDATE compagnon SET idUser = ? WHERE pseudo = ?",[idUser,user], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/updateIdSkin',(req,res)=>{

    const idUser = req.body.idUser;
    const user = req.body.user;
    db.query("UPDATE skin SET idUser = ? WHERE pseudo = ?",[idUser,user], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.get("/api/get", (req, res, next)=>{
    db.query("SELECT * FROM posts", (err,result)=>{
        if(err) {
            console.log(err)
        }
        res.send(result)
    });   });


app.get("/api/getListUser", (req, res, next)=>{

    db.query("SELECT user, COUNT(DISTINCT card) as nbCardUser FROM cards GROUP BY user  ORDER BY nbCardUser DESC",
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getListUser/:pseudo", (req, res, next)=>{

    const pseudo = req.params.pseudo;
    db.query("SELECT user, COUNT(DISTINCT card) as nbCardUser FROM cards WHERE user like '%' GROUP BY user  ORDER BY nbCardUser DESC",pseuso,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getCountProposition/:pseudo", (req, res, next)=>{

    const pseudo = req.params.pseudo;
    db.query("SELECT COUNT(popositiontrade.id) AS count FROM popositiontrade JOIN trades ON popositiontrade.idTrade = trades.id JOIN captures ON captures.id = trades.idMainCapture WHERE captures.pseudo = ?", pseudo,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getGuess/:id", (req, res, next)=>{

    const id = req.params.id;
    db.query("SELECT captures.id, captures.pseudo, captures.pkmName, captures.pkmImage, captures.pkmId, captures.shiny FROM captures JOIN popositiontrade ON popositiontrade.idCapture = captures.id WHERE popositiontrade.idTrade = ?", id,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getBoostersList", (req, res, next)=>{
    db.query("SELECT name, gen, block, nameGuru, totalcards, fullName, blockName FROM booster_list ORDER BY id ASC",
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});
app.get("/api/getBadgesByUser/:pseudo", (req, res, next)=>{

    const pseudo = req.params.pseudo;

    db.query("SELECT user, image, stade, description, booster FROM badges WHERE user = ?;", [pseudo],
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});
app.get("/api/getBoosterByName/:name", (req, res, next)=>{
    const name = req.params.name;

    db.query("SELECT name, gen, block, nameGuru, totalcards, fullName FROM booster_list WHERE name= ?",name,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getBoostersListByGen/:gen", (req, res, next)=>{

    const gen = req.params.gen;
    db.query("SELECT name FROM booster_list WHERE gen = ? ORDER BY id ASC",gen,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getCardsPoint/:pseudo", (req, res, next)=>{

    const pseudo = req.params.pseudo;
    db.query("SELECT cardToken FROM profil WHERE pseudo = ?", pseudo,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getMyCardsBySet/:pseudo/:booster", (req, res, next)=>{

    const pseudo = req.params.pseudo;
    const booster = req.params.booster;

    db.query("SELECT user, card,rarity,MAX(stade) as stade, COUNT(card) as nbCard FROM cards WHERE booster = ? AND user = ? GROUP BY card", [booster,pseudo],
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getAllMyCardsBySet/:pseudo/:booster", (req, res, next)=>{

    const pseudo = req.params.pseudo;
    const booster = req.params.booster;

    db.query("SELECT * FROM cards WHERE booster = ? AND user = ?", [booster,pseudo],
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getMyCardsBySetAndStade/:pseudo/:booster", (req, res, next)=>{

    const pseudo = req.params.pseudo;
    const booster = req.params.booster;

    db.query("SELECT DISTINCT card, stade FROM cards WHERE booster= ? AND user = ? AND stade > 0 GROUP BY card, stade", [booster,pseudo],
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getMyCardsByStade/:pseudo", (req, res, next)=>{

    const pseudo = req.params.pseudo;

    db.query("SELECT DISTINCT card,booster, stade FROM cards WHERE user = ? AND stade > 0 GROUP BY card, stade", pseudo,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getMyNbDouble/:pseudo", (req, res, next)=>{

    const pseudo = req.params.pseudo;

    db.query("SELECT booster, COUNT(*) AS nbCard FROM ( SELECT booster, COUNT(*) as nbcard FROM cards WHERE user = ? GROUP BY booster HAVING COUNT(*) > 1) AS T GROUP BY booster", pseudo,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getRaritiesByBooster/:booster", (req, res, next)=>{

    const booster = req.params.booster;

    db.query("SELECT rarity, stade, block, nameGuru FROM rarities WHERE booster = ? ", [booster],
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getTotalCardByUser/:pseudo", (req, res, next)=>{
    const pseudo = req.params.pseudo;
    db.query("SELECT COUNT(DISTINCT card) FROM cards WHERE user = ?",pseudo,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});
app.get("/api/getBoosterTotalCard", (req, res, next)=>{
    db.query("SELECT name, gen, totalCards, block, nameGuru FROM booster_list",
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getLastCard", (req, res, next)=>{
    db.query("SELECT user, card, booster, stade, block, number FROM cards WHERE stade = 4 ORDER BY id DESC LIMIT 10",
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getTotalCard", (req, res, next)=>{
    db.query("SELECT SUM(totalCards) as totalCard FROM booster_list",
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getMyTotalCards/:pseudo", (req, res, next)=>{

    const pseudo = req.params.pseudo;

    db.query("SELECT COUNT(DISTINCT card) as nbCard FROM cards WHERE  user = ?;", [pseudo],
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getMyLastTenCards/:pseudo", (req, res, next)=>{

    const pseudo = req.params.pseudo;

    db.query("SELECT card, stade, rarity, booster, number, block FROM cards WHERE user = ? ORDER BY id DESC Limit 10;", [pseudo],
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getNbCardsBySet/:pseudo/:booster", (req, res, next)=>{

    const pseudo = req.params.pseudo;
    const booster = req.params.booster;

    db.query("SELECT COUNT(DISTINCT card) as nbCard, booster FROM cards WHERE booster = ? AND user = ?;", [booster,pseudo],
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getBadgesByUserAndSet/:pseudo/:booster", (req, res, next)=>{

    const pseudo = req.params.pseudo;
    const booster = req.params.booster;

    db.query("SELECT user, image, stade, description FROM badges WHERE booster = ? AND user = ?;", [booster,pseudo],
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getNbCards/:pseudo", (req, res, next)=>{

    const pseudo = req.params.pseudo;
    const booster = req.params.booster;

    db.query("SELECT COUNT(DISTINCT card) as nbCard, booster FROM cards WHERE user = ? group by booster;", pseudo,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});
app.delete('/api/deleteBooster/:user/:booster',(req,res)=>{
    const user = req.params.user;
    const booster = req.params.booster;
    db.query("DELETE FROM boosters WHERE user = ? AND booster = ? LIMIT 1", [user,booster], (err,result)=>{
        if(err) {
            console.log(err)
        }
        res.send(result)
    })
})




app.delete('/api/sellCards/:user/:card/:limit',(req,res)=>{
    const user = req.params.user;
    const card = req.params.card;
    const limit = parseInt(req.params.limit);
    db.query("DELETE FROM cards WHERE user = ? AND card = ? LIMIT ?", [user,card,limit], (err,result)=>{
        if(err) {
            console.log(err)
        }
        res.send(result)
    })
})

app.options('/api/addCard')
app.post('/api/addCard', function (req, res, next){

    const pseudo = req.body.pseudo;
    const idCard = req.body.idCard;
    const booster = req.body.booster;
    const rarity = req.body.rarity;
    const grade = req.body.grade;
    const nb = req.body.nb;
    const idUSer = req.body.idUser;
    const block = req.body.block;

    db.query("INSERT INTO cards (user,card,booster,rarity,stade, number, block, idUSer) VALUES (?,?,?,?,?,?,?,?)",[pseudo,idCard,booster,rarity,grade, nb, block, idUSer], (err,result)=>{
        if(err) {
            console.log(err)
        }
        res.send(result)
    });
})

app.options('/api/addBadge')
app.post('/api/addBadge', function (req, res, next){

    const pseudo = req.body.pseudo;
    const image = req.body.image;
    const stade = req.body.stade;
    const booster = req.body.booster;
    const idUser = req.body.idUser;
    const description = req.body.description;

    db.query("INSERT INTO badges (user,image,stade,description,booster, idUser) VALUES (?,?,?,?,?,?)",[pseudo,image,stade,description,booster,idUser], (err,result)=>{
        if(err) {
            console.log(err)
        }
        res.send(result)
    });   })

app.options('/api/addLastSelling')
app.post('/api/addLastSelling', function (req, res, next){

    const pseudo = req.body.pseudo;
    const sellingTime = req.body.sellingTime;

    db.query("INSERT INTO last_selling (user,sellingTime) VALUES (?,?)",[pseudo,sellingTime], (err,result)=>{
        if(err) {
            console.log(err)
        }
        res.send(result)
    });   })

app.options('/api/addButtonClick')
app.post('/api/addButtonClick', function (req, res, next){

    const pseudo = req.body.pseudo;
    const hour = req.body.hour;

    db.query("INSERT INTO points_button (user,hour) VALUES (?,?)",[pseudo,hour], (err,result)=>{
        if(err) {
            console.log(err)
        }
        res.send(result)
    });   })

app.options('/api/registerCards')
app.post('/api/registerCards', function (req, res, next){

    const pseudo = req.body.pseudo;

    db.query("INSERT INTO cardspoint (user,points) VALUES (?,10000)",[pseudo], (err,result)=>{
        if(err) {
            console.log(err)
        }
        res.send(result)
    });   })

app.post('/api/addCardsPointButton',(req,res)=>{

    const user = req.body.user;
    db.query("UPDATE cardspoint SET points = points + 1000 WHERE user = ?",user, (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});


app.post('/api/updatePokemonTeam',(req,res)=>{
    const pkm = req.body.pkm;
    const image = req.body.image;
    const user = req.body.user;
    db.query("UPDATE profil SET ?? = ? WHERE pseudo = ?",[pkm,image,user], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/updateSkin',(req,res)=>{

    const user = req.body.user;
    const skin = req.body.skin;
    db.query("UPDATE profil SET profil_picture = ? WHERE pseudo = ?",[skin, user], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/updateBadge',(req,res)=>{

    const user = req.body.user;
    const image = req.body.image;
    db.query("UPDATE profil SET badge = ? WHERE pseudo = ?",[image, user], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});

app.post('/api/removeBoxSkin',(req,res)=>{

    const user = req.body.user;
    db.query("UPDATE profil SET box = box - 1 WHERE pseudo = ?",user, (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/removeToken',(req,res)=>{

    const user = req.body.user;
    db.query("UPDATE profil SET pkmToken = pkmToken - 1 WHERE pseudo = ?",user, (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});

app.post('/api/removePowder',(req,res)=>{

    const user = req.body.user;
    db.query("UPDATE profil SET powder = powder - 300 WHERE pseudo = ?",user, (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/removeBerryLevelUp',(req,res)=>{

    const user = req.body.user;
    const win = req.body.win;
    db.query("UPDATE profil SET berry = berry - ? WHERE pseudo = ?",[win,user], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/addXpPokemonLevelUp',(req,res)=>{

    const user = req.body.user;
    const pokemon = req.body.pokemon;
    const shiny = req.body.shiny;
    const negative = req.body.negative;
    db.query("UPDATE compagnon SET xp = xp + 1 WHERE pseudo = ? AND pokemon = ? AND shiny = ? AND negative = ? ",[user,pokemon,shiny,negative], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/removeBerry/:user',(req,res)=>{

    const user = req.body.user;
    db.query("UPDATE profil SET berry = berry - 1 WHERE pseudo = ?",user, (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/removeBerryDix/:user',(req,res)=>{

    const user = req.body.user;
    db.query("UPDATE profil SET berry = berry - 10 WHERE pseudo = ?",user, (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/removeBerryCent/:user',(req,res)=>{

    const user = req.body.user;
    db.query("UPDATE profil SET berry = berry - 100 WHERE pseudo = ?",user, (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/addSkin',(req,res)=>{

    const skin = req.body.skin;
    const user = req.body.user;
    const idUser = req.body.idUser;

    db.query("INSERT INTO skin (pseudo,skin,idUser) VALUES (?,?,?) ",[user, skin, idUser], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});

app.get("/api/getCurrentDailyGame", (req, res, next)=>{
    db.query("SELECT name, description, day FROM dailygame ORDER BY day DESC LIMIT 1",
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getDailyGameByDay/:day", (req, res, next)=>{

    const day = req.params.day;
    db.query("SELECT name, description, day FROM dailygame WHERE day = ?", day,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getAllDailyGames", (req, res, next)=>{
    db.query("SELECT name, description, day FROM dailygame",
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});
app.post('/api/addDailyGame',(req,res)=>{

    const name = req.body.name;
    const description = req.body.description;
    const day = req.body.day;

    db.query("INSERT INTO dailygame (name,description,day) VALUES (?,?,?) ",[name, description, day], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});

app.get("/api/truncatePedandex", (req, res, next)=>{

    db.query("TRUNCATE TABLE pedandex",
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.post('/api/removeBooster',(req,res)=>{
    const user = req.body.user;
    const booster = req.body.booster;
    db.query("UPDATE booster_user SET nbBooster = nbBooster - 1 WHERE user = ? AND booster = ?", [user,booster], (err,result)=>{
        if(err) {
            console.log(err)
        }
        res.send(result)
    })
})
app.post('/api/addCardsPoint/:pseudo/:idUser',(req,res)=>{

    const pseudo = req.params.user;
    const idUser = req.params.idUser;
    db.query("INSERT INTO profil (pseudo,cardToken,idUser) VALUES (?,1,?) ON DUPLICATE KEY UPDATE cardToken = cardToken + 1 ",[pseudo,idUser], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/addCardsPoint',(req,res)=>{

    const user = req.body.user;
    const idUser = req.body.idUser;
    db.query("INSERT INTO profil (pseudo,cardToken,idUser) VALUES (?,1,?) ON DUPLICATE KEY UPDATE cardToken = cardToken + 1 ",[user,idUser], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});

app.post('/api/addCardsPointRoulette',(req,res)=>{

    const user = req.body.user;
    const nbToken = req.body.nbToken;
    const idUser = req.body.idUser;
    db.query("INSERT INTO profil (pseudo,cardToken,idUser) VALUES (?,?,?) ON DUPLICATE KEY UPDATE cardToken = cardToken + ? ",[user, nbToken,idUser, nbToken], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/addPkmPointRoulette',(req,res)=>{

    const user = req.body.user;
    const nbToken = req.body.nbToken;
    const idUser = req.body.idUser;
    db.query("INSERT INTO profil (pseudo,pkmToken,idUser) VALUES (?,?,?) ON DUPLICATE KEY UPDATE pkmToken = pkmToken + ? ",[user,nbToken,idUser,nbToken], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/addPkmTokenTw',(req,res)=>{

    db.query("UPDATE profil SET pkmToken = pkmToken + 1 WHERE pseudo = 'chromatyk'", (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/addCardTokenTw',(req,res)=>{

    db.query("UPDATE profil SET cardToken = cardToken + 1 WHERE pseudo = 'chromatyk'", (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});

app.post('/api/addBerry',(req,res)=>{

    const berry = req.body.berry;
    const user = req.body.user;
    db.query("UPDATE profil SET berry = berry + ? WHERE pseudo = ?",[berry,user], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/addPkmToken',(req,res)=>{

    const user = req.body.user;
    const idUser = req.body.idUser;
    db.query("INSERT INTO profil (pseudo,pkmToken,idUser) VALUES (?,1,?) ON DUPLICATE KEY UPDATE pkmToken = pkmToken + 1 ",[user,idUser], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});

app.post('/api/addCardsPointTw',(req,res)=>{

    const user = req.body.user;
    const idUser = req.body.idUser;
    db.query("INSERT INTO profil (pseudo,cardToken,idUser) VALUES (?,1,?) ON DUPLICATE KEY UPDATE cardToken = cardToken + 1 ",[user,idUser], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/addXp',(req,res)=>{

    const user = req.body.user;
    const win = req.body.win;
    const wins = req.body.wins;
    const idUser = req.body.idUser;
    db.query("INSERT INTO profil (pseudo,xp,level,box,idUser) VALUES (?,?,1,1,?) ON DUPLICATE KEY UPDATE xp = xp + ? ",[user,win,idUser,wins], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/addXpPokemon',(req,res)=>{

    const user = req.body.user;
    const pokemon = req.body.pokemon;
    const shiny = req.body.shiny;
    const negative = req.body.negative;
    db.query("UPDATE compagnon SET xp = xp + 1 WHERE pseudo = ? AND pokemon = ? AND shiny = ? AND negative = ? ",[user,pokemon,shiny,negative], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/addXpPokemonDix',(req,res)=>{

    const user = req.body.user;
    const pokemon = req.body.pokemon;
    const shiny = req.body.shiny;
    const negative = req.body.negative;
    db.query("UPDATE compagnon SET xp = xp + 10 WHERE pseudo = ? AND pokemon = ? AND shiny = ? AND negative = ? ",[user,pokemon,shiny,negative], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/addXpPokemonCent',(req,res)=>{

    const user = req.body.user;
    const pokemon = req.body.pokemon;
    const shiny = req.body.shiny;
    const negative = req.body.negative;
    db.query("UPDATE compagnon SET xp = xp + 100 WHERE pseudo = ? AND pokemon = ? AND shiny = ? AND negative = ? ",[user,pokemon,shiny,negative], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/addPowder',(req,res)=>{

    const user = req.body.user;
    const win = req.body.win;
    const wins = req.body.wins;
    const idUser = req.body.idUser;
    db.query("INSERT INTO profil (pseudo,powder,idUser) VALUES (?,?,?) ON DUPLICATE KEY UPDATE powder = powder + ? ",[user,win,idUser,wins], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});

app.post('/api/addToken',(req,res)=>{

    const user = req.body.user;
    const win = req.body.win;
    const wins = req.body.wins;
    const idUser = req.body.idUser;
    db.query("INSERT INTO tokens (pseudo,token,idUser) VALUES (?,?,?) ON DUPLICATE KEY UPDATE token = token + ? ",[user,win,idUser,wins], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});

app.post('/api/addCompagnon',(req,res)=>{
    const user = req.body.user;
    const pokemon = req.body.pokemon;
    const level = req.body.level;
    const xp = req.body.xp;
    const pkm = req.body.pkm;
    const shiny = req.body.shiny;
    const negative = req.body.negative;
    const shine = req.body.shine;
    const actif = req.body.actif;
    const idUser = req.body.idUser;
    db.query("INSERT INTO compagnon (pseudo,pokemon, level, xp, shiny,negative,actif,idUser) VALUES (?,?,?,?,?,?,?,?);",[user,pokemon,level,xp,shiny,negative, actif,idUser], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});

app.get('/api/getCompagnon/:pseudo',(req,res)=>{
    const pseudo = req.params.pseudo;
    db.query("SELECT pseudo, pokemon, level, xp, shiny, negative FROM compagnon WHERE pseudo = ? AND actif = 1", pseudo, (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.get('/api/getShinydex',(req,res)=>{
    db.query("SELECT id,pokemon, surnom, date, version, gen, description, lien,idPkm FROM zxd_shinydex ORDER BY idPkm ASC ", (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.get('/api/getCompagnonList/:pseudo',(req,res)=>{
    const pseudo = req.params.pseudo;
    db.query("SELECT pseudo, pokemon, level, xp, shiny, actif, negative FROM compagnon WHERE pseudo = ?", pseudo, (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/updateCompagnon',(req,res)=>{

    const pseudo = req.body.pseudo;

    db.query("UPDATE compagnon SET actif = 0 WHERE pseudo = ?",[pseudo], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/activeCompagnon',(req,res)=>{

    const pseudo = req.body.pseudo;
    const pokemon = req.body.pokemon;
    const shiny = req.body.shiny;
    const negative = req.body.negative;

    db.query("UPDATE compagnon SET actif = 1 WHERE pseudo = ? AND pokemon = ? AND shiny = ? AND negative = ?",[pseudo, pokemon,shiny,negative], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.get("/api/getMyTokens/:pseudo", (req, res, next)=>{

    const pseudo = req.params.pseudo;
    db.query("SELECT token FROM tokens WHERE pseudo = ?", pseudo,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});


app.get("/api/getCanOpen/:pseudo", (req, res, next)=>{

    const pseudo = req.params.pseudo;
    db.query("SELECT canOpen FROM profil WHERE pseudo = ?", pseudo,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.post('/api/removeCanOpen',(req,res)=>{

    const today = req.body.today;
    const pseudo = req.body.pseudo;

    db.query("UPDATE profil SET canOpen = 0, lastOpening = ? WHERE pseudo = ?",[today,pseudo], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});

app.post('/api/allowCanOpen',(req,res)=>{

    const pseudo = req.body.pseudo;

    db.query("UPDATE profil SET canOpen = 0 WHERE pseudo = ?",pseudo, (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});

app.post('/api/addPedandexWin',(req,res)=>{

    const user = req.body.user;
    const tries = req.body.tries;
    const answer = req.body.answer;
    const day = req.body.day;
    db.query("INSERT INTO pedandex (pseudo,tries, answer, day) VALUES (?,?, ?, ?)",[user,tries,answer, day], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});

app.get("/api/getPedandexWin/:day", (req, res, next)=>{

    const day = req.params.day;
    db.query("SELECT pseudo, tries, answer, day FROM pedandex WHERE day = ? ORDER BY tries ASC",day,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getPedandexWinByUSer/:user", (req, res, next)=>{

    const user = req.params.user;
    db.query("SELECT pseudo, tries, answer, day FROM pedandex WHERE pseudo = ? ORDER BY tries ASC",user,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.post('/api/levelUp',(req,res)=>{

    const pseudo = req.body.pseudo;

    db.query("UPDATE profil SET level = level + 1, xp = 0, box = box + 1 WHERE pseudo = ?",pseudo, (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/lvlUpPokemon',(req,res)=>{

    const pseudo = req.body.pseudo;
    const pokemon = req.body.pokemon;
    const shiny = req.body.shiny;
    const negative = req.body.negative;

    db.query("UPDATE compagnon SET level = level + 1, xp = 0 WHERE pseudo = ? AND pokemon = ? AND shiny = ? AND negative = ?",[pseudo,pokemon,shiny,negative], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/addCardsPointFromSelling',(req,res)=>{
    const cardPoint = req.body.cardPoint;
    const user = req.body.user;
    db.query("UPDATE profil SET powder = powder + ? WHERE pseudo = ?",[cardPoint,user], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});

app.options('/api/removeCardsPoint')
app.post('/api/removeCardsPoint',(req,res)=>{

    const user = req.body.user;
    db.query("UPDATE profil SET cardToken = cardToken - 1 WHERE pseudo = ?",[user], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});

app.options('/api/removeCardsPointRandom')
app.post('/api/removeCardsPointRandom',(req,res)=>{

    const user = req.body.user;
    db.query("UPDATE cardspoint SET points = points - 500 WHERE user = ?",user, (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});

app.options('/api/addBooster')
app.post('/api/addBooster', function (req, res, next){

    const pseudo = req.body.pseudo;
    const booster = req.body.booster;
    const nbBooster = req.body.nbBooster;

    db.query("INSERT INTO booster_user (user,booster,nbBooster) VALUES (?,?,?)",[pseudo,booster,nbBooster], (err,result)=>{
        if(err) {
            console.log(err)
        }
        res.send(result)
    });   })

app.options('/api/updateBooster')
app.post('/api/updateBooster', function (req, res, next){

    const pseudo = req.body.pseudo;
    const booster = req.body.booster;
    const nbBooster = req.body.nbBooster;

    db.query("UPDATE booster_user SET nbBooster = nbBooster + ? WHERE booster = ? AND user = ?",[nbBooster,booster,pseudo], (err,result)=>{
        if(err) {
            console.log(err)
        }
        res.send(result)
    });   })

app.get("/api/getMyBoosters/:pseudo", (req, res, next)=>{

    const pseudo = req.params.pseudo;
    db.query("SELECT booster, nbBooster FROM booster_user WHERE user = ?", pseudo,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getMyBoostersByOne/:pseudo/:booster", (req, res, next)=>{

    const pseudo = req.params.pseudo;
    const booster = req.params.booster;
    db.query("SELECT booster, nbBooster FROM booster_user WHERE user = ? AND booster = ?", [pseudo,booster],
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.post('/api/updateSellingTime',(req,res)=>{

    const sellingTime = req.body.sellingTime;
    const pseudo = req.body.pseudo;

    db.query("UPDATE last_selling SET sellingTime = ? WHERE user = ?",[sellingTime,pseudo], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/updateButtonTime',(req,res)=>{

    const hour = req.body.hour;
    const pseudo = req.body.pseudo;

    db.query("UPDATE points_button SET hour = ? WHERE user = ?",[hour,pseudo], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});

app.get("/api/getSellingTime/:pseudo", (req, res, next)=>{

    const pseudo = req.params.pseudo;
    db.query("SELECT sellingTime FROM last_selling WHERE user = ? ", pseudo,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getDateButton/:pseudo", (req, res, next)=>{

    const pseudo = req.params.pseudo;
    db.query("SELECT hour FROM points_button WHERE user = ? ", pseudo,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});
app.get("/api/getCountPropositionByTrade/:id", (req, res, next)=>{

    const id = req.params.id;
    db.query("SELECT COUNT(popositiontrade.id) AS count FROM popositiontrade JOIN trades ON popositiontrade.idTrade = trades.id JOIN captures ON captures.id = trades.idMainCapture WHERE popositiontrade.idTrade = ?", id,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getByUser/:pseudo", (req, res, next)=>{

    const pseudo = req.params.pseudo;
    db.query("SELECT pkmId, pkmName, pkmImage,pkmId, shiny,negative, COUNT(*) as nbCapture, MAX(dateCapture) as  dateCapture FROM captures WHERE pseudo = ? GROUP BY pkmId, pkmName, pkmImage,pkmId, shiny, negative ORDER BY pkmId ASC, negative ASC", pseudo,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getTotalPokemon/:pseudo", (req, res, next)=>{

    const pseudo = req.params.pseudo;
    db.query("SELECT COUNT(*) as totalCapture FROM captures WHERE pseudo = ?", pseudo,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getProfil/:pseudo", (req, res, next)=>{

    const pseudo = req.params.pseudo;
    db.query("SELECT pseudo, xp, first_pokemon, second_pokemon, third_pokemon, fourth_pokemon, fifth_pokemon, sixth_pokemon, profil_picture, level, box, canOpen, lastOpening, pkmToken, badge, powder, berry, firstNeg, secondNeg,thirdNeg,fourthNeg,fiveNeg,sixthNeg  FROM profil WHERE idUser = ?", pseudo,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getProfilByPseudo/:pseudo", (req, res, next)=>{

    const pseudo = req.params.pseudo;
    db.query("SELECT pseudo, xp, first_pokemon, second_pokemon, third_pokemon, fourth_pokemon, fifth_pokemon, sixth_pokemon, profil_picture, level, box, canOpen, lastOpening, pkmToken, badge, powder, berry, firstNeg, secondNeg,thirdNeg,fourthNeg,fiveNeg,sixthNeg FROM profil WHERE pseudo = ?", pseudo,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getByUserAll/:pseudo", (req, res, next)=>{

    const pseudo = req.params.pseudo;
    db.query("SELECT id, pkmName, pkmImage, pkmId, shiny,dateCapture FROM captures WHERE pseudo = ?", pseudo,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getSkins/:pseudo", (req, res, next)=>{

    const pseudo = req.params.pseudo;
    db.query("SELECT id, pseudo, skin FROM skin WHERE pseudo = ?", pseudo,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getByUserAndPokemon/:pseudo/:pkmId", (req, res, next)=>{

    const pkmId = req.params.pkmId;
    const pseudo = req.params.pseudo;
    db.query("SELECT id, pkmName, pkmImage, pkmId, shiny, dateCapture FROM captures WHERE pseudo = ? AND pkmId = ?", [pseudo,pkmId],
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getAllreadyGuess/:pseudo/:tradeId", (req, res, next)=>{

    const pseudo = req.params.pseudo;
    const tradeId = req.params.tradeId;
    db.query("SELECT popositiontrade.id FROM popositiontrade JOIN captures ON popositiontrade.idCapture = captures.id JOIN trades ON popositiontrade.idTrade = trades.id WHERE captures.pseudo = ? AND trades.id = ?", [pseudo,tradeId],
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getByMainIdCapture/:idMainCapture", (req, res, next)=>{

    const idMainCapture = req.params.idMainCapture;
    db.query("SELECT * FROM trades WHERE idMainCapture = ?", idMainCapture,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

// app.options('/api/getMytrade')
app.get("/api/getMyTrades/:pseudo", (req, res, next)=>{

    const pseudo = req.params.pseudo;
    db.query("SELECT trades.id AS tradeId, captures.id AS captureId, captures.pseudo, captures.shiny, captures.pkmName, captures.dateCapture, captures.pkmImage FROM captures JOIN trades ON trades.idMainCapture = captures.id WHERE captures.pseudo = ?", [pseudo],
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getAllTrades/:pseudo", (req, res, next)=>{

    const pseudo = req.params.pseudo;
    db.query("SELECT trades.id AS tradeId, captures.id AS captureId, captures.pseudo, captures.shiny, captures.pkmName, captures.dateCapture, captures.pkmImage FROM captures JOIN trades ON trades.idMainCapture = captures.id WHERE captures.pseudo != ?", [pseudo],
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getTradeById/:id", (req, res, next)=>{

    const id = req.params.id;
    db.query("SELECT trades.id AS tradeId, captures.id AS captureId, captures.pseudo, captures.shiny, captures.pkmName, captures.dateCapture, captures.pkmImage, captures.pkmId, captures.id AS captureId FROM trades JOIN captures ON trades.idMainCapture = captures.id WHERE trades.id = ?", [id],
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getMyNote", (req, res, next)=>{

    db.query("SELECT note FROM chromaguess ORDER BY id DESC LIMIT 1",
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getAllProfil", (req, res, next)=>{

    db.query("SELECT * FROM profil WHERE pseudo != 'stryxlis' ORDER BY level + 0 DESC, xp DESC",
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getAllProfilRandom", (req, res, next)=>{

    db.query("SELECT * FROM profil WHERE first_pokemon is not NULL  AND second_pokemon is not NULL  AND third_pokemon is not NULL  AND fourth_pokemon is not NULL  AND fifth_pokemon is not NULL  AND sixth_pokemon is not NULL  AND profil_picture is not NULL AND pseudo != 'stryxlis'  ORDER BY level + 0 DESC, xp DESC",
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/lastGame", (req, res, next)=>{

    db.query("SELECT title, console FROM currentgame WHERE console is not null AND title is not null ORDER BY id DESC LIMIT 3",
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getCurrentGame", (req, res, next)=>{

    db.query("SELECT image FROM currentgame ORDER BY id DESC LIMIT 1",
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getViewersNote", (req, res, next)=>{

    db.query("SELECT note FROM viewersguess WHERE id IN (select max(id) FROM viewersguess GROUP BY pseudo)",
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/truncateViewers", (req, res, next)=>{

    db.query("TRUNCATE TABLE viewersguess",
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.options('/api/chromaGuess')
app.post('/api/chromaGuess', function (req, res, next){

    const note = req.body.note;

    db.query("INSERT INTO chromaguess (note) VALUES (?)",[note], (err,result)=>{
        if(err) {
            console.log(err)
        }
        res.send(result)
    });   })

app.options('/api/addBanger')
app.post('/api/addBanger', function (req, res, next){

    const support = req.body.support;
    const jeu = req.body.jeu;
    const viewer = req.body.viewer;
    const number = req.body.number;

    db.query("INSERT INTO banger (console,jeu,viewer,number) VALUES (?,?,?,?)",[support,jeu,viewer,number], (err,result)=>{
        if(err) {
            console.log(err)
        }
        res.send(result)
    });   })

app.get("/api/getBanger", (req, res, next)=>{
    db.query("SELECT console,viewer,number FROM banger where number IS NOT NULL",
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.options('/api/viewersGuess')
app.post('/api/viewersGuess', function (req, res, next){

    const note = req.query.message;
    const user = req.query.user;

    db.query("INSERT INTO viewersguess (note, pseudo) VALUES (?,?)",[note, user], (err,result)=>{
        if(err) {
            console.log(err)
        }
        res.send(result)
    });   })

app.options('/api/createTrade')
app.post('/api/createTrade', function (req, res, next){

    const idMainCapture = req.body.idMainCapture;
    const idSecondCapture = req.body.idSecondCapture;
    const state = req.body.state;

    db.query("INSERT INTO trades (idMainCapture, idSecondCapture, state) VALUES (?,?,?)",[idMainCapture,idSecondCapture,state], (err,result)=>{
        if(err) {
            console.log(err)
        }
        res.send(result)
    });   })

app.options('/api/createGuess')
app.post('/api/createGuess', function (req, res, next){

    const idTrade = req.body.idTrade;
    const idCapture = req.body.idCapture;

    db.query("INSERT INTO popositiontrade (idTrade, idCapture) VALUES (?,?)",[idTrade,idCapture], (err,result)=>{
        if(err) {
            console.log(err)
        }
        res.send(result)
    });   })

app.options('/api/addCurrentImage')
app.post('/api/addCurrentImage', function (req, res, next){

    const image = req.body.title;
    const plateforme = req.body.plateforme;

    db.query("INSERT INTO currentgame (title, console) VALUES (?,?)",[image,plateforme], (err,result)=>{
        if(err) {
            console.log(err)
        }
        res.send(result)
    });   })

app.delete('/api/deleteTrade/:id',(req,res)=>{
    const id = req.params.id;
    db.query("DELETE FROM trades WHERE id= ?", id, (err,result)=>{
        if(err) {
            console.log(err)
        }
        res.send(result)
    })
})

app.delete('/api/deleteCapture/:id',(req,res)=>{
    const id = req.params.id;
    db.query("DELETE FROM captures WHERE id= ?", id, (err,result)=>{
        if(err) {
            console.log(err)
        }
        res.send(result)
    })
})

app.delete('/api/deleteGuess/:id',(req,res)=>{
    const id = req.params.id;
    db.query("DELETE FROM popositiontrade WHERE idCapture= ?", id, (err,result)=>{
        if(err) {
            console.log(err)
        }
        res.send(result)
    })
})
app.delete('/api/deleteShiny/:id/:pseudo',(req,res)=>{
    const id = req.params.id;
    const pseudo = req.params.pseudo;
    db.query("DELETE FROM `captures` WHERE pseudo = ? AND pkmId = ? AND shiny = 0 LIMIT 5;",[pseudo,id], (err,result)=>{
        if(err) {
            console.log(err)
        }
        res.send(result)
    })
})
app.delete('/api/deleteShinyBadge/:id/:pseudo',(req,res)=>{
    const id = req.params.id;
    const pseudo = req.params.pseudo;
    db.query("DELETE FROM `captures` WHERE pseudo = ? AND pkmId = ? AND shiny = 1 LIMIT 5;",[pseudo,id], (err,result)=>{
        if(err) {
            console.log(err)
        }
        res.send(result)
    })
})

app.get("/api/getByPokemon/:pkmId/:pseudo", (req, res, next)=>{

    const pkmId = req.params.pkmId;
    const pseudo = req.params.pseudo;
    db.query("SELECT pkmName, pkmImage, pkmId, shiny, dateCapture, pseudo FROM captures WHERE pseudo != ? AND pkmId = ?", [pseudo,pkmId],
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getLaderboard/:shiny", (req, res, next)=>{

    const shiny = req.params.shiny;
    db.query('SELECT pseudo, COUNT(DISTINCT pkmId) AS nbCapture FROM captures WHERE shiny = ? GROUP BY pseudo ORDER BY nbCapture DESC', shiny,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});
app.get("/api/getTradesByPokemon/:pkmId", (req, res, next)=>{

    const pkmId = req.params.pkmId;
    db.query('SELECT captures.id, captures.pseudo, captures.shiny, captures.pkmName, captures.dateCapture FROM captures JOIN trades ON trades.idMainCapture = captures.id WHERE trades.state = 1 AND captures.pkmId = ?', pkmId,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});
// Route to get one post
app.get("/api/getFromId/:id", (req, res, next)=>{

    const id = req.params.id;
    db.query("SELECT * FROM posts WHERE id = ?", id,
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

// Route for creating the post
app.options('/api/create')
app.post('/api/create', (req, res, next)=> {

    const username = req.body.userName;
    const title = req.body.title;
    const text = req.body.text;

    db.query("INSERT INTO posts (title, post_text, user_name) VALUES (?,?,?)",[title,text,username], (err,result)=>{
        if(err) {
            console.log(err)
        }
        console.log(result)
    });   })

app.options('/api/capture')
app.post('/api/capture', (req, res, next)=> {

    const pseudo = req.body.pseudo;
    const pkmName = req.body.pkmName;
    const pkmImage = req.body.pkmImage;
    const pkmId = req.body.pkmId;
    const shiny = req.body.shiny;
    const negative = req.body.negative;
    const dateCapture = req.body.dateCapture;
    const idUser = req.body.idUser;

    db.query("INSERT INTO captures (pseudo, pkmName, pkmImage,pkmId, shiny,negative, dateCapture,idUser) VALUES (?,?,?,?,?,?,?,?)",[pseudo,pkmName,pkmImage,pkmId,shiny,negative,dateCapture,idUser], (err,result)=>{
        if(err) {
            console.log(err)
        }
        res.send(result)
    });   })

// Route to like a post
app.post('/api/like/:id',(req,res)=>{

    const id = req.params.id;
    db.query("UPDATE posts SET likes = likes + 1 WHERE id = ?",id, (err,result)=>{
        if(err) {
            console.log(err)   }
        console.log(result)
    });
});

app.post('/api/addTitleGame',(req,res)=>{

    const title = req.query.message;
    db.query("UPDATE currentgame SET title = ? ORDER BY id DESC LIMIT 1",title, (err,result)=>{
        if(err) {
            console.log(err)   }
        console.log(result)
    });
});
app.post('/api/addConsoleGame',(req,res)=>{

    const consoleGame = req.query.message;
    db.query("UPDATE currentgame SET console = ? ORDER BY id DESC LIMIT 1",consoleGame, (err,result)=>{
        if(err) {
            console.log(err)   }
        console.log(result)
    });
});
app.post('/api/addGuess',(req,res)=>{

    const user = req.body.user;
    const guess = req.body.guess;
    db.query("INSERT INTO guess (pseudo,guess) VALUES (?,?)",[user,guess], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.get("/api/getGuess", (req, res, next)=>{
    db.query("SELECT pseudo,guess FROM guess ",
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.delete('/api/removeGuess',(req,res)=>{
    db.query("TRUNCATE TABLE guess", (err,result)=>{
        if(err) {
            console.log(err)
        }
        res.send(result)
    })
})

//Version 2

/* Profil */
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
app.listen(process.env.PORT || PORT, ()=>{
    console.log(`Server is running on ＄{PORT}`)
})

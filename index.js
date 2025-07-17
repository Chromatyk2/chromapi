const express = require('express');
const db = require('./config/db')
const cors = require('cors');
const app = express();
const  PORT = 8080;
app.use(express.json())
app.use(cors());
// Route to get all posts
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
    db.query("SELECT name, gen, block, nameGuru, totalcards FROM booster_list ORDER BY id ASC",
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});
app.get("/api/getBadgesByUser/:pseudo", (req, res, next)=>{

    const pseudo = req.params.pseudo;

    db.query("SELECT user, image, stade, description FROM badges WHERE user = ?;", [pseudo],
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

    db.query("SELECT user, card,rarity,MAX(stade) as stade, COUNT(card) as nbCard FROM cards WHERE booster = ? AND user = ? GROUP BY card, rarity", [booster,pseudo],
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

    db.query("SELECT DISTINCT card, stade FROM cards WHERE booster= ? AND user = ? GROUP BY card, stade", [booster,pseudo],
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

    db.query("SELECT user, image, stade, description FROM badges WHERE image = ? AND user = ?;", [booster,pseudo],
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
    const stade = req.body.stade;
    const nb = req.body.nb;
    const block = req.body.block;

    db.query("INSERT INTO cards (user,card,booster,rarity,stade, number, block) VALUES (?,?,?,?,?,?,?)",[pseudo,idCard,booster,rarity,stade, nb, block], (err,result)=>{
        if(err) {
            console.log(err)
        }
        res.send(result)
    });   })

app.options('/api/addBadge')
app.post('/api/addBadge', function (req, res, next){

    const pseudo = req.body.pseudo;
    const image = req.body.image;
    const stade = req.body.stade;
    const description = req.body.description;

    db.query("INSERT INTO badges (user,image,stade,description) VALUES (?,?,?,?)",[pseudo,image,stade,description], (err,result)=>{
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

app.post('/api/addSkin',(req,res)=>{

    const skin = req.body.skin;
    const user = req.body.user;

    db.query("INSERT INTO skin (pseudo,skin) VALUES (?,?) ",[user, skin], (err,result)=>{
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
app.post('/api/addCardsPoint/:pseudo',(req,res)=>{

    const pseudo = req.params.user;
    db.query("INSERT INTO profil (pseudo,cardToken) VALUES (?,1) ON DUPLICATE KEY UPDATE cardToken = cardToken + 1 ",pseudo, (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/addCardsPoint',(req,res)=>{

    const user = req.body.user;
    db.query("INSERT INTO profil (pseudo,cardToken) VALUES (?,1) ON DUPLICATE KEY UPDATE cardToken = cardToken + 1 ",user, (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});

app.post('/api/addCardsPointRoulette',(req,res)=>{

    const user = req.body.user;
    const nbToken = req.body.nbToken;
    db.query("INSERT INTO profil (pseudo,cardToken) VALUES (?,?) ON DUPLICATE KEY UPDATE cardToken = cardToken + ? ",[user, nbToken, nbToken], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/addPkmPointRoulette',(req,res)=>{

    const user = req.body.user;
    const nbToken = req.body.nbToken;
    db.query("INSERT INTO profil (pseudo,pkmToken) VALUES (?,?) ON DUPLICATE KEY UPDATE pkmToken = pkmToken + ? ",[user,nbToken,nbToken], (err,result)=>{
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
app.post('/api/addPkmToken',(req,res)=>{

    const user = req.body.user;
    db.query("INSERT INTO profil (pseudo,pkmToken) VALUES (?,1) ON DUPLICATE KEY UPDATE pkmToken = pkmToken + 1 ",user, (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});



app.post('/api/addCardsPointTw',(req,res)=>{

    const user = req.body.user;
    db.query("INSERT INTO profil (pseudo,cardToken) VALUES (?,1) ON DUPLICATE KEY UPDATE cardToken = cardToken + 1 ",user, (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});
app.post('/api/addXp',(req,res)=>{

    const user = req.body.user;
    const win = req.body.win;
    const wins = req.body.wins;
    db.query("INSERT INTO profil (pseudo,xp,level,box) VALUES (?,?,1,1) ON DUPLICATE KEY UPDATE xp = xp + ? ",[user,win,wins], (err,result)=>{
        if(err) {
            console.log(err)   }
        res.send(result)
    });
});

app.post('/api/addToken',(req,res)=>{

    const user = req.body.user;
    const win = req.body.win;
    const wins = req.body.wins;
    db.query("INSERT INTO tokens (pseudo,token) VALUES (?,?) ON DUPLICATE KEY UPDATE token = token + ? ",[user,win,wins], (err,result)=>{
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
    db.query("SELECT pkmId, pkmName, pkmImage,pkmId, shiny, COUNT(*) as nbCapture, MAX(dateCapture) as  dateCapture FROM captures WHERE pseudo = ? GROUP BY pkmId, pkmName, pkmImage,pkmId, shiny ORDER BY pkmId ASC", pseudo,
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
    db.query("SELECT pseudo, xp, first_pokemon, second_pokemon, third_pokemon, fourth_pokemon, fifth_pokemon, sixth_pokemon, profil_picture, level, box, canOpen, lastOpening, pkmToken, badge FROM profil WHERE pseudo = ?", pseudo,
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

    db.query("SELECT * FROM profil WHERE pseudo != 'chromatyk' ORDER BY level + 0 DESC, xp DESC",
        (err,result)=>{
            if(err) {
                console.log(err)
            }
            res.send(result)
        });
});

app.get("/api/getAllProfilRandom", (req, res, next)=>{

    db.query("SELECT * FROM profil WHERE pseudo != 'chromatyk' AND first_pokemon is not NULL  AND second_pokemon is not NULL  AND third_pokemon is not NULL  AND fourth_pokemon is not NULL  AND fifth_pokemon is not NULL  AND sixth_pokemon is not NULL  AND profil_picture is not NULL  ORDER BY level + 0 DESC, xp DESC",
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
    db.query("DELETE FROM `captures` WHERE pseudo = ? AND pkmId = ? LIMIT 5;",[pseudo,id], (err,result)=>{
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
    db.query('SELECT pseudo, COUNT(DISTINCT pkmId) AS nbCapture FROM captures WHERE shiny = ? AND pseudo != "Chromatyk" GROUP BY pseudo ORDER BY nbCapture DESC', shiny,
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
        });   });

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
    const dateCapture = req.body.dateCapture;

    db.query("INSERT INTO captures (pseudo, pkmName, pkmImage,pkmId, shiny, dateCapture) VALUES (?,?,?,?,?,?)",[pseudo,pkmName,pkmImage,pkmId,shiny,dateCapture], (err,result)=>{
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
// Route to delete a post

app.delete('/api/delete/:id',(req,res)=>{
    const id = req.params.id;

    db.query("DELETE FROM posts WHERE id= ?", id, (err,result)=>{
        if(err) {
            console.log(err)
        } }) })

app.listen(process.env.PORT || PORT, ()=>{
    console.log(`Server is running on ＄{PORT}`)
})

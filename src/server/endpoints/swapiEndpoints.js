const randomIntFromInterval = require("../../app/helpers/randomInt")

const _isWookieeFormat = (req) => {
    return !!(req.query.format && req.query.format == 'wookiee');
}


const applySwapiEndpoints = async (server, app) => {

    server.get('/hfswapi/test', async (req, res) => {
        const data = await app.swapiFunctions.genericRequest('https://swapi.dev/api/', 'GET', null, true);
        res.send(data);
    });

    server.get('/hfswapi/getPeople/:id', async (req, res) => {
        const id = req.params
        let character = await app.db.swPeople.findOne({ where: id })
        if (character === null) {
            character = await app.swapiFunctions.genericRequest(`https://swapi.dev/api/people/${id.id}`, 'GET', null, true);
        }

        let characterWorld = await app.swapiFunctions.genericRequest(character.homeworld, 'GET', null, true);
        let [characterWorldId] = character.homeworld.match(/\/(\d+)+[\/]?/g).map(id => id.replace(/\//g, ''));

        let modifyCharacter = {
            "name": character.name,
            "mass": character.mass,
            "height": character.height,
            "homeworldName": characterWorld.name,
            "homeworldId": characterWorldId,
        }

        res.send(modifyCharacter);
    });

    server.get('/hfswapi/getPlanet/:id', async (req, res) => {
        const id = req.params
        let planet = await app.db.swPlanet.findOne({ where: id })
        if (planet === null) {
            planet = await app.swapiFunctions.genericRequest(`https://swapi.dev/api/planets/${id.id}`, 'GET', null, true);
        }

        let modifyPlanet = {
            "name": planet.name,
            "gravity": planet.gravity,
        }

        res.send(modifyPlanet);
    });

    server.get('/hfswapi/getWeightOnPlanetRandom', async (req, res) => {
        let randomCharacterId = randomIntFromInterval(1,82)
        let randomPlanetId = randomIntFromInterval(1,60)

        let planet = await app.db.swPlanet.findOne({ where: { "id": randomPlanetId } })
        let character = await app.db.swPeople.findOne({ where: { "id": randomCharacterId } })

        if (planet === null) {
            planet = await app.swapiFunctions.genericRequest(`https://swapi.dev/api/planets/${randomPlanetId}`, 'GET', null, true);
        }

        if (character === null) {
            character = await app.swapiFunctions.genericRequest(`https://swapi.dev/api/people/${randomCharacterId}`, 'GET', null, true);
        }

        let [characterWorldId] = character.homeworld.match(/\/(\d+)+[\/]?/g).map(id => id.replace(/\//g, ''));

        let characterMass = 0;
        if (+characterWorldId === randomPlanetId) {
            res.send({"characterMass": "¡Error! se está tratando de calcular el peso de un personaje en su planeta natal"});
        } else if (character.mass === "unknown" || planet.gravity === "unknown") {
            characterMass = "unknown"
        } else {
            let planetGravityA = planet.gravity
            let [planetGraityTransform] = planetGravityA.match(/\d/g)
            characterMass = app.swapiFunctions.getWeightOnPlanet(+character.mass, +planetGraityTransform)
        }

        res.send({"characterMass": characterMass});
    });

    server.get('/hfswapi/getLogs',async (req, res) => {
        const data = await app.db.logging.findAll();
        res.send(data);
    });

}

module.exports = applySwapiEndpoints;
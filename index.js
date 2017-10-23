const express = require('express')
const shutterstock = require('shutterstock')
const dotenv = require('dotenv')

const app = express()
dotenv.config()

const api = shutterstock.v2({
    clientId: process.env.CLIENTID,
    clientSecret: process.env.CLIENTSECRET,
});

//Since the recent searches are temporary and ever-changing , I figured it's better if I stored this in the app memory as an array
const state = {
    recentSearches: []
}

const recentSearchesLength = 30

const updateState = latest => {

    //TODO: Improvement: write the array to a file each time, and if length is 0, we can read from the file?

    let tempRecentSearches = state.recentSearches
    const length = tempRecentSearches.length

    tempRecentSearches = [latest, ...tempRecentSearches]

    if (length >= recentSearchesLength) {
        tempRecentSearches.pop()
    }

    state.recentSearches = tempRecentSearches
}

//dto
const dto = (result) => {
    const items = result.data.map(imageObject => {
        return {
            height: imageObject.assets.preview.height,
            width: imageObject.assets.preview.width,
            src: imageObject.assets.preview.url,
            description: imageObject.description,

        }
    })
    return {
        numberOfItems: result.data.length,
        items,
    }
}


app.get('/', (req, res) => {
    return res.status(200).json(
        {
            'description': 'This is an Image Search Abstraction Layer, a FreeCodeCamp exercise',
            'links': [
                {
                    'url': '/',
                    'description': 'API home page, that\'s where we are right now'
                },
                {
                    'url': '/:query',
                    'description': 'get images based on the query'
                },
                {
                    'url': '/recent',
                    'description': `displays the last ${recentSearchesLength} queries`
                }
            ]
        }
    )
})



app.get('/recent', (req, res) => {
    return res.status(200).json({searches: state.recentSearches})
})

app.get('/:query', (req, res) => {
    const queryObject = {
        query: req.params.query
    }
    const offset = Number.parseInt(req.query.offset)

    if (offset && Number.isInteger(offset) && offset > 0) {
        queryObject.per_page = 20 + offset
    }

    updateState(queryObject.query)

    return api.image.search(queryObject, function(err, result) {
        if (err) throw err;

        if (offset && Number.isInteger(offset) && offset > 0) {
            result.data.splice(0, offset)
        }

        return res.status(200).json(dto(result))
    });

})

//This route is for testing and inspecting the format of the API response
app.get('/raw/london', (req, res) => {
    return api.image.search({
        query: 'London',
    }, function(err, data) {
        if (err) throw err;

        return res.status(200).json(data)
    });
})

app.listen(3000, () => {
    console.log('Server running on port 3000..')
})
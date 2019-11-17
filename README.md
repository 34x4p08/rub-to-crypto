This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

# Live demo

https://ipfs.io/ipfs/QmegYAJoFYHyqD8SRtYufWJ5yucuKJrsQCPWs9gm7tgxPY

## Description

Find the best rate to exchange your roubles to crypto and back

### Algorithm

- Downloads zip-archive with data from https://www.bestchange.ru/ in memory of a browser
- Fetches market prices from  https://www.cryptocompare.com/
- Calculates differences between rates of specific assets
    <details><summary>Crypto Assets</summary>
        <ul>
            <li>BTC</li>
            <li>ETH</li>
            <li>BCH</li>
            <li>BSV</li>
            <li>BTG</li>
            <li>ETC</li>
            <li>LTC</li>
            <li>XRP</li>
            <li>XMR</li>
            <li>DASH</li>
            <li>ZEC</li>
            <li>USD</li>
            <li>PAX</li>
            <li>XEM</li>
            <li>REP</li>
            <li>NEO</li>
            <li>EOS</li>
            <li>IOTA</li>
            <li>LSK</li>
            <li>ADA</li>
            <li>XLM</li>
            <li>WAVES</li>
            <li>OMG</li>
            <li>BNB</li>
            <li>ICX</li>
            <li>BA</li>
        </ul>
    </details>
    <details><summary>Fiat Assets</summary>
        <ul>    
            <li>Sberbank Roubles</li>
            <li>Yandex Money Roubles</li>
            <li>QIWI Roubles</li>    
        </ul>    
    </details>
- Sorts values
- Screens top 12

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

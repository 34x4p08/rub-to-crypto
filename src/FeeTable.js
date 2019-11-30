import React, { Component } from 'react';
import {
    Col,
    Table,
    Button,
    Pagination,
    PaginationItem,
    PaginationLink,
} from 'reactstrap';

import AdmZip from 'adm-zip';
import request from 'request';
import axios from 'axios';
import ButtonGroup from 'reactstrap/es/ButtonGroup';
const zipUrl = 'http://www.bestchange.ru/bm/info.zip';

class FeeTable extends Component {
    constructor(props) {
        super(props);

        // const resultsMock = [];
        //
        // for (let i=1; i <= 100; i++) {
        //     resultsMock.push({
        //         fee: i,
        //         cryptoSymbol: 'TEST',
        //         fiatSymbol: "RUB" /*.replace('SBERRUB', 'Сбер')
        //                     .replace('QWRUB', 'Qiwi')
        //                     .replace('YAMRUB', 'Яндекс')*/,
        //         price: 100,
        //         reserve: 2323,
        //         cryptoName: 'no',
        //         fiatName: 'no',
        //     });
        // }

        this.state = {
            cryptoCurrencies: [],
            fiatCodes: [],
            allRates: [],
            currencyCodes: [],
            buyResults: [],
            sellResults: [],
            opacity: 0,
            isBuy: true,
            showingItems: [],
            middlePage: 2,
            selectedPage: 1,
            sorting: true,
            mostProfitableFirst: true,
        };
    }

    reverseResults() {
        this.setState({
            mostProfitableFirst: !this.state.mostProfitableFirst,
        });
        setTimeout(() => {
            this.updateShowingItems();
        }, 0);
    }

    componentDidMount() {
        this.fadeLoading();
        this.fetchExchangesData();
    }

    changeSide() {
        this.setState({
            showingItems: [],
            isBuy: !this.state.isBuy,
            middlePage: 2,
            selectedPage: 1,
            mostProfitableFirst: true,
        });

        if (!this.state.sellResults.length) {
            setTimeout(() => {
                this.calculateFees();
            }, 0);
        }
        setTimeout(() => {
            this.updateShowingItems();
        }, 0);
    }

    updateShowingItems = () => {
        let resultPointer = 'buyResults';
        if (!this.state.isBuy) {
            resultPointer = 'sellResults';
        }
        const total = this.state[resultPointer].length;
        let start, end;
        if (this.state.mostProfitableFirst) {
            if (this.state.selectedPage === this.lastPageNumber()) {
                start = total - (total % 12);
                end = total;
            } else {
                start = 12 * (this.state.selectedPage - 1);
                end = start + 12;
            }
        } else {
            if (this.state.selectedPage === this.lastPageNumber()) {
                end = total % 12;
                start = 0;
            } else {
                end = total - 1 - 12 * (this.state.selectedPage - 1);
                start = end - 12;
            }
        }
        let itemsToShow = this.state[resultPointer].slice(start, end);
        if (!this.state.mostProfitableFirst) {
            itemsToShow.reverse();
        }
        this.setState({
            showingItems: itemsToShow,
        });
    };

    setSelectedPage = pageNumber => {
        this.setState({
            selectedPage: pageNumber,
        });
        setTimeout(() => {
            this.updateShowingItems();
        }, 0);
    };

    fadeLoading() {
        let up = true;

        const opacityIterator = setInterval(() => {
            if (this.state.showingItems.length) {
                clearInterval(opacityIterator);
            }

            let opacity = this.state.opacity;

            if (up) {
                opacity += 0.01;
            } else {
                opacity -= 0.01;
            }

            if (opacity >= 1) {
                up = false;
            }

            if (opacity <= 0) {
                up = true;
            }

            this.setState({
                opacity,
            });
        }, 9);
    }

    fetchExchangesData() {
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';

        request.get(
            { url: proxyUrl + zipUrl, encoding: null },
            async (err, res, body) => {
                const zip = new AdmZip(body);
                const zipEntries = zip.getEntries();

                zipEntries.forEach(entry => {
                    if (entry.entryName.match(/bm_rates/i)) {
                        let data = zip.readAsText(entry, 'utf8');
                        data = data.split(';1\n');
                        this.setState({ allRates: data });
                    } else if (entry.entryName.match(/bm_cycodes/i)) {
                        let data = zip.readAsText(entry, 'utf8');
                        data = data.split('\n');
                        this.setState({ currencyCodes: data });
                    } else if (entry.entryName.match(/bm_info/i)) {
                        let data = zip.readAsText(entry, 'ascii');
                        data = data.split('\n');
                        data = data[0].slice(12, data[0].indexOf(','));
                        this.setState({ dateOfUpdate: data });
                    }
                });

                await this.unpackData();

                this.calculateFees();
                this.updateShowingItems();
            }
        );
    }

    calculateFees() {
        let currencies = [];

        for (let cc of this.state.cryptoCurrencies) {
            for (let fiat of this.state.fiatCodes) {
                let searchString = this.state.isBuy
                    ? `${fiat.code};${cc.code};`
                    : `${cc.code};${fiat.code};`;
                let pairRates = this.state.allRates.filter(s =>
                    s.startsWith(searchString)
                );
                pairRates.forEach(s => {
                    s = s.split(';');
                    let fee, price;
                    if (this.state.isBuy) {
                        fee = Number(
                            ((Number(s[3]) / cc.price - 1) * 100).toFixed(3)
                        );
                        price = Number(s[3]).toFixed(2);
                    } else {
                        fee = Number(
                            ((1 - Number(s[4]) / cc.price) * 100).toFixed(3)
                        );
                        price = Number(s[4]).toFixed(2);
                    }
                    currencies.push({
                        fee: fee,
                        cryptoSymbol: cc.name,
                        fiatSymbol: fiat.name
                            .replace('SBERRUB', 'Сбер')
                            .replace('QWRUB', 'Qiwi')
                            .replace('YAMRUB', 'Яндекс'),
                        price: price,
                        reserve: s[5],
                        cryptoName: cc.fullName,
                        fiatName: fiat.fullName,
                    });
                });
            }
        }

        currencies.sort(function(a, b) {
            if (a.fee > b.fee) return 1;
            if (a.fee < b.fee) return -1;
            return 0;
        });
        if (this.state.isBuy) {
            this.setState({
                buyResults: currencies,
            });
        } else {
            this.setState({
                sellResults: currencies,
            });
        }
    }

    async unpackData() {
        const cryptoCurrencies = [];
        const fiatCodes = [];
        const symbols = [
            'ETH',
            'BTC',
            'BCH',
            'BSV',
            'BTG',
            'ETC',
            'LTC',
            'XRP',
            'XMR',
            'DASH',
            'ZEC',
            'USDT',
            'PAX',
            'XEM',
            'REP',
            'NEO',
            'EOS',
            'IOTA',
            'LSK',
            'ADA',
            'XLM',
            'WAVES',
            'OMG',
            'BNB',
            'ICX',
            'BAT',
        ];

        const cryptoFullNames = [
            'ethereum',
            'bitcoin',
            'bitcoin-cash',
            'bitcoin-sv',
            'bitcoin-gold',
            'ethereum-classic',
            'litecoin',
            'ripple',
            'monero',
            'dash',
            'zcash',
            'tether',
            'paxos',
            'nem',
            'augur',
            'neo',
            'eos',
            'iota',
            'lisk',
            'cardano',
            'stellar',
            'waves',
            'omg',
            'binance-coin',
            'icon',
            'bat',
        ];

        const marketPrices = await FeeTable.getMarketPrices(symbols);

        symbols.forEach((sym, i) => {
            cryptoCurrencies.push({
                name: sym,
                code: this.getCurrencyCode(sym),
                price: marketPrices[sym],
                fullName: cryptoFullNames[i],
            });
        });

        const fiatFullName = ['sberbank', 'yandex-money', 'qiwi'];
        ['SBERRUB', 'YAMRUB', 'QWRUB'].forEach((name, i) => {
            fiatCodes.push({
                name,
                code: this.getCurrencyCode(name),
                fullName: fiatFullName[i],
            });
        });

        this.setState({ cryptoCurrencies, fiatCodes });
    }

    lastPageNumber() {
        let resultPointer = this.state.isBuy ? 'buyResults' : 'sellResults';
        let result = Math.floor(this.state[resultPointer].length / 12);
        if (this.state[resultPointer].length % 12 !== 0) {
            result += 1;
        }
        return result;
    }

    lastMiddlePageNumber() {
        return this.lastPageNumber() - 1;
    }

    nextPageHandler() {
        if (this.state.middlePage < this.lastMiddlePageNumber()) {
            this.setState({
                middlePage: this.state.middlePage + 1,
            });
        }
    }

    previousPageHandler() {
        if (this.state.middlePage > 2) {
            this.setState({
                middlePage: this.state.middlePage - 1,
            });
        }
    }

    firstPageHandler() {
        this.setState({
            middlePage: 2,
        });
    }

    lastPageHandler() {
        this.setState({
            middlePage: this.lastMiddlePageNumber(),
        });
    }

    getCurrencyCode(name) {
        for (let code of this.state.currencyCodes) {
            code = code.split(';');
            if (code[1] === name) {
                return code[0];
            }
        }
    }

    static async getMarketPrices(symbols) {
        let marketPrices = {};
        let ids = '';
        const symbolToIdUrl = 'https://api.coingecko.com/api/v3/coins/list';
        let symbolToId = (await axios(symbolToIdUrl)).data;
        for (let i = 0; i < symbols.length; i++) {
            for (let j = 0; j < symbolToId.length; j++) {
                if (
                    symbols[i].toLowerCase() === symbolToId[j].symbol ||
                    (symbols[i].toLowerCase() === 'iota' &&
                        symbolToId[j].symbol === 'miota')
                ) {
                    ids += symbolToId[j].id + ',';
                    break;
                }
            }
        }
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=rub`;
        let prices = (await axios.get(url)).data;
        for (let id in prices) {
            for (let obj of symbolToId) {
                if (id === obj.id) {
                    let symbol = obj.symbol.toUpperCase();
                    if (symbol === 'MIOTA') symbol = 'IOTA';
                    marketPrices[symbol] = prices[id].rub;
                    break;
                }
            }
        }
        console.log(marketPrices);
        return marketPrices;
    }

    render() {
        if (!this.state.showingItems.length)
            return (
                <p style={{ opacity: this.state.opacity }}>Calculations...</p>
            );

        return (
            <Col sm="12" md={{ size: 8 }}>
                <ButtonGroup>
                    <Button
                        onClick={() => {
                            this.changeSide();
                        }}
                        disabled={this.state.isBuy}
                        size="lg"
                    >
                        Buy Crypto
                    </Button>
                    <Button
                        onClick={() => {
                            this.changeSide();
                        }}
                        disabled={!this.state.isBuy}
                        size="lg"
                    >
                        Sell Crypto
                    </Button>
                </ButtonGroup>
                <p />
                <Table dark striped responsive="md">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>
                                fee, %{' '}
                                <Button
                                    onClick={() => {
                                        this.reverseResults();
                                    }}
                                >
                                    {this.state.mostProfitableFirst ? '↑' : '↓'}
                                </Button>
                            </th>
                            <th>currency</th>
                            {(this.state.isBuy && <th>buy with</th>) || (
                                <th>sell for</th>
                            )}
                            <th>price, rub</th>
                            <th>reserve</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.showingItems.map((item, i) => {
                            return (
                                <tr key={i}>
                                    <th scope="row">
                                        <a
                                            href={`https://www.bestchange.ru/${
                                                this.state.isBuy
                                                    ? item.fiatName
                                                    : item.cryptoName
                                            }-to-${
                                                this.state.isBuy
                                                    ? item.cryptoName
                                                    : item.fiatName
                                            }.html`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                textDecorationLine: 'underline',
                                            }}
                                        >
                                            {12 *
                                                (this.state.selectedPage - 1) +
                                                i +
                                                1}
                                        </a>
                                    </th>
                                    <td>{item.fee}</td>
                                    <td>{item.cryptoSymbol}</td>
                                    <td>{item.fiatSymbol}</td>
                                    <td>{item.price}</td>
                                    <td>{item.reserve}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
                <Pagination>
                    <PaginationItem
                        onClick={() => {
                            this.firstPageHandler();
                        }}
                    >
                        <PaginationLink first href="#" />
                    </PaginationItem>
                    <PaginationItem
                        onClick={() => {
                            this.previousPageHandler();
                        }}
                    >
                        <PaginationLink previous href="#" />
                    </PaginationItem>
                    <PaginationItem
                        onClick={() => {
                            this.setSelectedPage(this.state.middlePage - 1);
                        }}
                        active={
                            this.state.middlePage - 1 ===
                            this.state.selectedPage
                        }
                    >
                        <PaginationLink href="#">
                            {this.state.middlePage - 1}
                        </PaginationLink>
                    </PaginationItem>
                    <PaginationItem
                        onClick={() => {
                            this.setSelectedPage(this.state.middlePage);
                        }}
                        active={
                            this.state.middlePage === this.state.selectedPage
                        }
                    >
                        <PaginationLink href="#">
                            {this.state.middlePage}
                        </PaginationLink>
                    </PaginationItem>
                    <PaginationItem
                        onClick={() => {
                            this.setSelectedPage(this.state.middlePage + 1);
                        }}
                        active={
                            this.state.middlePage + 1 ===
                            this.state.selectedPage
                        }
                    >
                        <PaginationLink href="#">
                            {this.state.middlePage + 1}
                        </PaginationLink>
                    </PaginationItem>

                    <PaginationItem
                        onClick={() => {
                            this.nextPageHandler();
                        }}
                    >
                        <PaginationLink next href="#" />
                    </PaginationItem>
                    <PaginationItem
                        onClick={() => {
                            this.lastPageHandler();
                        }}
                    >
                        <PaginationLink last href="#" />
                    </PaginationItem>
                </Pagination>
                <p>Last update {this.state.dateOfUpdate}</p>
            </Col>
        );
    }
}

export default FeeTable;

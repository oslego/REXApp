"use strict";

window.config = {
	"banks": {
		"brd": "BRD",
		"bcr": "BCR",
		"garanti": "Garanti Bank",
		"piraeus": "Piraeus Bank",
		"alpha": "Alpha Bank",
		"br": "Banca Romaneasca",
		"bt": "Banca Transilvania",
		"otp": "OTP Bank",
		"bancpost": "Bancpost"
	},
	"currencies": {
		"eur": "Euro",
		"usd": "Dolari americani",
		"aud": "Dolari australieni",
		"cad": "Dolari canadieni",
		"chf": "Franci elvetieni",
		"sek": "Coroane suedeze",
		"dkk": "Coroane daneze",
		"ikk": "Coroane islandeze",
		"nok": "Coroane norvegiene",
		"gbp": "Lire sterline",
		"jpy": "Yeni japonezi",
		"huf": "Forinti unguresti",
		"pln": "Zloti polonezi",
		"czk": "Coroane cehesti",
		"rub": "Ruble rusesti",
		"bgn": "Leva bulgara"
	},
	// Cache for results
	results: []
}

var qs = document.querySelector.bind(document);

var getConfigData = new Promise(function(resolve, reject){
  resolve(window.config)
})

function _setupCurrencySelect(data){
  var currencies = data.currencies,
      host       = qs('#currency'),
      currCode   = qs('#active_currency_code'),
      currName   = qs('#active_currency_name'),
      tags       = [],
      code, name;

  for (code in currencies){
      name = currencies[code];
      tags.push(`<option value="${code}" data-name="${name}">${code.toUpperCase()} - ${name}</option>\n`)
  }

  host.innerHTML = tags.join('');
  host.addEventListener('change', function(e){
    currCode.textContent = e.target.value;
    currName.textContent = e.target.selectedOptions[0].dataset.name;
    e.target.blur();
  });

  host.selectedIndex = 0;
  host.dispatchEvent(new Event('change'));
}

function _setupSearchForm(){
  var form = qs('#search');
  var amountEl = qs('#amount');

  // automatically select input content
  amountEl.addEventListener('click', (e) => { e.target.select() });
  amountEl.addEventListener('change', (e) => { console.log(e) });

  form.addEventListener('submit', (e) => {
    var query = {
      operation: (form.elements.operation.value === 'buy') ? 'sell' : 'buy',
      currency: form.elements.currency.value,
      amount:  form.elements.amount.value
    }

    _getResults(query).then(_renderResults);

    e.preventDefault();
  })
}

function _filterCachedResultsByQuery(query) {

	// Reduce our cache to only the sought-after results
	var rates = window.config.results.reduce((acc, result) => {
		if (query.currency === result.currency.toLowerCase()) {
			acc.push(result)
		}
		return acc
	}, [])

  var results = rates.map( (rate) => {
      var amount = query.amount * rate[query.operation];

      return {
        bank: window.config.banks[rate.bankId],
        amount: amount,
        operation: query.operation
      }
    }).sort( (a, b) => {
      /*
        Sort results in customer's favor:
        lowest first if bank is selling,
        highest first if bank is buying
      */
      return (query.operation === 'sell') ? a.amount - b.amount : b.amount - a.amount
    })

	return results
}

function _getResults(query){

  return new Promise(function(resolve, reject){
    // var URL = `http://api.rexapp.ro/v1/rates/${query.currency}`;
    var URL = `https://rex-crawler-lbkepvgzsb.now.sh`;

		if (!window.config.results.length) {
			fetch(URL)
			.then(function(response) { return response.json(); })
			.then((data) =>  {
				window.config.results = data.results.slice(0);
				console.log(data)
				resolve(_filterCachedResultsByQuery(query));

	    })
		} else {
			resolve(_filterCachedResultsByQuery(query));
		}

  })
}

function _renderResults(results){
  var host = qs('#results'),
      best = results[0].amount, // sorted results, best rate is always at the top
      amount, delta, sign, rateClass;

  host.innerHTML = results.map( (result) => {
    amount = result.amount;
    delta = -1 * (best - amount);
    sign = (delta > 0) ? "+" : "";
    rateClass = (delta === 0) ? "best-rate" : "";

    if (delta === 0){
      delta = "cel mai bun curs";
    } else {
      delta = (result.amount < 1000)
        ? Number(delta).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: delta < 1 ? 4 : 2 })
        : Math.round(delta).toLocaleString('ro-RO');
    }

    amount = (result.amount < 1000)
      ? Number(amount).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : Math.round(amount).toLocaleString('ro-RO');

    return `<li class="result__item">
      <span class="bank">${result.bank}</span>
      <div class="rate">
        <div class="total">${amount}</div>
        <div class="delta ${rateClass}">${sign}${delta}</div>
      </div>
    </li>`
  }).join('');
}

function _init(){
  qs('#search').submit.click();
}

getConfigData
  .then(_setupCurrencySelect)
  .then(_setupSearchForm)
  .then(_init)

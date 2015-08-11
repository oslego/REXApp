var cache = {};
var qs = document.querySelector.bind(document);

var getConfigData = new Promise(function(resolve, reject){
  const CONFIG_URL = 'http://api.rexapp.ro/v1/config';
  JSONP({ url: CONFIG_URL, success: (data) => resolve(data.config) });
})

function _setupCache(data){
  window.cache.banks = data.banks;
  return data;
}

function _setupCurrencySelect(data){
  var currencies = data.currencies,
      host       = qs('#currency'),
      currCode   = qs('#active_currency_code'),
      currName   = qs('#active_currency_name'),
      tags       = [],
      code, name;

  for (code in currencies){
      name = currencies[code].name;
      tags.push(`<option value="${code}" data-name="${name}">${code} - ${name}</option>\n`)
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

  form.addEventListener('submit', (e) => {

    var query = {
      operation: (e.target.operation.value === 'buy') ? 'sell' : 'buy',
      currency: e.target.currency.value,
      amount:  e.target.amount.value
    }

    _getResults(query).then(_renderResults);

    e.preventDefault();
  })
}

function _getResults(query){

  return new Promise(function(resolve, reject){
    var URL = `http://api.rexapp.ro/v1/rates/${query.currency}`;

    JSONP({ url: URL, success: (data) =>  {
      var results = data.rates.map( (rate) => {
          var amount = query.amount * rate[query.operation];

          return {
            bank: cache.banks[rate.id].name,
            amount: (amount < 1000) ? amount.toFixed(2) : Math.round(amount),
            operation: query.operation
          }
        }).sort( (a, b) => {
          /*
            Sort results in customer's favor:
            lowest first if bank is selling,
            highest first if bank is buying
          */
          return (query.operation === 'sell') ? a.amount > b.amount : a.amount < b.amount
        })

      resolve(results);
    } });
  })
}

function _renderResults(results){
  var host = qs('#results'),
      best = results[0].amount, // sorted results, best rate is always at the top
      delta, deltaTag;

  host.innerHTML = results.map( (result) => {
    delta = -1 * (best - result.amount);

    if (delta === 0){
      deltaTag = `<div class="delta best-rate">cel mai bun curs</div>`
    } else {
      delta = (result.amount < 1000) ? delta.toFixed(2) : Math.round(delta);
      deltaTag = `<div class="delta">${ Number(delta).toLocaleString('ro-RO') }</div>`
    }

    return `<li class="result__item">
      <span class="bank">${result.bank}</span>
      <div class="rate">
        <div class="total">${Number(result.amount).toLocaleString('ro-RO')}</div>
        ${deltaTag}
      </div>
    </li>`
  }).join('');
}

function _init(){
  qs('#search').submit.click();
}

getConfigData
  .then(_setupCache)
  .then(_setupCurrencySelect)
  .then(_setupSearchForm)
  .then(_init)

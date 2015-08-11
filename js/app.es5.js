"use strict";

var cache = {};
var qs = document.querySelector.bind(document);

var getConfigData = new Promise(function (resolve, reject) {
  var CONFIG_URL = 'http://api.rexapp.ro/v1/config';
  JSONP({ url: CONFIG_URL, success: function success(data) {
      return resolve(data.config);
    } });
});

function _setupCache(data) {
  window.cache.banks = data.banks;
  return data;
}

function _setupCurrencySelect(data) {
  var currencies = data.currencies,
      host = qs('#currency'),
      currCode = qs('#active_currency_code'),
      currName = qs('#active_currency_name'),
      tags = [],
      code,
      name;

  for (code in currencies) {
    name = currencies[code].name;
    tags.push('<option value="' + code + '" data-name="' + name + '">' + code + ' - ' + name + '</option>\n');
  }

  host.innerHTML = tags.join('');
  host.addEventListener('change', function (e) {
    currCode.textContent = e.target.value;
    currName.textContent = e.target.selectedOptions[0].dataset.name;
    e.target.blur();
  });

  host.selectedIndex = 0;
  host.dispatchEvent(new Event('change'));
}

function _setupSearchForm() {
  var form = qs('#search');

  form.addEventListener('submit', function (e) {

    var query = {
      operation: e.target.operation.value === 'buy' ? 'sell' : 'buy',
      currency: e.target.currency.value,
      amount: e.target.amount.value
    };

    _getResults(query).then(_renderResults);

    e.preventDefault();
  });
}

function _getResults(query) {

  return new Promise(function (resolve, reject) {
    var URL = 'http://api.rexapp.ro/v1/rates/' + query.currency;

    JSONP({ url: URL, success: function success(data) {
        var results = data.rates.map(function (rate) {
          var amount = query.amount * rate[query.operation];

          return {
            bank: cache.banks[rate.id].name,
            amount: amount,
            operation: query.operation
          };
        }).sort(function (a, b) {
          /*
            Sort results in customer's favor:
            lowest first if bank is selling,
            highest first if bank is buying
          */
          return query.operation === 'sell' ? a.amount > b.amount : a.amount < b.amount;
        });

        resolve(results);
      } });
  });
}

function _renderResults(results) {
  var host = qs('#results'),
      best = results[0].amount,
      // sorted results, best rate is always at the top
  amount,
      delta,
      sign,
      rateClass;

  host.innerHTML = results.map(function (result) {
    amount = result.amount;
    delta = -1 * (best - amount);
    sign = delta > 0 ? "+" : "";
    rateClass = delta === 0 ? "best-rate" : "";

    if (delta === 0) {
      delta = "cel mai bun curs";
    } else {
      delta = result.amount < 1000 ? Number(delta).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : Number(delta).toLocaleString('ro-RO', Math.round(delta));
    }

    amount = result.amount < 1000 ? Number(amount).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : Number(amount).toLocaleString('ro-RO', Math.round(amount));

    return '<li class="result__item">\n      <span class="bank">' + result.bank + '</span>\n      <div class="rate">\n        <div class="total">' + amount + '</div>\n        <div class="delta ' + rateClass + '">' + sign + delta + '</div>\n      </div>\n    </li>';
  }).join('');
}

function _init() {
  qs('#search').submit.click();
}

getConfigData.then(_setupCache).then(_setupCurrencySelect).then(_setupSearchForm).then(_init);

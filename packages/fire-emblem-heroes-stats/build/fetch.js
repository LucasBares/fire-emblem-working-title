import fetch from 'isomorphic-fetch';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';
import { compose, last, map, prop, replace, split, toPairs, zipObj } from 'ramda';

import { WIKI_HOST } from './constants';

/**
 * Raw data fetchers
 */

export const fetchPage = url =>
  fetch(url)
    .then(response => {
      if (!response.ok) return Promise.reject({ type: '404' });
      return response.text();
    })
    .then(replace(/\n|\r/g, ''))
    .catch(() => {
      console.error('failed to fetch: ', url);
      console.log('retrying');
      return fetchPage(url);
    });

// Takes a url prefix, a list of page names, and a parse function.
// Returns a map from page name to parsed page.
export async function fetchAndParsePages(host, pageNames, parseFunction) {
  return zipObj(
    pageNames,
    await Promise.all(
      map(
        compose(
          promise => {
            return promise.then(parseFunction).catch(err => {
              console.error(parseFunction.name + ': ', err);
              return [];
            });
          },
          fetchPage,
          pageName => `${host}/${encodeURIComponent(pageName)}`,
        ),
      )(pageNames),
    ).catch(err => console.error('fetchAndParsePages:', err)),
  );
}

/**
 * Download an image and save it into assets, with the same name.
 */
export const fetchImage = url => {
  // extract a filename with a consistent naming scheme from our url
  const fileName = compose(
    replace(/_/g, (match, offset) => (offset < 20 ? match : ' ')),
    decodeURIComponent,
    last,
    split('/'),
    prop('pathname'),
    url => new URL(url),
  )(url);

  const filePath = path.join(__dirname, `../assets/${fileName}`);

  if (!fs.existsSync(filePath)) {
    fetch(url).then(response => {
      if (!response.ok) return Promise.reject({ type: '404' });

      const file = fs.createWriteStream(filePath);
      response.body.pipe(file);
    });
  }
};

/**
 * Use the semantic media wiki Ask API to submit an Ask Query string.
 *
 * @see {@link https://feheroes.gamepedia.com/Special:ApiSandbox}
 *
 * @param {*} queryString The Ask API Query string format.
 */
export const fetchAskApiQuery = queryString => {
  return fetch(
    `${WIKI_HOST}/api.php?action=ask&format=json&query=${encodeURIComponent(
      queryString,
    )}`,
  ).then(response => response.json());
};

/**
 * Make a request to the mediawiki API with arbitrary query parameters.
 *
 * @see {@link https://feheroes.gamepedia.com/Special:ApiSandbox}
 *
 * @param {*} queryParams An object containing query params as key-value pairs
 */
export const fetchApiQuery = (queryParams: { [param: string]: string }) => {
  const defaultQueryParams = {
    action: 'query',
    format: 'json',
  };

  const queryParamString = map(
    ([param, value]) => `${param}=${value}`,
    toPairs({ ...defaultQueryParams, ...queryParams }),
  ).join('&');

  return fetch(
    `${WIKI_HOST}/api.php?${queryParamString}`,
  ).then(response => response.json());
};

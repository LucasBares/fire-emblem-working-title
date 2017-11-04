import {
  compose,
  dissoc,
  filter,
  flatten,
  identity,
  indexBy,
  isNil,
  map,
  match,
  not,
  pick,
  prop,
  replace,
  split,
  tail,
  test,
  trim,
  zipObj,
} from 'ramda';

import { camelCase, maybeToNumber } from './util';

/**
 * HTML parsers
 */

// Takes an html table and returns a list of objects corresponding to rows in the table.
// The keys of the object come from cells in the header and the values come from cells in the row
export const parseTable = tableHtml => {
  const tableHeader = compose(
    map(
      compose(
        replace(/unlock/g, 'rarity'), // Some tables use unlock others use rarity
        replace(/effects|specialEffects/g, 'effect'), // Standardize phrasing
        camelCase,
        trim,
        replace(/<[^>]*?>/g, ''), // Remove all html tags (th, span)
      ),
    ),
    match(/<th(\s[^>]*?)?>.*?<\/th[^>]*?>/g), // Match <th> tags without matching <thead>
  )(tableHtml);

  // Some tables wrap the header in <tr> tags and others do not.
  const firstRow = match(/<tr[^>]*?>.*?<\/tr.*?>/g, tableHtml)[0];
  const isFirstRowHeader = test(/<th(\s[^>]*?)?>.*?<\/th[^>]*?>/g, firstRow);

  const tableRows = compose(
    map(
      compose(
        map(
          compose(
            maybeToNumber,
            trim,
            replace(/<[^>]*?>/g, ''), // Remove all html tags (td, a, span, img, b)
          ),
        ),
        match(/<td[^>]*?>.*?<\/td>/g),
      ),
    ),
    isFirstRowHeader ? tail : identity,
    match(/<tr[^>]*?>.*?<\/tr.*?>/g),
    replace(/&#160;/g, ''), // &nbsp, also known as \xa0
    replace(/Beast/g, 'Breath'), // Images say Beast but the weapon is a Breath.
    replace(/<img[^>]*?Green check[^>]*?>/g, 'Yes'), // Replace Checkmark with Yes.
    replace(/<img[^>]*?Dark Red x[^>]*?>/g, 'No'), // Replace red X with No.
  )(tableHtml);
  // Some tables have a column of icons, ignore that.
  return map(dissoc(''), map(zipObj(tableHeader), tableRows));
};

// Takes a table class name and returns a function to match and parse all tables on a page
export const parseTables = tableClass =>
  compose(
    flatten,
    map(parseTable),
    filter(compose(not, isNil)),
    match(new RegExp('<table[^>]*?' + tableClass + '[^>]*?>.*?</table>', 'g')),
  );

// Takes the html page for a hero and parses all skill tables
const parseHeroSkills = compose(
  map(pick(['name', 'default', 'rarity'])),
  parseTables('skills-table'),
);

// Takes a parsed stat table and restructures it to be by rarity and have stat variants
// [ {rarity, stat: "lo/med/high"}, ] -> {rarity: {stat: [lo, med, high]} }
const processStatTable = compose(
  map(map(compose(map(maybeToNumber), split('/'), x => x.toString()))), // For each rarity and stat
  map(dissoc('rarity')),
  indexBy(prop('rarity')),
);

// Takes the html page for a hero and parses all stat tables
// outputs {1: {rarity: {stat: number}}, 40: {rarity: {stat: [lo med high]}}}
const parseHeroStats = compose(
  processedTables => ({
    '1': map(
      // for each rarity
      map(
        // for each stat
        variations => (variations.length == 3 ? variations[1] : variations[0]),
      ),
      processedTables[0],
    ),
    '40': processedTables[1],
  }),
  map(processStatTable),
  map(parseTable),
  filter(test(/Rarity/)), // Exclude unrelated tables
  filter(compose(not, test(/ibox/))),
  filter(compose(not, test(/skills-table/))),
  match(/<table[^>]*?>.*?<\/table>/g),
  replace(/(\?+|-+)/g, '-'), // standardize unknown values
);

export function parseHeroStatsAndSkills(heroPageHtml) {
  const skills = parseHeroSkills(heroPageHtml);
  const stats = parseHeroStats(heroPageHtml);
  return { skills, stats };
}

// Takes an html page and parses the only table for stats of all heroes
export const parseHeroAggregateHtml = compose(
  // tap(console.log.bind(console)),
  parseTable,
  // Lon'qu has an HTML entity in his name as of 2017-03-18
  replace(/\&\#39\;/g, "'"),
  // Replace move and weapon type icons with their name
  replace(/\.png[^>]*?>/g, ''),
  replace(/<a[^>]*?><img[^>]*?Icon Class /g, ''),
  replace(/<a[^>]*?><img[^>]*?Icon Move /g, ''),
  replace(/Movement Type/, 'Move Type'),
  replace(/Character Name/, 'Name'),
  prop(0), // match [1] is the actual hero table
  match(/<table.*?\/table>/g),
);
